import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';
import { ensureSeed } from '@/lib/seed';
import { v4 as uuidv4 } from 'uuid';

// Enforce Node runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readTenantCtx(request) {
  // Simple context via headers (Phase 1 - no full auth)
  const tenantId = request.headers.get('x-tenant-id') || 'tenant-demo';
  const outletId = request.headers.get('x-outlet-id') || null;
  const userId = request.headers.get('x-user-id') || null;
  return { tenantId, outletId, userId };
}

function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status });
}
function jsonErr(msg, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function handle(request, { params }) {
  await ensureSeed();
  const db = await getDb();
  const method = request.method;
  const pathParts = (await params)?.path || [];
  const route = '/' + pathParts.join('/');
  const ctx = await readTenantCtx(request);

  try {
    // Health
    if (route === '/' || route === '/health') {
      return jsonOk({ ok: true, ts: Date.now() });
    }

    // POST /login  { email, pin }
    if (route === '/login' && method === 'POST') {
      const body = await request.json();
      const user = await db.collection('users').findOne({ email: body.email, pin: body.pin });
      if (!user) return jsonErr('Invalid credentials', 401);
      const outlets = await db.collection('outlets').find({ tenantId: user.tenantId, _id: { $in: user.outletIds } }).toArray();
      const tenant = await db.collection('tenants').findOne({ _id: user.tenantId });
      return jsonOk({ user, tenant, outlets });
    }

    // GET /outlets   (list outlets for current tenant/user)
    if (route === '/outlets' && method === 'GET') {
      const outlets = await db.collection('outlets').find({ tenantId: ctx.tenantId }).toArray();
      return jsonOk(outlets);
    }

    // GET /catalog  (categories, products, modifierGroups)
    if (route === '/catalog' && method === 'GET') {
      if (!ctx.outletId) return jsonErr('Outlet required', 400);
      const [categories, products, modifierGroups, unavail] = await Promise.all([
        db.collection('categories').find({ tenantId: ctx.tenantId }).sort({ order: 1 }).toArray(),
        db.collection('products').find({ tenantId: ctx.tenantId, available: true }).toArray(),
        db.collection('modifierGroups').find({ tenantId: ctx.tenantId }).toArray(),
        db.collection('outletProductAvailability').find({ tenantId: ctx.tenantId, outletId: ctx.outletId, available: false }).toArray(),
      ]);
      const unavailSet = new Set(unavail.map((u) => u.productId));
      const filtered = products.filter((p) => !unavailSet.has(p._id));
      return jsonOk({ categories, products: filtered, modifierGroups });
    }

    // POST /orders  (create order atomically)
    if (route === '/orders' && method === 'POST') {
      const body = await request.json();
      if (!ctx.outletId) return jsonErr('Outlet required', 400);
      const { idempotencyKey, items, discountCents = 0, orderType = 'Dine-in', payments = [], notes = '' } = body;

      if (!items || !items.length) return jsonErr('Cart is empty', 400);

      // Idempotency check: prevent duplicate order for retries
      if (idempotencyKey) {
        const existing = await db.collection('orders').findOne({ tenantId: ctx.tenantId, idempotencyKey });
        if (existing) return jsonOk(existing);
      }

      // Fetch products fresh to snapshot names & prices
      const productIds = [...new Set(items.map((i) => i.productId))];
      const products = await db.collection('products').find({ tenantId: ctx.tenantId, _id: { $in: productIds } }).toArray();
      const modGroups = await db.collection('modifierGroups').find({ tenantId: ctx.tenantId }).toArray();
      const modMap = new Map(modGroups.map((m) => [m._id, m]));

      let subtotalCents = 0;
      const snapItems = items.map((it) => {
        const p = products.find((x) => x._id === it.productId);
        if (!p) throw new Error('Product not found: ' + it.productId);
        const variant = p.variants.find((v) => v.id === it.variantId);
        if (!variant) throw new Error('Variant not found');
        let unit = variant.price;
        const mods = (it.modifiers || []).map((m) => {
          const g = modMap.get(m.groupId);
          const o = g?.options.find((op) => op.id === m.optionId);
          if (!o) throw new Error('Modifier not found');
          unit += o.priceAdj;
          return { groupId: g._id, groupName: g.name, optionId: o.id, optionName: o.name, priceAdj: o.priceAdj };
        });
        const line = unit * it.qty;
        subtotalCents += line;
        return {
          productId: p._id,
          productName: p.name,
          variantId: variant.id,
          variantLabel: variant.label,
          unitPriceCents: unit,
          qty: it.qty,
          modifiers: mods,
          lineTotalCents: line,
          notes: it.notes || '',
        };
      });

      const outlet = await db.collection('outlets').findOne({ _id: ctx.outletId, tenantId: ctx.tenantId });
      if (!outlet) return jsonErr('Outlet not found', 404);

      const afterDiscount = Math.max(0, subtotalCents - Number(discountCents || 0));
      const serviceCents = Math.round((afterDiscount * (outlet.serviceRate || 0)) / 100);
      const taxBase = afterDiscount + serviceCents;
      const taxCents = Math.round((taxBase * (outlet.taxRate || 0)) / 100);
      const grandTotalCents = afterDiscount + serviceCents + taxCents;

      const paidCents = payments.reduce((s, p) => s + Number(p.amountCents || 0), 0);
      const status = paidCents >= grandTotalCents ? 'Paid' : (paidCents > 0 ? 'Open' : 'Draft');

      // Sequential order number per outlet per day
      const today = new Date();
      const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
      const seqDoc = await db.collection('orderSeq').findOneAndUpdate(
        { _id: `${ctx.outletId}-${ymd}` },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      const seq = seqDoc.value?.seq || seqDoc.seq || 1;
      const orderNumber = `${outlet.name.split(' ')[0].toUpperCase().slice(0, 3)}-${ymd}-${String(seq).padStart(4, '0')}`;

      const order = {
        _id: uuidv4(),
        tenantId: ctx.tenantId,
        brandId: outlet.brandId,
        outletId: ctx.outletId,
        outletName: outlet.name,
        orderNumber,
        orderType,
        status,
        items: snapItems,
        subtotalCents,
        discountCents: Number(discountCents || 0),
        serviceCents,
        taxCents,
        grandTotalCents,
        payments: payments.map((p) => ({
          id: uuidv4(),
          method: p.method,
          amountCents: Number(p.amountCents || 0),
          externalRef: p.externalRef || null,
          status: 'Success',
          paidAt: new Date(),
        })),
        cashierId: ctx.userId,
        notes,
        idempotencyKey: idempotencyKey || null,
        createdAt: new Date(),
      };
      await db.collection('orders').insertOne(order);
      return jsonOk(order);
    }

    // GET /orders?limit=20
    if (route === '/orders' && method === 'GET') {
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get('limit') || 20);
      const q = { tenantId: ctx.tenantId };
      if (ctx.outletId) q.outletId = ctx.outletId;
      const orders = await db.collection('orders').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
      return jsonOk(orders);
    }

    // GET /orders/:id
    if (route.startsWith('/orders/') && method === 'GET') {
      const id = pathParts[1];
      const o = await db.collection('orders').findOne({ _id: id, tenantId: ctx.tenantId });
      if (!o) return jsonErr('Not found', 404);
      return jsonOk(o);
    }

    return jsonErr('Not found: ' + route, 404);
  } catch (e) {
    console.error('API error', e);
    return jsonErr(e.message || 'Server error', 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
