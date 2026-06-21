# Backend — ish tartibi

> Auth login frontendda NextAuth orqali. Express faqat JWT verify qiladi va business API larni beradi.

## Kod strukturasi (har bosqichda bir xil)

```
Route → Controller → Service → Model/DTO

routes/       → path, middleware, controller ulash
controllers/  → req/res, validation, HTTP javob
services/     → business logic, DB, transaction
dto/          → role-based response shakli
models/       → Mongoose schema
middleware/   → auth, tenant, roleGuard
```

---

## Bosqichlar

### 1. Express scaffold + MongoDB + `/health` ✅ TUGATILDI

**Maqsad:** Server poydevori, DB ulanish, infra tekshiruv.

**Qilingan ishlar:**

- [x] Express + TypeScript (`tsconfig.json`, `src/`)
- [x] `helmet`, `cors`, `express.json()`
- [x] `GET /health` → `{ status, db, timestamp }` (DB ulanmagan bo‘lsa `503`)
- [x] MongoDB connection retry logic (`src/db/connection.ts`)
- [x] Env config (`src/config/env.ts`, `.env`, `.env.example`)
- [x] Markaziy error handler (`src/middleware/errorHandler.ts`)
- [x] Graceful shutdown (SIGINT / SIGTERM)
- [x] Scripts: `dev`, `build`, `start`, `typecheck`

**Fayllar:**

```
src/
├── index.ts
├── app.ts
├── config/env.ts
├── db/connection.ts
└── middleware/errorHandler.ts
```

**Tekshiruv (2026-06-20):**

```bash
npm run typecheck   # ✅
npm run build       # ✅
npm run dev         # ✅
curl http://localhost:4000/health
# → {"status":"ok","db":"connected","timestamp":"..."}
```

---

### 2. Models + seed script ✅ TUGATILDI

**Maqsad:** Demo ma’lumotlar — keyingi API larni sinash uchun.

- [x] `Tenant`, `User`, `Category`, `Product`, `Order`, `PaymentEvent` modellari
- [x] Indexlar (`tenantId` birinchi — compound indexlar)
- [x] `npm run seed` — demo tenant, users, products
- [x] Test userlar:
  - `cashier@demo.com` / `password123` (cashier)
  - `admin@demo.com` / `password123` (admin)
  - `cashier@other.com` / `password123` (boshqa tenant — isolation test)
- [x] 1 ta product `stock: 1` (Limited Edition Mug — concurrency test)

**Fayllar:**

```
src/models/
├── Tenant.ts
├── User.ts
├── Category.ts
├── Product.ts
├── Order.ts
├── PaymentEvent.ts
└── index.ts
src/db/seed.ts
```

**Tekshiruv (2026-06-20):**

```bash
npm run typecheck   # ✅
npm run seed        # ✅ — 2 tenant, 3 user, 13 product
```

---

### 3. Auth middleware (JWT verify) ✅ TUGATILDI

**Maqsad:** Har himoyalangan requestda `tenantId` + `role`. Login endpoint yo‘q — NextAuth JWT.

- [x] `auth` middleware — `Authorization: Bearer <token>`
- [x] JWT payload: `{ sub, tenantId, role }`
- [x] `tenant` middleware — DB da tenant mavjudligi (`TENANT_INVALID`)
- [x] `roleGuard(['admin'])` helper
- [x] `req.user` typing (Express augmentation)
- [x] Dev: `npm run token -- <email>` (login API emas — faqat test/review uchun)

**Fayllar:**

```
src/types/auth.ts, express.d.ts
src/services/authService.ts
src/middleware/auth.ts, tenant.ts, roleGuard.ts, asyncHandler.ts
src/routes/index.ts          → GET /api/me, GET /api/admin/check
src/scripts/generateToken.ts
```

**JWT oqimi (NextAuth bilan mos):**

```
NextAuth login → JWT { sub, tenantId, role }
       ↓
Authorization: Bearer <token>
       ↓
authenticate → requireTenant → roleGuard (admin endpointlar)
       ↓
req.user = { userId, tenantId, role }
```

**Missing tenant qarori:** token da `tenantId` yo‘q → `403 TENANT_INVALID`; DB da tenant yo‘q → `403 TENANT_INVALID`.

**Tekshiruv (2026-06-20):**

```bash
npm run typecheck                              # ✅
npm run token -- cashier@demo.com              # JWT olish
curl -H "Authorization: Bearer <token>" .../api/me           # ✅ cashier
curl .../api/admin/check                       # ✅ 403 FORBIDDEN (cashier)
npm run token -- admin@demo.com + .../api/admin/check        # ✅ 200
curl .../api/me (tokensiz)                     # ✅ 401 UNAUTHORIZED
```

---

### 4. `GET /api/products` ✅ TUGATILDI

**Maqsad:** Katalog qidiruv, N+1 yo‘q, cashier DTO da `costPrice` yo‘q.

- [x] `GET /api/products?search=&page=&limit=`
- [x] Aggregation pipeline — bitta query (`$lookup` category bilan)
- [x] Pagination + tenant filter
- [x] `productDto` — cashier: `costPrice` yo‘q; admin: `costPrice` bor
- [x] Indexlar sync (`Product.syncIndexes()` startup da)

**Fayllar:**

```
src/services/productService.ts   → listProducts (aggregation)
src/dto/productDto.ts            → role-based DTO
src/utils/pagination.ts
src/routes/products.routes.ts
```

**N+1 yechim:** `$match` → `$lookup` categories → `$facet` (items + total) — 1 DB round-trip.

**Tekshiruv:**

```bash
npm run typecheck   # ✅
npm run token -- cashier@demo.com
curl -H "Authorization: Bearer <token>" "http://localhost:4000/api/products?search=espresso&page=1&limit=20"
# cashier JSON da costPrice bo'lmasligi kerak
# admin token bilan costPrice ko'rinadi
# cashier@other.com → faqat 2 ta product
```

---

### 5. `POST /api/orders` ✅ TUGATILDI

**Maqsad:** Atomik checkout, server narxi, no-oversell.

- [x] Body: `{ items: [{ productId, quantity }] }` — narx/stock clientdan emas
- [x] MongoDB transaction (replica set) + standalone fallback (stock rollback)
- [x] Conditional update: `stock: { $gte: quantity }`
- [x] Status: `pending_payment`
- [x] Xato kodlar: `INSUFFICIENT_STOCK`, `PRODUCT_NOT_FOUND`, `INVALID_CART`
- [x] Order item snapshot: `unitPrice`, `unitCostPrice`

**Fayllar:**

```
src/services/orderService.ts
src/dto/orderDto.ts
src/utils/transaction.ts
src/controllers/orderController.ts
src/routes/orders.routes.ts
```

**No-oversell:** `findOneAndUpdate({ stock: { $gte: quantity } })` — faqat 1 ta request muvaffaq bo‘ladi. Multi-item: transaction yoki rollback.

**Tekshiruv:**

```bash
npm run typecheck   # ✅
# productId ni GET /api/products dan oling
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<id>","quantity":1}]}'
# Limited Edition Mug stock=1 — 2 ta parallel request → biri INSUFFICIENT_STOCK
```

---

### 6. `POST /api/webhooks/payment` ✅ TUGATILDI

**Maqsad:** To‘lov tasdiqlash — HMAC + idempotent.

- [x] HMAC signature verify (`X-Signature`)
- [x] `PaymentEvent` — `eventId` unique (idempotency)
- [x] Order: `pending_payment` → `paid`
- [x] Edge case: unknown order, wrong tenant, duplicate event
- [x] Report cache invalidation (`cacheService`)
- [x] `npm run simulate-payment` dev script

**Fayllar:**

```
src/utils/hmac.ts
src/middleware/verifyWebhookSignature.ts
src/services/paymentWebhookService.ts
src/services/cacheService.ts
src/controllers/webhookController.ts
src/routes/webhooks.routes.ts
src/scripts/simulatePayment.ts
```

**Raw body:** webhook route `express.raw()` bilan mount — HMAC uchun JSON parse oldin emas.

**Edge case lar:**

| Holat | Javob |
|-------|-------|
| Noto‘g‘ri signature | `401 UNAUTHORIZED` |
| Order yo‘q (erta webhook) | `404 ORDER_NOT_FOUND` |
| Tenant mos kelmasa | `403 FORBIDDEN` |
| Bir xil `eventId` | `200` + `duplicate: true` |
| Order allaqachon `paid` | `200` idempotent |

**Tekshiruv:**

```bash
npm run typecheck   # ✅
# 1. Order yarating (POST /api/orders)
# 2. Webhook yuboring:
npm run simulate-payment -- --orderId=<id> --tenantId=<tenantId>
# 3. Bir xil eventId ni qayta yuboring → duplicate: true
```

---

### 7. `GET /api/orders/:id` ✅ TUGATILDI

**Maqsad:** Chek — faqat `paid` order to‘liq ko‘rinadi.

- [x] Tenant + auth check
- [x] Cashier DTO — `unitCostPrice` / margin yo‘q (data layer)
- [x] `pending_payment` → `receiptAvailable: false`, items yashirin (cashier)
- [x] `paid` → to‘liq chek + `paidAt`

**Fayllar:**

```
src/services/orderService.ts     → getOrderById
src/dto/orderDto.ts              → toOrderReceiptDto
src/controllers/orderController.ts → getById
src/routes/orders.routes.ts      → GET /:id
```

**Receipt qoidalari:**

| Status | Cashier ko‘radi | Admin ko‘radi |
|--------|----------------|---------------|
| `pending_payment` | id, status, message | + items, totals (debug) |
| `paid` | to‘liq chek (unitCostPrice yo‘q) | + unitCostPrice |

**Tekshiruv:**

```bash
npm run typecheck   # ✅
curl -H "Authorization: Bearer <cashier_token>" http://localhost:4000/api/orders/<id>
# pending → receiptAvailable: false, items yo'q
# paid → receiptAvailable: true, items + paidAt
# JSON da unitCostPrice bo'lmasligi kerak (cashier)
```

---

### 8. `GET /api/reports/sales` ✅ TUGATILDI

**Maqsad:** Admin report — revenue, margin, top products.

- [x] `GET /api/reports/sales?from=&to=` — admin only
- [x] Bitta aggregation pipeline (`$facet`)
- [x] Faqat `paid` orderlar, faqat joriy tenant
- [x] In-memory cache (5 min TTL) + invalidation (webhook da)
- [x] Cashier → `403 FORBIDDEN`

**Fayllar:**

```
src/services/reportService.ts
src/dto/reportDto.ts
src/controllers/reportController.ts
src/routes/reports.routes.ts
```

**Margin hisob:** order snapshot — `(unitPrice - unitCostPrice) × quantity` (product o‘zgarsa ham to‘g‘ri).

**Response:**

```json
{
  "data": {
    "from": "2026-01-01",
    "to": "2026-01-31",
    "topProducts": [{ "productId", "name", "quantity" }],
    "totalRevenue": 150.5,
    "totalMargin": 62.3
  }
}
```

**Tekshiruv:**

```bash
npm run typecheck   # ✅
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:4000/api/reports/sales?from=2026-01-01&to=2026-12-31"
# cashier token → 403
# margin faqat shu endpointda (cashier boshqa API larda ko'rmaydi)
```

---

### 9. Docker compose ✅ TUGATILDI

**Maqsad:** `docker compose up` — TASK automatic concern.

- [x] `backend/Dockerfile`
- [x] Root `docker-compose.yml` (mongo + backend)
- [x] MongoDB replica set (`rs0` — transaction lar uchun)
- [x] `.env.example` + `README.md` hujjatlashtirilgan

**Fayllar:**

```
backend/Dockerfile
backend/.dockerignore
docker-compose.yml
README.md
```

**Docker holati (2026-06-20):** kompyuteringizda Docker **o'rnatilmagan**. Fayllar tayyor — [Docker Desktop](https://www.docker.com/products/docker-desktop/) o'rnatgandan keyin:

```bash
docker compose up --build
cd backend && MONGODB_URI="mongodb://localhost:27017/bito?replicaSet=rs0" npm run seed
curl http://localhost:4000/health
```

**Docker siz ishlash:** hozirgi `npm run dev` + lokal MongoDB yetarli (transaction fallback — stock rollback).

---

## API xulosa

| Method | Endpoint                | Auth        | Status |
| ------ | ----------------------- | ----------- | ------ |
| GET    | `/health`               | —           | ✅     |
| GET    | `/api/products`         | JWT         | ✅     |
| POST   | `/api/orders`           | JWT         | ✅     |
| GET    | `/api/orders/:id`       | JWT         | ✅     |
| POST   | `/api/webhooks/payment` | HMAC        | ✅     |
| GET    | `/api/reports/sales`    | JWT + admin | ✅     |

---

## Keyingi qadam

Backend API bosqichlari tugadi. Keyin: **frontend** (NextAuth + POS UI) va **DECISIONS.md**.
