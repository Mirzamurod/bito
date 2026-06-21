import bcrypt from 'bcryptjs'

import { connectDB, disconnectDB } from './connection'
import { Category, Order, PaymentEvent, Product, Tenant, User } from '../models'

const PASSWORD = 'password123'

type SeedProduct = {
  name: string
  sku: string
  price: number
  costPrice: number
  stock: number
  category: string
}

const demoProducts: SeedProduct[] = [
  {
    name: 'Espresso',
    sku: 'DEMO-001',
    price: 3.5,
    costPrice: 1.2,
    stock: 100,
    category: 'Beverages',
  },
  {
    name: 'Cappuccino',
    sku: 'DEMO-002',
    price: 4.5,
    costPrice: 1.5,
    stock: 80,
    category: 'Beverages',
  },
  {
    name: 'Green Tea',
    sku: 'DEMO-003',
    price: 2.5,
    costPrice: 0.8,
    stock: 60,
    category: 'Beverages',
  },
  { name: 'Croissant', sku: 'DEMO-004', price: 3.0, costPrice: 1.0, stock: 40, category: 'Bakery' },
  {
    name: 'Blueberry Muffin',
    sku: 'DEMO-005',
    price: 3.25,
    costPrice: 1.1,
    stock: 35,
    category: 'Bakery',
  },
  { name: 'Bagel', sku: 'DEMO-006', price: 2.75, costPrice: 0.9, stock: 50, category: 'Bakery' },
  {
    name: 'Chicken Sandwich',
    sku: 'DEMO-007',
    price: 7.5,
    costPrice: 3.0,
    stock: 25,
    category: 'Food',
  },
  { name: 'Veggie Wrap', sku: 'DEMO-008', price: 6.5, costPrice: 2.5, stock: 20, category: 'Food' },
  {
    name: 'Caesar Salad',
    sku: 'DEMO-009',
    price: 8.0,
    costPrice: 3.2,
    stock: 15,
    category: 'Food',
  },
  {
    name: 'Limited Edition Mug',
    sku: 'DEMO-010',
    price: 15.0,
    costPrice: 6.0,
    stock: 1,
    category: 'Merchandise',
  },
  {
    name: 'Branded T-Shirt',
    sku: 'DEMO-011',
    price: 22.0,
    costPrice: 9.0,
    stock: 12,
    category: 'Merchandise',
  },
]

const otherProducts: SeedProduct[] = [
  {
    name: 'Other Store Coffee',
    sku: 'OTH-001',
    price: 4.0,
    costPrice: 1.4,
    stock: 30,
    category: 'Drinks',
  },
  {
    name: 'Other Store Snack',
    sku: 'OTH-002',
    price: 2.0,
    costPrice: 0.7,
    stock: 45,
    category: 'Snacks',
  },
]

async function clearCollections() {
  await Promise.all([
    PaymentEvent.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
    Tenant.deleteMany({}),
  ])
}

async function seedTenantData(
  tenantName: string,
  slug: string,
  users: Array<{ email: string; role: 'admin' | 'cashier' }>,
  products: SeedProduct[],
) {
  const tenant = await Tenant.create({ name: tenantName, slug })
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  await User.insertMany(
    users.map(user => ({
      tenantId: tenant._id,
      email: user.email,
      passwordHash,
      role: user.role,
    })),
  )

  const categoryNames = [...new Set(products.map(p => p.category))]
  const categories = await Category.insertMany(
    categoryNames.map(name => ({ tenantId: tenant._id, name })),
  )
  const categoryByName = Object.fromEntries(categories.map(c => [c.name, c._id]))

  await Product.insertMany(
    products.map(product => ({
      tenantId: tenant._id,
      categoryId: categoryByName[product.category],
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      version: 0,
    })),
  )

  return tenant
}

async function seed() {
  await connectDB()
  console.log('[seed] Clearing existing data...')
  await clearCollections()

  const demoTenant = await seedTenantData(
    'Demo Store',
    'demo-store',
    [
      { email: 'cashier@demo.com', role: 'cashier' },
      { email: 'admin@demo.com', role: 'admin' },
    ],
    demoProducts,
  )

  const otherTenant = await seedTenantData(
    'Other Store',
    'other-store',
    [{ email: 'cashier@other.com', role: 'cashier' }],
    otherProducts,
  )

  console.log('[seed] Done.')
  console.log('')
  console.log('Tenants:')
  console.log(`  - ${demoTenant.name} (${demoTenant.slug})`)
  console.log(`  - ${otherTenant.name} (${otherTenant.slug})`)
  console.log('')
  console.log('Users (password for all: password123):')
  console.log('  - cashier@demo.com  (cashier, Demo Store)')
  console.log('  - admin@demo.com    (admin, Demo Store)')
  console.log('  - cashier@other.com (cashier, Other Store)')
  console.log('')
  console.log('Products:')
  console.log(
    `  - Demo Store: ${demoProducts.length} products (1 with stock=1: Limited Edition Mug)`,
  )
  console.log(`  - Other Store: ${otherProducts.length} products`)
}

seed()
  .catch(error => {
    console.error('[seed] Failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDB()
  })
