# BITO POS — Implementatsiya rejasi

> **Maqsad:** Multi-tenant SaaS POS tizimini bitta uzluksiz workflow sifatida qurish.  
> **Stack:** Next.js (TypeScript) + shadcn/ui | Express (TypeScript) | MongoDB | Docker  
> **Vaqt byudjeti:** ~6–8 soat  
> **Asosiy prinsip:** Har bir bosqich keyingisiga bog‘liq. Erta noto‘g‘ri qaror kech bosqichda sinadi.

---

## Mundarija

1. [Arxitektura va tizim ko‘rinishi](#1-arxitektura-va-tizim-ko'rinishi)
2. [Repo strukturasi](#2-repo-strukturasi)
3. [Data model (MongoDB)](#3-data-model-mongodb)
4. [Umumiy konvensiyalar va env](#4-umumiy-konvensiyalar-va-env)
5. [Bosqich 0 — Loyiha poydevori va Docker](#5-bosqich-0--loyiha-poydevori-va-docker)
6. [Bosqich 1 — Login va identity (spine)](#6-bosqich-1--login-va-identity-spine)
7. [Bosqich 2 — Katalog qidiruv (N+1 + index)](#7-bosqich-2--katalog-qidiruv-n1--index)
8. [Bosqich 3 — Savat (client state)](#8-bosqich-3--savat-client-state)
9. [Bosqich 4 — Buyurtma (atomiklik + no-oversell)](#9-bosqich-4--buyurtma-atomiklik--no-oversell)
10. [Bosqich 5 — Payment webhook (HMAC + idempotent)](#10-bosqich-5--payment-webhook-hmac--idempotent)
11. [Bosqich 6 — Chek va margin chegarasi](#11-bosqich-6--chek-va-margin-chegarasi)
12. [Bosqich 7 — Admin sales report (aggregation + cache)](#12-bosqich-7--admin-sales-report-aggregation--cache)
13. [Missing/unknown tenant (ataylab noaniqlik)](#13-missingunknown-tenant-ataylab-noaniqlik)
14. [Frontend sahifalar va routing (Next.js)](#14-frontend-sahifalar-va-routing-nextjs)
15. [Seed data va test foydalanuvchilar](#15-seed-data-va-test-foydalanuvchilar)
16. [DECISIONS.md yozish rejasi](#16-decisionsmd-yozish-rejasi)
17. [Tekshirish checklist (automatic concerns)](#17-tekshirish-checklist-automatic-concerns)
18. [Topshirish va live review tayyorgarligi](#18-topshirish-va-live-review-tayyorgarligi)
19. [Vaqt taqsimoti (prioritet)](#19-vaqt-taqsimoti-prioritet)

---

## 1. Arxitektura va tizim ko‘rinishi

```
┌─────────────────┐         JWT (tenantId + role)         ┌──────────────────┐
│  Next.js App    │  ───────────────────────────────────► │  Express API     │
│  (shadcn/ui)    │         /api/* proxy yoki to‘g‘ridan  │  /api/*          │
└─────────────────┘                                       └────────┬─────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┤
                    │                                              │
              ┌─────▼─────┐                              ┌─────────▼──────────┐
              │  MongoDB  │                              │ Payment Provider   │
              │           │◄──── POST /webhooks/payment ─│ (simulyator/script)│
              └───────────┘                              └────────────────────┘
```

### Rol va tenant oqimi (butun tizimning umurtqa pog‘onasi)

```
Login → JWT { userId, tenantId, role } → auth middleware → tenant filter (har query)
                                                      → role guard (admin-only endpointlar)
                                                      → DTO layer (cashier uchun costPrice/margin yo‘q)
```

**Muhim:** Tenant va role faqat JWT dan olinadi. Client body/header/query orqali tenant yuborsa ham **e’tiborsiz qoldiriladi** yoki rad etiladi.

### Order state machine

```
pending_payment ──(webhook, idempotent)──► paid
       │                                      │
       └── rad etilgan checkout               └── faqat paid → chek + report revenue
```

---

## 2. Repo strukturasi

Monorepo yoki alohida papkalar — ikkalasi ham bo‘ladi. Tavsiya:

```
bito/
├── docker-compose.yml
├── .env.example
├── DECISIONS.md
├── PLAN.md
├── TASK.md
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # server entry
│       ├── config/env.ts
│       ├── db/
│       │   ├── connection.ts
│       │   └── seed.ts
│       ├── models/
│       │   ├── Tenant.ts
│       │   ├── User.ts
│       │   ├── Product.ts
│       │   ├── Order.ts
│       │   ├── OrderItem.ts (embedded yoki alohida — bitta qaror)
│       │   ├── PaymentEvent.ts      # webhook idempotency
│       │   └── Category.ts          # N+1 uchun related data (agar kerak bo‘lsa)
│       ├── middleware/
│       │   ├── auth.ts              # JWT verify
│       │   ├── tenant.ts            # tenant context
│       │   ├── roleGuard.ts
│       │   └── errorHandler.ts
│       ├── services/
│       │   ├── authService.ts
│       │   ├── productService.ts
│       │   ├── orderService.ts
│       │   ├── paymentWebhookService.ts
│       │   ├── reportService.ts
│       │   └── cacheService.ts
│       ├── dto/                     # role-based response shaping (DATA LAYER)
│       │   ├── productDto.ts
│       │   └── orderDto.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── products.routes.ts
│       │   ├── orders.routes.ts
│       │   ├── webhooks.routes.ts
│       │   └── reports.routes.ts
│       ├── utils/
│       │   ├── hmac.ts
│       │   └── pagination.ts
│       └── scripts/
│           └── simulatePayment.ts   # webhook yuborish uchun
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── components.json              # shadcn
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx             # redirect login/dashboard
        │   ├── login/page.tsx
        │   ├── pos/
        │   │   ├── page.tsx           # katalog + savat
        │   │   └── receipt/[id]/page.tsx
        │   └── admin/
        │       └── reports/page.tsx
        ├── components/
        │   ├── ui/                  # shadcn
        │   ├── ProductSearch.tsx
        │   ├── Cart.tsx
        │   ├── CheckoutButton.tsx
        │   └── ReceiptView.tsx
        ├── lib/
        │   ├── api.ts               # fetch wrapper + JWT
        │   ├── auth.ts              # token storage (cookie yoki memory)
        │   └── cart-context.tsx     # React context / zustand
        └── types/
            └── index.ts
```

---

## 3. Data model (MongoDB)

Barcha tenant-scoped collectionlarda **`tenantId`** majburiy. Indexlar tenant bilan boshlanadi.

### 3.1 Tenant

```ts
{
  _id: ObjectId,
  name: string,
  slug: string,        // unique
  createdAt: Date
}
```

**Index:** `{ slug: 1 }` unique

### 3.2 User

```ts
{
  _id: ObjectId,
  tenantId: ObjectId,  // ref Tenant
  email: string,
  passwordHash: string,
  role: 'admin' | 'cashier',
  createdAt: Date
}
```

**Index:** `{ tenantId: 1, email: 1 }` unique compound

### 3.3 Category (N+1 muammosi uchun related entity)

Shell “har product uchun alohida category query” qiladi deb faraz qilingan. Buni `$lookup` yoki populate bilan bir queryga yig‘ing.

```ts
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: string
}
```

**Index:** `{ tenantId: 1, name: 1 }`

### 3.4 Product

```ts
{
  _id: ObjectId,
  tenantId: ObjectId,
  categoryId: ObjectId,
  name: string,
  sku: string,
  price: number,           // sotuv narxi (cashier ko‘radi)
  costPrice: number,       // faqat admin/report — cashier DTO da YO‘Q
  stock: number,           // >= 0 invariant
  version: number,         // optimistic locking uchun (ixtiyoriy lekin tavsiya)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexlar (DECISIONS.md da izohlash kerak):**

| Index                                                                                            | Maqsad                                             |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `{ tenantId: 1, name: 'text', sku: 'text' }` yoki `{ tenantId: 1, name: 1 }` + search strategiya | Qidiruv — tenant birinchi (equality), keyin search |
| `{ tenantId: 1, categoryId: 1 }`                                                                 | Filter/lookup                                      |
| `{ tenantId: 1, sku: 1 }` unique                                                                 | Duplicate oldini olish                             |

**Field order qoidasi:** MongoDB compound indexda **equality filter** (`tenantId`) birinchi, keyin **sort/range** (`name`, `createdAt`).

### 3.5 Order

```ts
{
  _id: ObjectId,
  tenantId: ObjectId,
  cashierId: ObjectId,
  status: 'pending_payment' | 'paid' | 'cancelled',  // minimal set
  items: [{
    productId: ObjectId,
    name: string,           // snapshot (product o‘zgarsa ham order to‘g‘ri)
    quantity: number,
    unitPrice: number,      // SERVER dan yozilgan — checkout vaqtidagi price
    lineTotal: number
  }],
  subtotal: number,
  total: number,
  createdAt: Date,
  paidAt?: Date
}
```

**Index:** `{ tenantId: 1, status: 1, createdAt: -1 }` — report va listing uchun

### 3.6 PaymentEvent (idempotency)

```ts
{
  _id: ObjectId,
  eventId: string,          // payment provider dan — GLOBAL unique
  tenantId: ObjectId,
  orderId: ObjectId,
  processedAt: Date,
  payload: object           // debug uchun (ixtiyoriy)
}
```

**Index:** `{ eventId: 1 }` unique

---

## 4. Umumiy konvensiyalar va env

### 4.1 `.env.example` (backend)

```env
PORT=4000
MONGODB_URI=mongodb://mongo:27017/bito
JWT_SECRET=change-me
JWT_EXPIRES_IN=8h
PAYMENT_WEBHOOK_SECRET=whsec_change_me
NODE_ENV=development
```

### 4.2 `.env.example` (frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4.3 API response format (tavsiya — izchil error handling)

```ts
// Success
{ data: T }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

**Order xatolari uchun aniq kodlar (Stage 3 UI uchun):**

| Code                 | Ma’nosi                         |
| -------------------- | ------------------------------- |
| `INSUFFICIENT_STOCK` | Mahsulot yetarli emas           |
| `PRODUCT_NOT_FOUND`  | Product yo‘q yoki boshqa tenant |
| `INVALID_CART`       | Bo‘sh savat, noto‘g‘ri quantity |
| `ORDER_NOT_FOUND`    |                                 |
| `UNAUTHORIZED`       | Token yo‘q/noto‘g‘ri            |
| `FORBIDDEN`          | Role yetarli emas               |
| `TENANT_INVALID`     | Missing/unknown tenant          |

### 4.4 TypeScript

- Backend va frontend alohida `tsconfig`, strict mode yoqilgan
- Shared types kerak bo‘lsa `packages/types` yoki frontend `types/` da API contract

---

## 5. Bosqich 0 — Loyiha poydevori va Docker

> **Vaqt:** ~45–60 daq  
> **Nima uchun birinchi:** `docker compose up` automatic concern — ishlamasa darhol minus.

### 5.1 Ketma-ketlik

1. **Git repo init** + `.gitignore` (node_modules, .env, .next, dist)
2. **Backend scaffold**
   - Express + TypeScript + ts-node-dev/nodemon
   - `helmet`, `cors`, `express.json()`
   - Health check: `GET /health` → `{ status: 'ok' }`
3. **MongoDB connection** — retry logic bilan
4. **Frontend scaffold**
   - `npx create-next-app@latest` (App Router, TypeScript, Tailwind)
   - shadcn/ui init: `npx shadcn@latest init`
   - Kerakli komponentlar: `button`, `input`, `card`, `table`, `badge`, `toast`, `dialog`, `skeleton`
5. **docker-compose.yml**

```yaml
services:
  mongo:
    image: mongo:7
    ports: ['27017:27017']
    volumes: [mongo_data:/data/db]

  backend:
    build: ./backend
    ports: ['4000:4000']
    env_file: ./backend/.env
    depends_on: [mongo]

  frontend:
    build: ./frontend
    ports: ['3000:3000']
    environment:
      NEXT_PUBLIC_API_URL: http://backend:4000
    depends_on: [backend]

volumes:
  mongo_data:
```

6. **Seed script** — Docker ishga tushganda yoki `npm run seed` bilan (Bosqich 15)
7. **README.md** — `docker compose up --build` va demo loginlar

### 5.2 Tugallanganlik mezoni

- [ ] `docker compose up` xatosiz ishga tushadi
- [ ] Frontend ochiladi, backend `/health` javob beradi
- [ ] MongoDB ulanadi

---

## 6. Bosqich 1 — Login va identity (spine)

> **Vaqt:** ~45–60 daq  
> **TASK Stage:** 1  
> **Keyingi bosqichlarga ta’siri:** Tenant filter, role guard, margin DTO — hammasi shu yerda boshlanadi.

### 6.1 Backend

1. **User model** + bcrypt password hash
2. **`POST /api/auth/login`**
   - Body: `{ email, password }`
   - Tenant email orqali user dan olinadi (client tenant yubormaydi)
   - JWT payload: `{ sub: userId, tenantId, role }`
   - Response: `{ token, user: { id, email, role, tenantId } }`
3. **`auth` middleware**
   - `Authorization: Bearer <token>` parse
   - `req.user = { userId, tenantId, role }`
   - Invalid/expired → `401`
4. **`tenant` middleware** (auth dan keyin)
   - JWT dagi `tenantId` ni `req.tenantId` ga qo‘yish
   - DB da tenant mavjudligini tekshirish (Bosqich 13)
5. **`roleGuard(['admin'])`** — report uchun

### 6.2 JWT qarorlari (DECISIONS.md ga yozish)

- Token qayerda saqlanadi: frontend `httpOnly cookie` (xavfsizroq) yoki `localStorage` (tezroq MVP)
- Refresh token kerak emas (scope tashqarisida) — vaqt tejash
- Har bir DB query: `{ tenantId: req.tenantId, ... }` — **hech qachon client tenantId ga ishonma**

### 6.3 Frontend

1. **`/login` sahifa** — email/password form (shadcn Input + Button)
2. Login muvaffaqiyatli → token saqlash → role bo‘yicha redirect:
   - `cashier` → `/pos`
   - `admin` → `/admin/reports` (yoki `/pos` ham ochiq bo‘lishi mumkin — lekin report faqat admin)
3. **Auth guard** — token yo‘q bo‘lsa `/login`
4. **`lib/api.ts`** — har requestga `Authorization` header

### 6.4 Tugallanganlik mezoni

- [ ] Login JWT qaytaradi
- [ ] Himoyalangan endpoint token siz 401
- [ ] JWT da tenantId + role bor
- [ ] Boshqa tenant user bilan login bo‘lmaydi

---

## 7. Bosqich 2 — Katalog qidiruv (N+1 + index)

> **Vaqt:** ~45–60 daq  
> **TASK Stage:** 2

### 7.1 Muammo (shell holati)

Noto‘g‘ri pattern (N+1):

```
products = find({ tenantId, search })
for each product:
  category = findOne({ _id: product.categoryId })  // N ta qo‘shimcha query!
```

### 7.2 To‘g‘ri yechim

**Variant A (tavsiya):** Aggregation pipeline — bitta query

```js
[
  { $match: { tenantId, $or: [name regex, sku regex] } },
  { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
  { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  { $project: { ...cashierSafeFields } },
  { $skip: (page-1)*limit },
  { $limit: limit }
]
```

**Variant B:** `.populate('categoryId')` — Mongoose bilan ham 1 query (lean + populate)

### 7.3 Backend

1. **`GET /api/products?search=&page=&limit=`**
   - Auth + tenant middleware
   - Pagination default: `page=1`, `limit=20`, max `limit=100`
   - Response shape (cashier DTO):

```ts
{
  data: {
    items: ([{ id, name, sku, price, stock, category: { id, name } }], page, limit, total)
  }
}
```

2. **`costPrice` response da YO‘Q** — DTO layer dan o‘tadi (Stage 6 bilan bir xil layer)
3. **Index yaratish** — `Product.syncIndexes()` yoki migration script
4. **DECISIONS.md:** index field order + qidiruv strategiyasi (text index vs regex)

### 7.4 Frontend

1. **`/pos` sahifasi** — ProductSearch komponenti
2. Debounced search input (300ms)
3. Product card/table: name, price, stock, category
4. "Savatga qo‘shish" tugmasi
5. Loading skeleton, empty state, error toast

### 7.5 Tugallanganlik mezoni

- [ ] 1 ta DB round-trip (N+1 yo‘q)
- [ ] Indexlar yaratilgan
- [ ] Faqat joriy tenant productlari
- [ ] costPrice API response da yo‘q (curl bilan tekshir)

---

## 8. Bosqich 3 — Savat (client state)

> **Vaqt:** ~30–45 daq  
> **TASK Stage:** 3

### 8.1 Client ishonadi (faqat)

```ts
type CartItem = {
  productId: string
  quantity: number
  // UI ko‘rsatish uchun cache (server ishonmaydi):
  displayName?: string
  displayPrice?: number
}
```

### 8.2 Client ishonmaydi (server qayta o‘qadi)

- `price`, `costPrice`, `stock` — checkout vaqtida DB dan
- Client yuborgan narx e’tiborsiz qoldiriladi

### 8.3 Frontend implementatsiya

1. **Cart state:** React Context yoki Zustand (localStorage persist ixtiyoriy)
2. **Cart UI:** items ro‘yxati, +/- quantity, o‘chirish, subtotal (display only)
3. **Checkout tugmasi** → Bosqich 4 API chaqiradi
4. **Error mapping (muhim):**
   - `INSUFFICIENT_STOCK` → "X mahsulotdan faqat Y dona qoldi"
   - `PRODUCT_NOT_FOUND` → "Mahsulot topilmadi, savatni yangilang"
   - Toast + inline xabar

### 8.4 Tuzoq — buni qilmang

- Checkout body da `price` yuborish va server uni qabul qilish ❌
- Server faqat `{ items: [{ productId, quantity }] }` qabul qiladi ✅

### 8.5 Tugallanganlik mezoni

- [ ] Savat CRUD ishlaydi
- [ ] Checkout payload da faqat productId + quantity
- [ ] Xato xabarlari tushunarli

---

## 9. Bosqich 4 — Buyurtma (atomiklik + no-oversell)

> **Vaqt:** ~60–90 daq (eng qiyin backend qism)  
> **TASK Stage:** 4

### 9.1 API

**`POST /api/orders`**

Request (client):

```ts
{
  items: [{ productId: string, quantity: number }]
}
```

Response:

```ts
{ data: { orderId, status: 'pending_payment', total, items: [...] } }
```

### 9.2 Server algoritm (ketma-ketlik)

1. Validate: items bo‘sh emas, quantity > 0, productId format
2. **MongoDB session + transaction** boshlash
3. Har bir item uchun (tartib muhim emas, lekin bitta transaction ichida):
   - Product ni `{ _id, tenantId }` bilan o‘qish (yoki lock)
   - Tenant mos kelmasa → `PRODUCT_NOT_FOUND`
   - `stock < quantity` → **butun transaction abort** → `INSUFFICIENT_STOCK`
   - **Conditional update:**

```js
findOneAndUpdate(
  { _id, tenantId, stock: { $gte: quantity } }, // yoki version check
  { $inc: { stock: -quantity } },
  { new: true, session },
)
// null qaytsa → stock yetarli emas (concurrency)
```

4. Server-side `unitPrice = product.price` (DB dan)
5. Order yaratish: `status: 'pending_payment'`, items snapshot, totals
6. Transaction commit
7. Response — cashier DTO (costPrice yo‘q)

### 9.3 Concurrency strategiyasi (DECISIONS.md da himoya)

**Tavsiya:** Conditional update (`stock: { $gte: quantity }`) + transaction

```
Cashier A va B bir vaqtda oxirgi 1 unit:
- A update match → stock 0, order OK
- B update match fail (stock 0 < 1) → INSUFFICIENT_STOCK, DB o‘zgarmaydi
```

**Qayerda sinadi (halol yozish kerak):**

- Transaction timeout
- MongoDB standalone vs replica set (transaction replica set talab qiladi — Docker da replica set sozlash kerak!)
- Deadlock kam, lekin ko‘p item/order da session vaqt oshishi

### 9.4 MongoDB transaction uchun Docker

> **MUHIM:** MongoDB transaction ishlashi uchun replica set kerak. `docker-compose.yml` da:

```yaml
command: ['--replSet', 'rs0']
# + init script: rs.initiate()
```

Yoki **alternative:** faqat conditional update without multi-doc transaction (single product update atomik) — lekin multi-item order da partial update xavfi bor. **Multi-item uchun transaction shart.**

### 9.5 Frontend

1. Checkout → loading state
2. Muvaffaqiyat → payment kutish ekrani yoki avtomatik simulate payment
3. Xato → savatda item highlight + toast

### 9.6 Tugallanganlik mezoni

- [ ] Order `pending_payment` bilan yaratiladi
- [ ] Narxlar server dan
- [ ] Stock rad etilganda o‘zgarmaydi
- [ ] Concurrent request test: stock manfiy bo‘lmaydi

---

## 10. Bosqich 5 — Payment webhook (HMAC + idempotent)

> **Vaqt:** ~45–60 daq  
> **TASK Stage:** 5

### 10.1 API

**`POST /api/webhooks/payment`**

- Auth middleware **YO‘Q** — HMAC bilan himoya
- Raw body kerak bo‘lishi mumkin (signature uchun) — `express.raw()` yoki `verify` callback

Request (simulyator):

```ts
{
  eventId: string,
  orderId: string,
  tenantId: string,
  status: 'paid'
}
Header: X-Signature: HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)
```

### 10.2 Ishlov berish ketma-ketligi

1. **HMAC verify** — noto‘g‘ri → `401/403`
2. **Idempotency:** `PaymentEvent.findOne({ eventId })` — mavjud bo‘lsa → `200 OK` (hech narsa qilmasdan)
3. Order topish: `{ _id: orderId, tenantId }`
   - Topilmasa → `404` (yoki `200` idempotent style — DECISIONS da izoh)
   - Tenant webhook body vs order tenant mos kelmasa → rad et
4. Order status:
   - Allaqachon `paid` → idempotent OK
   - `pending_payment` → `paid`, `paidAt = now`
   - Boshqa status → xato yoki ignore (qaror)
5. **PaymentEvent** yozish (eventId unique — duplicate race da ikkinchi insert fail → OK)
6. **Cache invalidation** (Stage 7) — report cache tozalash

### 10.3 Edge case: webhook erta keldi

Order hali yaratilmagan → `404 ORDER_NOT_FOUND` + payment provider retry qiladi (standart webhook pattern). DECISIONS.md da yozing.

### 10.4 Simulyator script

`backend/src/scripts/simulatePayment.ts`:

```bash
npm run simulate-payment -- --orderId=... --tenantId=...
```

- HMAC hisoblaydi
- Webhook POST qiladi
- Bir xil eventId ni 2 marta yuborish flag (idempotency test)

### 10.5 Frontend

- Order yaratilgandan keyin "To‘lovni simulyatsiya qilish" tugmasi (dev only) yoki avtomatik chaqirish
- Polling: `GET /api/orders/:id` — status `paid` bo‘lguncha (yoki WebSocket — scope tashqarisida)

### 10.6 Tugallanganlik mezoni

- [ ] Noto‘g‘ri signature rad etiladi
- [ ] Bir xil eventId 2 marta — bitta effect
- [ ] Faqat `paid` order keyingi bosqichga o‘tadi
- [ ] Noto‘g‘ri tenant rad etiladi

---

## 11. Bosqich 6 — Chek va margin chegarasi

> **Vaqt:** ~30–45 daq  
> **TASK Stage:** 6

### 11.1 API

**`GET /api/orders/:id`**

- Auth + tenant
- Cashier: `{ id, status, items[{ name, quantity, unitPrice, lineTotal }], total, createdAt, paidAt }`
- Admin: xuddi shu yoki kengroq — lekin **costPrice/margin faqat report endpoint da**

### 11.2 Data layer DTO (ASOSIY — React emas)

`backend/src/dto/productDto.ts`:

```ts
function toProductDto(product, role) {
  const base = { id, name, sku, price, stock, category }
  if (role === 'admin') {
    /* costPrice faqat admin report/product admin endpoint da */
  }
  return base // cashier: costPrice YO'Q
}
```

**Tekshirish:** `curl -H "Authorization: Bearer <cashier_token>" /api/products` — JSON da `costPrice` qidirish → topilmasin

### 11.3 Chek UI

- `/pos/receipt/[id]`
- Faqat `status === 'paid'` bo‘lsa to‘liq chek
- `pending_payment` → "To‘lov kutilmoqda"
- Print-friendly layout (ixtiyoriy)

### 11.4 Tugallanganlik mezoni

- [ ] Chek to‘g‘ri summalarni ko‘rsatadi
- [ ] Unpaid order uchun "paid chek" yo‘q
- [ ] Cashier token bilan barcha endpointlarda margin/costPrice leak yo‘q

---

## 12. Bosqich 7 — Admin sales report (aggregation + cache)

> **Vaqt:** ~45–60 daq  
> **TASK Stage:** 7

### 12.1 API

**`GET /api/reports/sales?from=&to=`**

- `roleGuard(['admin'])` — cashier → `403`
- Tenant: faqat `req.tenantId`
- Query: ISO date yoki YYYY-MM-DD

### 12.2 Bitta aggregation pipeline

```js
;[
  {
    $match: {
      tenantId,
      status: 'paid',
      paidAt: { $gte: from, $lte: to },
    },
  },
  {
    $facet: {
      topProducts: [
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            qty: { $sum: '$items.quantity' },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 10 },
      ],
      totals: [
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'p',
          },
        },
        { $unwind: '$p' },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$items.lineTotal' },
            margin: {
              $sum: {
                $multiply: ['$items.quantity', { $subtract: ['$items.unitPrice', '$p.costPrice'] }],
              },
            },
          },
        },
      ],
    },
  },
]
```

> **Eslatma:** Margin hisobda order snapshot `unitPrice` va joriy product `costPrice` ishlatiladi — yoki order yaratilganda `costPrice` ni ham snapshot qiling (aniqroq). DECISIONS.md da qaysi birini tanlaganingizni yozing.

**Yaxshiroq variant:** Order item snapshot ga `unitCostPrice` qo‘shish checkout vaqtida — report keyin faqat order dan hisoblaydi (product keyin o‘zgarsa ham to‘g‘ri).

### 12.3 Cache

- Key: `report:${tenantId}:${from}:${to}`
- Store: in-memory `Map` yoki Redis (Docker da memory yetadi MVP uchun)
- TTL: masalan 5 daqiqa
- **Invalidation:** webhook `paid` bo‘lganda shu tenant uchun barcha report cache clear

### 12.4 Frontend

- `/admin/reports` — date range picker (shadcn Calendar)
- Jadval: top products
- Kartalar: total revenue, total margin
- Cashier bu sahifaga kira olmasin (frontend guard + backend 403)

### 12.5 Tugallanganlik mezoni

- [ ] Bitta aggregation pipeline
- [ ] Cashier 403
- [ ] Cache ishlaydi va paid order da invalidate
- [ ] Faqat `paid` orderlar sanaladi

---

## 13. Missing/unknown tenant (ataylab noaniqlik)

Spec aniqlamagan — **qaror qiling va implement qiling.**

### Tavsiya qilinadigan yondashuv

**Qaror:** JWT dagi `tenantId` DB da mavjud emas yoki token da `tenantId` yo‘q → **`403 TENANT_INVALID`** (authenticated lekin context noto‘g‘ri).

**Sabablari:**

- Tenant isolation buzilmaydi
- "Unknown tenant" silent default qilmaslik (boshqa tenant ma’lumotiga slip xavfi)

**Implementatsiya joyi:** `tenant` middleware — auth dan keyin DB lookup:

```ts
const tenant = await Tenant.findById(req.tenantId)
if (!tenant) return res.status(403).json({ error: { code: 'TENANT_INVALID' } })
```

DECISIONS.md band 7 — bir gaplik izoh.

---

## 14. Frontend sahifalar va routing (Next.js)

| Route               | Role           | Maqsad                     |
| ------------------- | -------------- | -------------------------- |
| `/login`            | public         | Login form                 |
| `/pos`              | cashier, admin | Katalog + savat + checkout |
| `/pos/receipt/[id]` | cashier, admin | To‘langan chek             |
| `/admin/reports`    | admin          | Sales report               |

### shadcn/ui komponentlari bo‘yicha UI rejasi

| Komponent          | Qo‘llanishi           |
| ------------------ | --------------------- |
| Input              | Login, search         |
| Button             | Actions               |
| Card               | Product, summary      |
| Table              | Products, top sellers |
| Badge              | Order status          |
| Toast (sonner)     | Errors, success       |
| Skeleton           | Loading               |
| Calendar + Popover | Date range (report)   |

### API client pattern

```ts
// lib/api.ts
async function api<T>(path, options?) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ... }
  });
  if (!res.ok) throw parseApiError(res);
  return res.json();
}
```

Next.js da CORS: backend `cors({ origin: frontend URL })` yoki Next.js `rewrites` proxy.

---

## 15. Seed data va test foydalanuvchilar

`npm run seed` — development va demo uchun.

### Tenant A — "Demo Store"

| Email            | Password    | Role    |
| ---------------- | ----------- | ------- |
| cashier@demo.com | password123 | cashier |
| admin@demo.com   | password123 | admin   |

### Tenant B — "Other Store" (tenant isolation test)

| Email             | Password    | Role    |
| ----------------- | ----------- | ------- |
| cashier@other.com | password123 | cashier |

### Products (Tenant A)

- Kamida 10 ta product, 2–3 category
- 1 ta product `stock: 1` — concurrency test uchun
- Har birida `price` va `costPrice` (farqli — margin ko‘rinsin)

---

## 16. DECISIONS.md yozish rejasi

Har bir band ~75 so‘z, jami ~600 so‘z. **Kod tugagach yozing**, lekin qarorlarni development davomida qayd qilib boring.

| #   | Mavzu                         | Qachon yozish        |
| --- | ----------------------------- | -------------------- |
| 1   | Tenant + role flow            | Stage 1 dan keyin    |
| 2   | N+1 + indexes                 | Stage 2 dan keyin    |
| 3   | Client trust boundary         | Stage 3–4 dan keyin  |
| 4   | No-oversell + sinish nuqtasi  | Stage 4 dan keyin    |
| 5   | Margin data layer             | Stage 6 dan keyin    |
| 6   | Webhook idempotency           | Stage 5 dan keyin    |
| 7   | Missing tenant                | Stage 1/13 dan keyin |
| 8   | Vaqt prioriteti + PM pushback | Oxirida              |

---

## 17. Tekshirish checklist (automatic concerns)

Har biri **curl/Postman + brauzer** bilan tekshiriladi.

### Correctness

- [ ] Client price yuborsa ham server DB narxini ishlatadi
- [ ] 2 parallel checkout oxirgi unit — stock ≥ 0, bitta g‘olib
- [ ] Cashier token: `/api/products`, `/api/orders/:id`, `/api/reports/sales` — costPrice/margin yo‘q
- [ ] Tenant A cashier Tenant B product/order ko‘ra olmaydi
- [ ] `pending_payment` order uchun paid chek ko‘rsatilmaydi
- [ ] Report faqat `paid` orderlarni sanaydi

### Integration

- [ ] Webhook HMAC noto‘g‘ri → rad
- [ ] Bir xil eventId 2 marta → bitta paid transition
- [ ] Unknown orderId → to‘g‘ri xato

### Performance

- [ ] Products list 1 query (MongoDB profiler yoki log)
- [ ] Index ishlatilishi (`explain()`)
- [ ] Report cache hit/miss

### Infrastructure

- [ ] `docker compose up --build` — 3 service ishga tushadi
- [ ] Seed ma’lumot bor

### Frontend

- [ ] INSUFFICIENT_STOCK xabari tushunarli
- [ ] Login/logout ishlaydi
- [ ] Admin report faqat admin uchun

---

## 18. Topshirish va live review tayyorgarligi

### Topshirish

1. Git repo (GitHub/GitLab) — reviewer invite
2. `DECISIONS.md`
3. `README.md` — setup, demo accounts, simulate payment
4. Screen recording 3–5 daq:
   - Login (cashier)
   - Search → cart → checkout
   - Payment confirm → receipt
   - Login (admin) → report (margin ko‘rsatish)
5. `.env.example` — secretlar reposiz

### Live review uchun tayyor javoblar

**"Ikki cashier oxirgi unit" savoli:**

1. Ikkala request `POST /api/orders` ga keladi
2. Transaction/conditional update `stock >= quantity` tekshiradi
3. Birinchisi `findOneAndUpdate` muvaffaq — stock 0
4. Ikkinchisi match topolmaydi — `INSUFFICIENT_STOCK`, transaction abort
5. DB da stock = 0, bitta order

**"Margin leak" isboti:**

```bash
TOKEN=<cashier_jwt>
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/products | jq '.. | objects | select(has("costPrice"))'
# bo'sh natija
```

**Kichik o‘zgartirish:** kod strukturasi sodda bo‘lsin — DTO, error codes, constants alohida fayllarda.

---

## 19. Vaqt taqsimoti (prioritet)

Agar vaqt yetmasa — **coherent flow** ustun, polish emas.

| Tartib | Bosqich                   | Vaqt        | Prioritet    |
| ------ | ------------------------- | ----------- | ------------ |
| 1      | 0 — Docker + scaffold     | 1 soat      | 🔴 Majburiy  |
| 2      | 1 — Auth/JWT/tenant       | 1 soat      | 🔴 Majburiy  |
| 3      | 4 — Order + no-oversell   | 1.5 soat    | 🔴 Majburiy  |
| 4      | 5 — Webhook               | 1 soat      | 🔴 Majburiy  |
| 5      | 6 — Receipt + DTO         | 45 daq      | 🔴 Majburiy  |
| 6      | 2 — Products + N+1        | 1 soat      | 🟡 Muhim     |
| 7      | 3 — Cart UI               | 45 daq      | 🟡 Muhim     |
| 8      | 7 — Report + cache        | 1 soat      | 🟡 Muhim     |
| 9      | 13 — Missing tenant       | 15 daq      | 🟡 Muhim     |
| 10     | DECISIONS.md              | 45 daq      | 🟡 Muhim     |
| 11     | Seed + README + recording | 45 daq      | 🟢 Kerak     |
| 12     | UI polish                 | qolgan vaqt | 🟢 Ixtiyoriy |

### Agar vaqt tugasa — qoldirish mumkin

- Report cache (TTL siz to‘g‘ridan-to‘g‘ri aggregation)
- UI animatsiyalar
- Print-friendly receipt
- Refresh token

### Qoldirish mumkin EMAS

- Server-side pricing
- Tenant isolation
- No-oversell
- HMAC webhook
- Margin DTO layer
- Docker compose ishga tushishi

---

## Qisqa xulosa — ish ketma-ketligi (1 qatorlik)

```
Docker → Auth/JWT/Tenant → Seed → Product API (N+1 fix) → Cart UI →
Order API (transaction) → Webhook → Receipt → Admin Report →
Missing tenant → DECISIONS.md → Checklist → Recording
```

---

_Reja TASK.md talablariga va stack tanloviga (Next.js + shadcn/ui, Express, MongoDB) moslashtirilgan._
