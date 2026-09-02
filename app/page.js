'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  Coffee, ShoppingCart, Minus, Plus, Trash2, LogOut, Store, Wifi, WifiOff,
  Receipt, CreditCard, Banknote, Smartphone, QrCode, Search, Check, User, Percent,
} from 'lucide-react';

const money = (c) => 'Rp ' + Math.round(c / 100).toLocaleString('id-ID');

function apiHeaders(session) {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': session?.tenant?._id || 'tenant-demo',
    'x-outlet-id': session?.outlet?._id || '',
    'x-user-id': session?.user?._id || '',
  };
}

// ---------- Login ----------
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('owner@demo.com');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pin }) });
      if (!r.ok) throw new Error((await r.json()).error || 'Login failed');
      const data = await r.json();
      onLogin(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4">
      <Card className="w-full max-w-md p-8 bg-slate-900/70 border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-900">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BrewPOS</h1>
            <p className="text-xs text-slate-400">F&B Point of Sale</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-slate-300">PIN</Label>
            <Input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-white" />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold h-11">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-xs text-slate-400 pt-2 space-y-1 border-t border-slate-800 mt-4 pt-3">
            <div className="font-semibold text-slate-300 mb-1">Demo accounts (tap to autofill):</div>
            {[
              { e: 'owner@demo.com', p: '1234', r: 'Owner (both outlets)' },
              { e: 'jkt@demo.com', p: '1111', r: 'Cashier Jakarta' },
              { e: 'bdg@demo.com', p: '2222', r: 'Cashier Bandung' },
            ].map((a) => (
              <button key={a.e} onClick={() => { setEmail(a.e); setPin(a.p); }} className="block w-full text-left hover:text-amber-400 transition">
                <span className="font-mono">{a.e}</span> / <span className="font-mono">{a.p}</span> — {a.r}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Outlet Picker ----------
function OutletPicker({ session, onPick, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl p-8 bg-slate-900/70 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-slate-400 text-sm">Welcome</div>
            <div className="text-2xl font-bold text-white">{session.user.name}</div>
            <Badge variant="outline" className="mt-1 border-amber-500/40 text-amber-400">{session.user.role}</Badge>
          </div>
          <Button variant="ghost" onClick={onLogout} className="text-slate-400 hover:text-white"><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>
        <h2 className="text-lg text-slate-300 mb-4">Select an outlet to start</h2>
        <div className="grid gap-3">
          {session.outlets.map((o) => (
            <button key={o._id} onClick={() => onPick(o)}
              className="p-5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500/50 transition text-left flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Store className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-lg">{o.name}</div>
                <div className="text-sm text-slate-400">{o.address}</div>
                <div className="text-xs text-slate-500 mt-1">Tax {o.taxRate}% · Service {o.serviceRate}%</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- Product Card ----------
function ProductCard({ product, onSelect }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  return (
    <button onClick={() => onSelect(product)}
      className="group bg-card border border-border rounded-2xl p-4 text-left hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 transition flex flex-col">
      <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{product.image}</div>
      <div className="font-semibold text-foreground leading-tight">{product.name}</div>
      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</div>
      <div className="mt-auto pt-2 text-amber-500 font-bold">{money(minPrice)}<span className="text-xs text-muted-foreground font-normal ml-1">from</span></div>
    </button>
  );
}

// ---------- Product Detail Modal (variant + modifier selection) ----------
function ProductModal({ product, modifierGroups, onAdd, onClose }) {
  const [variantId, setVariantId] = useState(product?.variants?.[0]?.id);
  const [mods, setMods] = useState({}); // groupId -> [optionId]
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setVariantId(product.variants?.[0]?.id);
      // preselect required singles
      const init = {};
      (product.modifierGroupIds || []).forEach((gid) => {
        const g = modifierGroups.find((m) => m._id === gid);
        if (g && g.minSelect === 1 && g.maxSelect === 1) init[gid] = [g.options[2]?.id || g.options[0].id];
      });
      setMods(init);
      setQty(1);
    }
  }, [product, modifierGroups]);

  if (!product) return null;

  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  if (!variant) return null;
  const relatedGroups = (product.modifierGroupIds || []).map((gid) => modifierGroups.find((m) => m._id === gid)).filter(Boolean);

  const modPriceAdj = Object.entries(mods).reduce((s, [gid, opts]) => {
    const g = relatedGroups.find((x) => x._id === gid);
    if (!g) return s;
    return s + opts.reduce((ss, oid) => ss + (g.options.find((o) => o.id === oid)?.priceAdj || 0), 0);
  }, 0);
  const lineTotal = (variant.price + modPriceAdj) * qty;

  const toggleMod = (g, optId) => {
    setMods((prev) => {
      const cur = prev[g._id] || [];
      let next;
      if (g.maxSelect === 1) next = [optId];
      else if (cur.includes(optId)) next = cur.filter((x) => x !== optId);
      else if (cur.length < g.maxSelect) next = [...cur, optId];
      else next = cur;
      return { ...prev, [g._id]: next };
    });
  };

  const canAdd = relatedGroups.every((g) => (mods[g._id]?.length || 0) >= g.minSelect);

  const add = () => {
    const payload = {
      productId: product._id,
      variantId,
      qty,
      modifiers: Object.entries(mods).flatMap(([groupId, opts]) => opts.map((optionId) => ({ groupId, optionId }))),
      _display: {
        name: product.name,
        image: product.image,
        variantLabel: variant.label,
        unitPrice: variant.price + modPriceAdj,
        modifierLabels: Object.entries(mods).flatMap(([gid, opts]) => {
          const g = relatedGroups.find((x) => x._id === gid);
          return opts.map((oid) => g.options.find((o) => o.id === oid)?.name).filter(Boolean);
        }),
      },
    };
    onAdd(payload);
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{product.image}</div>
            <div>
              <DialogTitle>{product.name}</DialogTitle>
              <div className="text-sm text-muted-foreground">{product.description}</div>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-2">
          <div className="space-y-5 py-2">
            {product.variants.length > 1 && (
              <div>
                <div className="font-medium mb-2 text-sm">Choose variant</div>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((v) => (
                    <button key={v.id} onClick={() => setVariantId(v.id)}
                      className={`p-3 rounded-lg border text-sm text-left ${variantId === v.id ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-background'}`}>
                      <div className="font-medium">{v.label}</div>
                      <div className="text-xs text-muted-foreground">{money(v.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {relatedGroups.map((g) => (
              <div key={g._id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.minSelect === 1 && g.maxSelect === 1 ? 'Required' : `Choose up to ${g.maxSelect}`}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {g.options.map((o) => {
                    const selected = mods[g._id]?.includes(o.id);
                    return (
                      <button key={o.id} onClick={() => toggleMod(g, o.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-sm ${selected ? 'border-amber-500 bg-amber-500/10' : 'border-border'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded ${g.maxSelect === 1 ? 'rounded-full' : 'rounded'} border ${selected ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground'} flex items-center justify-center`}>
                            {selected && <Check className="h-3 w-3 text-slate-900" />}
                          </div>
                          <span>{o.name}</span>
                        </div>
                        {o.priceAdj > 0 && <span className="text-xs text-muted-foreground">+{money(o.priceAdj)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between">
          <div className="flex items-center gap-2 border rounded-lg">
            <Button size="icon" variant="ghost" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
            <div className="w-8 text-center font-semibold">{qty}</div>
            <Button size="icon" variant="ghost" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button disabled={!canAdd} onClick={add} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold h-11">
            Add to cart · {money(lineTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Payment Modal ----------
function PaymentModal({ open, onClose, totals, onPay }) {
  const [method, setMethod] = useState('Cash');
  const [cash, setCash] = useState('');
  const grand = totals.grand;

  useEffect(() => { if (open) { setMethod('Cash'); setCash(''); } }, [open]);

  const cashNum = Math.round(Number(cash || 0)) * 100;
  const change = method === 'Cash' ? Math.max(0, cashNum - grand) : 0;
  const canPay = method !== 'Cash' || cashNum >= grand;

  const quickCash = [0, 50000, 100000, 200000].map((v) => v || Math.ceil(grand / 100 / 10000) * 10000);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted p-4">
            <div className="text-sm text-muted-foreground">Amount to pay</div>
            <div className="text-3xl font-bold text-amber-500">{money(grand)}</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Payment method</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: 'Cash', icon: Banknote },
                { k: 'QRIS', icon: QrCode },
                { k: 'Debit/Credit', icon: CreditCard },
                { k: 'E-Wallet', icon: Smartphone },
              ].map(({ k, icon: I }) => (
                <button key={k} onClick={() => setMethod(k)}
                  className={`p-3 rounded-lg border flex items-center gap-2 ${method === k ? 'border-amber-500 bg-amber-500/10' : 'border-border'}`}>
                  <I className="h-4 w-4" /> <span className="text-sm font-medium">{k}</span>
                </button>
              ))}
            </div>
          </div>

          {method === 'Cash' && (
            <div>
              <div className="text-sm font-medium mb-2">Cash received</div>
              <Input inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ''))} placeholder="0" className="h-12 text-xl font-semibold" />
              <div className="flex gap-2 mt-2">
                {quickCash.map((v) => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setCash(String(v))}>Rp {v.toLocaleString('id-ID')}</Button>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Change</span>
                <span className="font-semibold">{money(change)}</span>
              </div>
            </div>
          )}

          {method !== 'Cash' && (
            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              For demo purposes, {method} payment will be marked as successful automatically.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canPay} onClick={() => onPay({ method, amountCents: method === 'Cash' ? cashNum : grand })}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
            Charge {money(grand)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Receipt Modal ----------
function ReceiptModal({ order, onClose }) {
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="text-center py-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-xl font-bold">Payment Successful</div>
          <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('id-ID')}</div>
        </div>
        <div className="border-t border-dashed pt-3 space-y-2 text-sm font-mono">
          <div className="flex justify-between"><span>Order #</span><span className="font-semibold">{order.orderNumber}</span></div>
          <div className="flex justify-between"><span>Outlet</span><span>{order.outletName}</span></div>
          <div className="flex justify-between"><span>Type</span><span>{order.orderType}</span></div>
        </div>
        <div className="border-t border-dashed pt-3 space-y-2 text-sm">
          {order.items.map((it, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <span>{it.qty}x {it.productName} <span className="text-muted-foreground">({it.variantLabel})</span></span>
                <span>{money(it.lineTotalCents)}</span>
              </div>
              {it.modifiers.length > 0 && (
                <div className="text-xs text-muted-foreground pl-4">
                  {it.modifiers.map((m) => m.optionName).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-dashed pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotalCents)}</span></div>
          {order.discountCents > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{money(order.discountCents)}</span></div>}
          <div className="flex justify-between"><span>Service</span><span>{money(order.serviceCents)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{money(order.taxCents)}</span></div>
          <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="text-amber-500">{money(order.grandTotalCents)}</span></div>
        </div>
        <div className="border-t border-dashed pt-3 text-sm">
          {order.payments.map((p, i) => (
            <div key={i} className="flex justify-between"><span>{p.method}</span><span>{money(p.amountCents)}</span></div>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground pt-3">Thank you for your visit!</div>
        <DialogFooter>
          <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold" onClick={onClose}>New Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- POS Screen ----------
function POSScreen({ session, onSwitchOutlet, onLogout }) {
  const [catalog, setCatalog] = useState(null);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [orderType, setOrderType] = useState('Dine-in');
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/catalog', { headers: apiHeaders(session) });
      if (r.ok) setCatalog(await r.json());
    })();
  }, [session]);

  const filteredProducts = useMemo(() => {
    if (!catalog) return [];
    let list = catalog.products;
    if (activeCat !== 'all') list = list.filter((p) => p.categoryId === activeCat);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }
    return list;
  }, [catalog, activeCat, search]);

  const addToCart = (item) => {
    setCart((c) => [...c, { ...item, _cartId: uuidv4() }]);
    toast.success(`${item._display.name} added`);
  };

  const updateQty = (cartId, delta) => {
    setCart((c) => c.map((i) => i._cartId === cartId ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const removeItem = (cartId) => setCart((c) => c.filter((i) => i._cartId !== cartId));

  const subtotal = cart.reduce((s, i) => s + i._display.unitPrice * i.qty, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const service = Math.round((afterDiscount * (session.outlet.serviceRate || 0)) / 100);
  const tax = Math.round(((afterDiscount + service) * (session.outlet.taxRate || 0)) / 100);
  const grand = afterDiscount + service + tax;

  const doCheckout = async (payment) => {
    const idempotencyKey = uuidv4();
    const payload = {
      idempotencyKey,
      orderType,
      discountCents: discount,
      items: cart.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, modifiers: i.modifiers })),
      payments: [payment],
    };
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: apiHeaders(session), body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json()).error || 'Order failed');
      const order = await r.json();
      setReceipt(order);
      setCart([]);
      setDiscount(0);
      setPayOpen(false);
      toast.success('Order created: ' + order.orderNumber);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left: Catalog */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="border-b bg-card/50 backdrop-blur px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900"><Coffee className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{session.outlet.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" /> {session.user.name} · {session.user.role}
            </div>
          </div>
          <Badge variant="outline" className={online ? 'text-green-500 border-green-500/40' : 'text-red-500 border-red-500/40'}>
            {online ? <><Wifi className="h-3 w-3 mr-1" /> Online</> : <><WifiOff className="h-3 w-3 mr-1" /> Offline</>}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onSwitchOutlet}><Store className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
        </header>

        <div className="px-4 py-3 flex items-center gap-3 border-b">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
          </div>
        </div>

        {catalog && (
          <div className="px-4 py-3 border-b overflow-x-auto">
            <Tabs value={activeCat} onValueChange={setActiveCat}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {catalog.categories.map((c) => (
                  <TabsTrigger key={c._id} value={c._id}>{c.icon} {c.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto">
          {!catalog ? (
            <div className="text-center text-muted-foreground py-20">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((p) => (
                <ProductCard key={p._id} product={p} onSelect={setModalProduct} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 border-l bg-card flex flex-col md:sticky md:top-0 md:h-screen">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <div className="font-bold flex-1">Current Order</div>
          <Badge variant="secondary">{cart.length} items</Badge>
        </div>

        <div className="px-4 py-3 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">Order Type</div>
          <div className="grid grid-cols-3 gap-1.5">
            {['Dine-in', 'Takeaway', 'Delivery'].map((t) => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`py-2 rounded-lg text-xs font-medium border ${orderType === t ? 'bg-amber-500 text-slate-900 border-amber-500' : 'border-border'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {cart.length === 0 && (
              <div className="text-center text-muted-foreground py-16 text-sm">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Cart is empty
              </div>
            )}
            {cart.map((i) => (
              <div key={i._cartId} className="bg-muted rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-2xl">{i._display.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-tight">{i._display.name}</div>
                    <div className="text-xs text-muted-foreground">{i._display.variantLabel}</div>
                    {i._display.modifierLabels?.length > 0 && (
                      <div className="text-xs text-muted-foreground truncate">+ {i._display.modifierLabels.join(', ')}</div>
                    )}
                    <div className="text-xs text-amber-500 font-medium mt-1">{money(i._display.unitPrice)} × {i.qty}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeItem(i._cartId)} className="h-7 w-7 text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-background rounded-md border">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(i._cartId, -1)}><Minus className="h-3 w-3" /></Button>
                    <div className="w-6 text-center text-sm font-semibold">{i.qty}</div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(i._cartId, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <div className="font-semibold text-sm">{money(i._display.unitPrice * i.qty)}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Input inputMode="numeric" placeholder="Discount (Rp)" value={discount ? String(discount / 100) : ''}
              onChange={(e) => setDiscount(Math.round(Number(e.target.value.replace(/\D/g, '') || 0)) * 100)}
              className="h-9" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{money(discount)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Service ({session.outlet.serviceRate}%)</span><span>{money(service)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax ({session.outlet.taxRate}%)</span><span>{money(tax)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-amber-500">{money(grand)}</span></div>
          </div>
          <Button disabled={cart.length === 0} onClick={() => setPayOpen(true)}
            className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-base">
            <Receipt className="h-5 w-5 mr-2" /> Charge {money(grand)}
          </Button>
        </div>
      </div>

      <ProductModal product={modalProduct} modifierGroups={catalog?.modifierGroups || []} onAdd={addToCart} onClose={() => setModalProduct(null)} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} totals={{ grand }} onPay={doCheckout} />
      <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

// ---------- Root ----------
export default function App() {
  const [session, setSession] = useState(null);
  const [outletChosen, setOutletChosen] = useState(false);

  // hydrate
  useEffect(() => {
    try {
      const s = localStorage.getItem('brewpos_session');
      if (s) {
        const parsed = JSON.parse(s);
        setSession(parsed);
        if (parsed.outlet) setOutletChosen(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (session) localStorage.setItem('brewpos_session', JSON.stringify(session));
  }, [session]);

  const handleLogin = (data) => {
    const auto = data.outlets.length === 1 ? data.outlets[0] : null;
    const next = { ...data, outlet: auto };
    setSession(next);
    if (auto) setOutletChosen(true);
  };

  const pickOutlet = (o) => {
    setSession((s) => ({ ...s, outlet: o }));
    setOutletChosen(true);
  };

  const logout = () => {
    localStorage.removeItem('brewpos_session');
    setSession(null);
    setOutletChosen(false);
  };

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (!outletChosen || !session.outlet) return <OutletPicker session={session} onPick={pickOutlet} onLogout={logout} />;
  return <POSScreen session={session} onSwitchOutlet={() => setOutletChosen(false)} onLogout={logout} />;
}
