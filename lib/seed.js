import { getDb } from './mongo';
import { v4 as uuidv4 } from 'uuid';

// Idempotent seed. Runs once by checking a marker.
export async function ensureSeed() {
  const db = await getDb();
  const marker = await db.collection('_meta').findOne({ _id: 'seed_v1' });
  if (marker) return;

  const tenantId = 'tenant-demo';
  const brandId = 'brand-kopikita';
  const outletA = 'outlet-jakarta';
  const outletB = 'outlet-bandung';

  await db.collection('tenants').insertOne({ _id: tenantId, name: 'Demo F&B Group', createdAt: new Date() });
  await db.collection('brands').insertOne({ _id: brandId, tenantId, name: 'KopiKita', logo: '☕', createdAt: new Date() });
  await db.collection('outlets').insertMany([
    { _id: outletA, tenantId, brandId, name: 'KopiKita Jakarta - Sudirman', address: 'Jl. Sudirman No. 1', taxRate: 10, serviceRate: 5, currency: 'IDR' },
    { _id: outletB, tenantId, brandId, name: 'KopiKita Bandung - Dago', address: 'Jl. Dago No. 88', taxRate: 10, serviceRate: 5, currency: 'IDR' },
  ]);

  await db.collection('users').insertMany([
    { _id: 'user-owner', tenantId, name: 'Owner Demo', email: 'owner@demo.com', pin: '1234', role: 'Owner', outletIds: [outletA, outletB] },
    { _id: 'user-cashier-jkt', tenantId, name: 'Kasir Jakarta', email: 'jkt@demo.com', pin: '1111', role: 'Cashier', outletIds: [outletA] },
    { _id: 'user-cashier-bdg', tenantId, name: 'Kasir Bandung', email: 'bdg@demo.com', pin: '2222', role: 'Cashier', outletIds: [outletB] },
  ]);

  const categories = [
    { _id: 'cat-coffee', tenantId, brandId, name: 'Coffee', icon: '☕', order: 1 },
    { _id: 'cat-tea', tenantId, brandId, name: 'Tea', icon: '🍵', order: 2 },
    { _id: 'cat-bites', tenantId, brandId, name: 'Bites', icon: '🥐', order: 3 },
    { _id: 'cat-dessert', tenantId, brandId, name: 'Dessert', icon: '🍰', order: 4 },
  ];
  await db.collection('categories').insertMany(categories);

  // Modifier groups
  const modSugar = {
    _id: 'mod-sugar', tenantId, brandId, name: 'Sugar Level', minSelect: 1, maxSelect: 1,
    options: [
      { id: 'sug-0', name: 'No Sugar', priceAdj: 0 },
      { id: 'sug-half', name: 'Less Sugar', priceAdj: 0 },
      { id: 'sug-normal', name: 'Normal', priceAdj: 0 },
      { id: 'sug-extra', name: 'Extra Sugar', priceAdj: 0 },
    ],
  };
  const modTopping = {
    _id: 'mod-topping', tenantId, brandId, name: 'Topping', minSelect: 0, maxSelect: 3,
    options: [
      { id: 'top-pearl', name: 'Boba Pearl', priceAdj: 500000 }, // Rp 5,000 -> 500000 cents
      { id: 'top-pudding', name: 'Pudding', priceAdj: 600000 },
      { id: 'top-jelly', name: 'Grass Jelly', priceAdj: 400000 },
    ],
  };
  const modShot = {
    _id: 'mod-shot', tenantId, brandId, name: 'Extra Shot', minSelect: 0, maxSelect: 2,
    options: [
      { id: 'shot-1', name: '+1 Shot Espresso', priceAdj: 800000 },
    ],
  };
  await db.collection('modifierGroups').insertMany([modSugar, modTopping, modShot]);

  // Products with variants (size + temp)
  const sizeDim = { name: 'Size', options: ['Regular', 'Large'] };
  const tempDim = { name: 'Temperature', options: ['Hot', 'Iced'] };

  const makeVariants = (base) => {
    const list = [];
    for (const t of tempDim.options) {
      for (const s of sizeDim.options) {
        list.push({
          id: uuidv4(),
          label: `${t} · ${s}`,
          attrs: { Temperature: t, Size: s },
          price: base + (s === 'Large' ? 800000 : 0) + (t === 'Iced' ? 300000 : 0),
        });
      }
    }
    return list;
  };

  const products = [
    { _id: 'p-latte', tenantId, brandId, categoryId: 'cat-coffee', name: 'Cafe Latte', description: 'Espresso + steamed milk', image: '🥛', dims: [tempDim, sizeDim], variants: makeVariants(3500000), modifierGroupIds: ['mod-sugar', 'mod-shot'], available: true },
    { _id: 'p-cappu', tenantId, brandId, categoryId: 'cat-coffee', name: 'Cappuccino', description: 'Espresso + foam', image: '☕', dims: [tempDim, sizeDim], variants: makeVariants(3500000), modifierGroupIds: ['mod-sugar', 'mod-shot'], available: true },
    { _id: 'p-americano', tenantId, brandId, categoryId: 'cat-coffee', name: 'Americano', description: 'Espresso + hot water', image: '🍵', dims: [tempDim, sizeDim], variants: makeVariants(2800000), modifierGroupIds: ['mod-sugar', 'mod-shot'], available: true },
    { _id: 'p-mocha', tenantId, brandId, categoryId: 'cat-coffee', name: 'Cafe Mocha', description: 'Espresso + chocolate + milk', image: '🍫', dims: [tempDim, sizeDim], variants: makeVariants(4000000), modifierGroupIds: ['mod-sugar', 'mod-shot'], available: true },
    { _id: 'p-matcha', tenantId, brandId, categoryId: 'cat-tea', name: 'Matcha Latte', description: 'Premium Uji matcha', image: '🍵', dims: [tempDim, sizeDim], variants: makeVariants(4200000), modifierGroupIds: ['mod-sugar', 'mod-topping'], available: true },
    { _id: 'p-milktea', tenantId, brandId, categoryId: 'cat-tea', name: 'Milk Tea', description: 'Classic black milk tea', image: '🧋', dims: [tempDim, sizeDim], variants: makeVariants(3200000), modifierGroupIds: ['mod-sugar', 'mod-topping'], available: true },
    { _id: 'p-croissant', tenantId, brandId, categoryId: 'cat-bites', name: 'Butter Croissant', description: 'Flaky French pastry', image: '🥐', dims: [], variants: [{ id: uuidv4(), label: 'Default', attrs: {}, price: 2500000 }], modifierGroupIds: [], available: true },
    { _id: 'p-sandwich', tenantId, brandId, categoryId: 'cat-bites', name: 'Chicken Sandwich', description: 'Grilled chicken with pesto', image: '🥪', dims: [], variants: [{ id: uuidv4(), label: 'Default', attrs: {}, price: 4500000 }], modifierGroupIds: [], available: true },
    { _id: 'p-tiramisu', tenantId, brandId, categoryId: 'cat-dessert', name: 'Tiramisu', description: 'Classic Italian dessert', image: '🍰', dims: [], variants: [{ id: uuidv4(), label: 'Default', attrs: {}, price: 3800000 }], modifierGroupIds: [], available: true },
    { _id: 'p-cheesecake', tenantId, brandId, categoryId: 'cat-dessert', name: 'NY Cheesecake', description: 'Rich cream cheese', image: '🧀', dims: [], variants: [{ id: uuidv4(), label: 'Default', attrs: {}, price: 4200000 }], modifierGroupIds: [], available: true },
  ];
  await db.collection('products').insertMany(products);

  // Per-outlet availability (all available at both outlets, but Bandung out of stock for cheesecake)
  await db.collection('outletProductAvailability').insertMany([
    { tenantId, outletId: outletB, productId: 'p-cheesecake', available: false },
  ]);

  await db.collection('_meta').insertOne({ _id: 'seed_v1', createdAt: new Date() });
}
