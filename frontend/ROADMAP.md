# Frontend — ish tartibi

> **TASK workflow:** Login → katalog qidiruv → savat → buyurtma → to‘lov → chek → (admin) sales report.  
> **Stack:** Next.js (App Router) + shadcn/ui + **NextAuth** + **TanStack Query** + **next-intl** (i18n).  
> **Backend:** Express JWT verify qiladi — frontend NextAuth session ichida `{ sub, tenantId, role }` formatidagi access token saqlanadi.

## Kod strukturasi (har bosqichda bir xil)

```
Page/Component → Hook (TanStack Query / mutation) → lib/api-client → Express API

app/[locale]/           → sahifalar, locale routing
app/(group)/...         → route group (URL ga ta'sir qilmaydi)
page/_components/       → faqat shu page uchun komponentlar
components/             → ko'p joyda ishlatiladigan (shadcn + shared)
hooks/queries|mutations/
lib/                    → api-client, auth, cart store
providers/              → SessionProvider, QueryClientProvider
messages/               → en.json, uz.json (i18n)
types/                  → API contract
```

### Folder qoidalari

**Route group lar** — mantiqiy guruhlar, har page alohida group emas:

```
app/
├── layout.tsx                         # root: html, font, global providers
├── globals.css
├── page.tsx                           # → /en redirect (default locale)
└── [locale]/
    ├── layout.tsx                     # locale layout (next-intl)
    ├── page.tsx                       # auth bo'yicha redirect
    ├── (auth)/
    │   └── login/
    │       ├── page.tsx
    │       └── _components/           # masalan: login-form.tsx
    ├── (pos)/
    │   ├── layout.tsx                 # POS shell (AppHeader)
    │   ├── pos/
    │   │   ├── page.tsx
    │   │   └── _components/           # masalan: product-search.tsx, cart.tsx
    │   └── receipt/
    │       └── [id]/
    │           ├── page.tsx
    │           └── _components/       # masalan: receipt-view.tsx
    └── (admin)/
        └── reports/
            ├── page.tsx
            └── _components/           # masalan: sales-report.tsx, date-range-picker.tsx
```

| Qayerda                     | Nima qo'yiladi                                                      |
| --------------------------- | ------------------------------------------------------------------- |
| `components/`               | AppHeader, LanguageSwitcher, shadcn/ui — **2+ page** da ishlatiladi |
| `app/.../page/_components/` | Faqat **shu page** ga xos UI (LoginForm, Cart, ReceiptView)         |
| `hooks/`                    | TanStack Query / mutation hooklar                                   |
| `lib/`                      | api-client, cart-store, utils                                       |
| `providers/`                | Client-side global providerlar                                      |

**Group lar:**

| Group     | Route lar               | Maqsad           |
| --------- | ----------------------- | ---------------- |
| `(auth)`  | `/login`                | Public login     |
| `(pos)`   | `/pos`, `/receipt/[id]` | Cashier workflow |
| `(admin)` | `/reports`              | Admin-only       |

### TASK bosqichlari ↔ Frontend

| TASK Stage           | Frontend vazifasi                                        |
| -------------------- | -------------------------------------------------------- |
| 1 — Login & identity | NextAuth, JWT, route guard, role redirect                |
| 2 — Katalog          | Product search (TanStack Query), pagination              |
| 3 — Savat            | Client state: faqat `productId` + `quantity`             |
| 4 — Buyurtma         | Checkout mutation, xato mapping (`INSUFFICIENT_STOCK` …) |
| 5 — To‘lov           | Polling / simulate payment, status kuzatuv               |
| 6 — Chek             | Receipt sahifa, `pending_payment` vs `paid`              |
| 7 — Report           | Admin-only sahifa, date range, margin ko‘rsatish         |

---

## Hozirgi holat

| Qism                                                            | Holat          |
| --------------------------------------------------------------- | -------------- |
| Next.js scaffold + route groups                                 | ✅             |
| shadcn/ui (button, input, card, table, badge, skeleton, sonner) | ✅             |
| Providers (Session + Query + Toaster)                           | ✅             |
| `types/api.ts`                                                  | ✅             |
| Folder struktura `(auth)`, `(pos)`, `(admin)`                   | ✅             |
| next-intl (EN/UZ)                                               | ✅             |
| NextAuth login + JWT                                            | ✅             |
| TanStack Query + api-client                                     | ✅             |
| Route guard + himoyalangan sahifalar                            | ✅             |
| POS katalog qidiruv                                             | ✅             |
| Savat (cart)                                                    | ✅             |
| Checkout / order                                                | ✅             |
| To'lov polling + receipt                                        | ✅             |
| Admin sales report                                              | ✅             |
| UX polish (metadata, 404, error)                                | ✅             |
| Docker frontend                                                 | ✅             |

---

## Bosqichlar

### 1. Dependencies + provider poydevori ✅ TUGATILDI

**Maqsad:** NextAuth, TanStack Query, i18n paketlari o‘rnatilgan; global providerlar ulangan.

**Qilingan ishlar:**

- [x] Paketlar: `next-auth@beta`, `@tanstack/react-query`, `next-intl`
- [x] `.env.example`: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`
- [x] `providers/query-provider.tsx` — `QueryClientProvider`, default `staleTime`
- [x] `providers/session-provider.tsx` — NextAuth `SessionProvider`
- [x] `providers/app-providers.tsx` — Session → Query → Toaster
- [x] Root layout da providerlar ulangan
- [x] `types/api.ts` — backend response/error shakli
- [x] Route group struktura: `(auth)`, `(pos)`, `(admin)` + `[locale]`
- [x] `i18n/config.ts` — locale ro‘yxati (next-intl bosqich 2 da to‘ldiriladi)

**Fayllar:**

```
frontend/
├── .env.example
├── i18n/config.ts
├── providers/
│   ├── app-providers.tsx
│   ├── query-provider.tsx
│   └── session-provider.tsx
├── types/api.ts
└── app/
    ├── layout.tsx
    ├── page.tsx                    # → /en redirect
    └── [locale]/
        ├── layout.tsx
        ├── page.tsx
        ├── (auth)/login/page.tsx
        ├── (pos)/
        │   ├── layout.tsx
        │   ├── pos/page.tsx
        │   └── receipt/[id]/page.tsx
        └── (admin)/reports/page.tsx
```

**Tekshiruv:**

```bash
cd frontend
npm install
npm run build   # ✅
npm run dev
# http://localhost:3000 → /en
# /en/login, /en/pos, /en/reports ochiladi
```

---

### 2. i18n (next-intl) — multilanguage poydevor ✅ TUGATILDI

**Maqsad:** Barcha UI matnlari tarjima fayllaridan; til almashtirish ishlaydi.

**Qilingan ishlar:**

- [x] `next-intl` — locale prefix routing: `/en/...`, `/uz/...`
- [x] `middleware.ts` — locale detection (NextAuth chain — bosqich 3 da)
- [x] `messages/en.json`, `messages/uz.json` — common, auth, pos, cart, receipt, report, errors
- [x] `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`
- [x] `app/[locale]/layout.tsx` — `NextIntlClientProvider`, `setRequestLocale`, `lang`
- [x] `components/LanguageSwitcher.tsx` — EN / UZ toggle
- [x] `lib/error-messages.ts` + `hooks/use-api-error-message.ts` — API xato kodlari mapping
- [x] Barcha scaffold sahifalar `getTranslations` ga o‘tkazildi
- [x] `next.config.ts` — `createNextIntlPlugin`

**Fayllar:**

```
frontend/
├── middleware.ts
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── en.json
│   └── uz.json
├── lib/error-messages.ts
├── hooks/use-api-error-message.ts
├── components/LanguageSwitcher.tsx
└── app/[locale]/layout.tsx
```

**Tekshiruv:**

```bash
npm run build   # ✅
npm run dev
# http://localhost:3000 → /en
# /en/login vs /uz/login — matnlar farq qiladi
# LanguageSwitcher — URL prefix yangilanadi (/en ↔ /uz)
```

---

### 3. NextAuth login + JWT (TASK Stage 1) ✅ TUGATILDI

**Maqsad:** Cashier/admin login; session ichida backend bilan mos JWT; tenant + role keyingi requestlarga o‘tadi.

**Qilingan ishlar:**

- [x] `auth.ts` — Credentials provider + JWT/session callbacks
- [x] MongoDB orqali email/password tekshiruv (`lib/auth/validate-credentials.ts`)
- [x] Backend JWT sign (`lib/auth/sign-access-token.ts`) — `{ sub, tenantId, role }`
- [x] Session: `{ user: { id, email, role, tenantId }, accessToken }`
- [x] `login/_components/login-form.tsx` — signIn + i18n xato
- [x] Login qilingan user `/pos` ga redirect
- [x] `AuthControls` — email, role, logout (header)
- [x] `.env` — `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`

**Fayllar:**

```
frontend/
├── auth.ts
├── lib/
│   ├── db.ts
│   ├── models/User.ts
│   └── auth/
│       ├── validate-credentials.ts
│       └── sign-access-token.ts
├── components/AuthControls.tsx
└── app/[locale]/(auth)/login/
    ├── page.tsx
    └── _components/login-form.tsx
```

**Tekshiruv:**

```bash
# MongoDB + backend ishlab turishi kerak
npm run dev
# /en/login → cashier@demo.com / password123 → /en/pos
# Header: email + role + logout

# JWT tekshiruv (browser devtools → session yoki):
curl -H "Authorization: Bearer <accessToken>" http://localhost:4000/api/me
```

---

### 4. API client + TanStack Query asoslari ✅ TUGATILDI

**Maqsad:** Barcha backend chaqiruvlari markaziy client orqali; query/mutation hooklar pattern.

**Qilingan ishlar:**

- [x] `lib/api-client.ts` — `apiFetch`, `apiGet`, `apiPost`, `ApiError` parse
- [x] `lib/api-client.server.ts` — `serverApiGet/Post` (`auth()` orqali token)
- [x] `hooks/use-api-client.ts` — client: session `accessToken` bilan wrapper
- [x] `lib/query-keys.ts` — markaziy query key factory
- [x] `QueryProvider` — global 401 → signOut + login redirect; 403 → i18n toast
- [x] User ma'lumoti faqat `useSession` dan ( `/api/me` UI uchun ishlatilmaydi )

**Fayllar:**

```
frontend/
├── lib/
│   ├── api-client.ts
│   ├── api-client.server.ts
│   └── query-keys.ts
├── hooks/
│   └── use-api-client.ts
└── providers/query-provider.tsx
```

**Tekshiruv:**

```bash
npm run build   # ✅
# Login → session.user (email, role) — /me chaqiruvi yo'q
```

---

### 5. Route guard + login sahifa (TASK Stage 1 — UI) ✅ TUGATILDI

**Maqsad:** Himoyalangan route lar; role bo‘yicha redirect; logout.

**Qilingan ishlar:**

- [x] `middleware.ts` — NextAuth + next-intl chain
- [x] Himoyalangan: `/pos`, `/receipt/*`, `/reports` (admin)
- [x] Public: `/login`
- [x] `/[locale]` → auth bo‘yicha `/pos` yoki `/login` redirect
- [x] Login qilingan → `/login` dan `/pos` ga redirect
- [x] Cashier `/reports` → `/pos` redirect (middleware + server guard)
- [x] `components/AppHeader.tsx` — nav, AuthControls, LanguageSwitcher
- [x] Admin link faqat `session.user.role === 'admin'`

**Fayllar:**

```
frontend/
├── middleware.ts
├── lib/auth/routes.ts
├── components/AppHeader.tsx
└── app/[locale]/
    ├── page.tsx
    └── (admin)/reports/page.tsx   # server-side admin guard
```

**Tekshiruv:**

```bash
npm run build   # ✅
# Tokensiz /uz/pos → /uz/login
# cashier → /uz/pos OK, /uz/reports → /uz/pos
# admin → /uz/reports OK, headerda Reports link
```

---

### 6. Katalog qidiruv (TASK Stage 2) ✅ TUGATILDI

**Maqsad:** Cashier mahsulot qidiradi; pagination; loading/error holatlar.

**Qilingan ishlar:**

- [x] `hooks/queries/use-products.ts` — TanStack Query, `search`, `page`, `limit`
- [x] `hooks/use-debounced-value.ts` — 300ms debounce
- [x] `pos/_components/product-search.tsx` — qidiruv, jadval, pagination
- [x] name, price, stock, category — `costPrice` UI da yo'q
- [x] Skeleton, empty state, error toast (i18n)
- [x] `types/product.ts`, `lib/format.ts` — money format

**Fayllar:**

```
frontend/
├── types/product.ts
├── hooks/
│   ├── use-debounced-value.ts
│   └── queries/use-products.ts
├── lib/format.ts
└── app/[locale]/(pos)/pos/
    ├── page.tsx
    └── _components/product-search.tsx
```

**Tekshiruv:**

```bash
npm run build   # ✅
# Login → /uz/pos → "espresso" qidiruv
# Network: GET /api/products?search=espresso&page=1&limit=20
```

---

### 7. Savat — client state (TASK Stage 3) ✅ TUGATILDI

**Maqsad:** Savat faqat `productId` + `quantity`; narx faqat UI display (server ishonmaydi).

**Qilingan ishlar:**

- [x] `lib/cart-store.ts` — Zustand: add, +/-, remove, subtotal, `getCheckoutItems()`
- [x] `pos/_components/cart.tsx` — ro'yxat, quantity, subtotal, checkout (disabled)
- [x] `pos/_components/pos-shell.tsx` — katalog + savat 2-column layout
- [x] ProductSearch — "Savatga qo'shish" tugmasi, stock limit
- [x] Checkout payload tayyor: `{ items: [{ productId, quantity }] }` — bosqich 8 da ulanadi

**Fayllar:**

```
frontend/
├── lib/cart-store.ts
└── app/[locale]/(pos)/pos/
    ├── page.tsx
    └── _components/
        ├── pos-shell.tsx
        ├── cart.tsx
        └── product-search.tsx
```

**Tekshiruv:**

```bash
npm run build   # ✅
# /pos → mahsulot qo'shish, +/-, o'chirish, subtotal
# Checkout tugmasi savat bo'sh bo'lsa disabled
```

---

### 8. Checkout — buyurtma yaratish (TASK Stage 4) ✅ TUGATILDI

**Maqsad:** Atomik order; server xatolarini tushunarli UI xabarga aylantirish.

**Qilingan ishlar:**

- [x] `hooks/mutations/use-create-order.ts` — `POST /api/orders`
- [x] `pos/_components/checkout-button.tsx` — loading, disabled
- [x] Xato mapping (i18n toast): `INSUFFICIENT_STOCK`, `PRODUCT_NOT_FOUND`, `INVALID_CART`
- [x] `INSUFFICIENT_STOCK` → savat + jadval qatorlari highlight
- [x] Muvaffaqiyat → savat tozalash → `/receipt/[orderId]`
- [x] Products cache invalidate (stock yangilanishi)

**Fayllar:**

```
frontend/
├── types/order.ts
├── hooks/mutations/use-create-order.ts
└── app/[locale]/(pos)/pos/_components/
    ├── checkout-button.tsx
    └── cart.tsx
```

**Tekshiruv:**

```bash
npm run build   # ✅
# Checkout → /receipt/:id (pending_payment)
# INSUFFICIENT_STOCK → toast + qizil highlight
# Network body: faqat productId + quantity
```

---

### 9. To‘lov kutish + simulyatsiya (TASK Stage 5) ✅ TUGATILDI

**Maqsad:** Order `pending_payment` → `paid` o‘tishini kuzatish; dev da to‘lov simulyatsiyasi.

**Ishlar:**

- [x] `hooks/queries/use-order.ts` — `GET /api/orders/:id`
- [x] `refetchInterval` — status `pending_payment` bo‘lsa 2s polling, `paid` bo‘lsa to‘xtatish
- [x] Dev-only: `receipt/[id]/_components/simulate-payment-button.tsx` + `POST /api/dev/simulate-payment`
- [x] Payment pending UI — Badge + i18n (`receipt.pending`)
- [x] `paid` bo‘lganda avtomatik receipt to‘liq ko‘rinishi

**Fayllar:**

```
frontend/
├── hooks/queries/use-order.ts
├── app/api/dev/simulate-payment/route.ts   # faqat NODE_ENV=development
└── app/[locale]/(pos)/receipt/[id]/
    ├── page.tsx
    └── _components/
        ├── receipt-page-client.tsx
        ├── receipt-view.tsx
        └── simulate-payment-button.tsx
```

**Tekshiruv:**

```bash
# Checkout → receipt sahifa, "To‘lov kutilmoqda"
# simulate-payment → polling paid ga o‘tadi
# paid bo‘lmaguncha to‘liq chek ko‘rsatilmaydi
```

---

### 10. Chek sahifa (TASK Stage 6) ✅ TUGATILDI

**Maqsad:** Faqat `paid` order uchun to‘liq chek; cashier margin/cost ko‘rmaydi.

**Ishlar:**

- [x] `app/[locale]/(pos)/receipt/[id]/page.tsx` — `useOrder(id)`
- [x] `receiptAvailable === false` → pending xabar, items yashirin
- [x] `paid` → items, quantities, line totals, grand total, `paidAt`, status Badge
- [x] `receipt-view.tsx` — print-friendly layout
- [x] **Frontend margin yashirmaydi** — backend DTO ishonadi; UI da costPrice ishlatilmaydi
- [x] "Yangi savdo" → `/pos`, savat bo‘sh

**API:** `GET /api/orders/:id` — cashier: `unitCostPrice` yo‘q

**Fayllar:**

```
frontend/
└── app/[locale]/(pos)/receipt/[id]/_components/
    ├── receipt-view.tsx
    └── receipt-page-client.tsx
```

**Tekshiruv:**

```bash
# pending order → items ko‘rinmaydi, message bor
# paid order → to‘liq chek, summalar to‘g‘ri
# Cashier session — UI va Network da costPrice/margin yo‘q
```

---

### 11. Admin sales report (TASK Stage 7) ✅ TUGATILDI

**Maqsad:** Admin margin ko‘radi; cashier kira olmaydi; date range filter.

**Ishlar:**

- [x] `app/[locale]/(admin)/reports/page.tsx` — admin guard (server: `auth()` role check)
- [x] `hooks/queries/use-sales-report.ts` — `GET /api/reports/sales?from=&to=`
- [x] Date range: shadcn Popover + Calendar (range mode)
- [x] Ko‘rsatkichlar: `totalRevenue`, `totalMargin`, `topProducts` jadvali
- [x] Cashier `/reports` → redirect `/pos` (middleware + server guard)
- [x] Loading skeleton, empty range state
- [x] **Margin faqat shu sahifada** — cashier POS/chek da hech qachon

**API:** `GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` — admin only

**Fayllar:**

```
frontend/
├── types/report.ts
├── lib/report-dates.ts
├── hooks/queries/use-sales-report.ts
└── app/[locale]/(admin)/reports/
    ├── page.tsx
    └── _components/
        ├── sales-report.tsx
        └── date-range-picker.tsx
```

**Tekshiruv:**

```bash
# admin@demo.com → report ochiladi, margin ko‘rinadi
# Bir nechta paid order dan keyin revenue/margin > 0
# cashier@demo.com → 403 yoki redirect
```

---

### 12. POS layout + UX polish + xatoliklar ✅ TUGATILDI

**Maqsad:** Butun flow bir xil UI; toast lar; responsive layout; TYPE safety.

**Ishlar:**

- [x] `(pos)/layout.tsx` — POS route group layout
- [x] Global `Toaster` (sonner) — allaqachon `app-providers` da
- [x] Loading matnlari `common.loading` orqali i18n
- [x] `app/[locale]/not-found.tsx` + `app/[locale]/error.tsx`
- [x] `generateMetadata` — locale layout + sahifa title lari
- [x] Responsive: POS 2-column desktop, stack mobile; cart sticky

**Fayllar:**

```
frontend/
├── app/[locale]/not-found.tsx
├── app/[locale]/error.tsx
├── app/[locale]/layout.tsx          # generateMetadata
└── app/[locale]/(pos)/pos/_components/pos-shell.tsx
```

**Tekshiruv:**

```bash
npm run build    # xatosiz
# To‘liq flow: login → search → cart → checkout → payment → receipt → (admin) report
# EN/UZ til almashtirish barcha sahifalarda ishlaydi
```

---

### 13. Docker + README yangilash ✅ TUGATILDI

**Maqsad:** `docker compose up` frontend ni ham ko‘taradi (TASK infra).

**Ishlar:**

- [x] `frontend/Dockerfile` — multi-stage build (standalone)
- [x] Root `docker-compose.yml` ga `frontend` service qo‘shildi
- [x] `NEXT_PUBLIC_API_URL=http://localhost:4000` — browser uchun build arg
- [x] `MONGODB_URI=mongodb://mongo:27017/bito?replicaSet=rs0` — container ichida login
- [x] README — Docker, frontend setup, i18n, demo flow

**Fayllar:**

```
frontend/Dockerfile
docker-compose.yml    # frontend service
README.md
```

**Tekshiruv:**

```bash
docker compose up --build
# http://localhost:3000 — login ishlaydi
```

---

## API xulosa (frontend iste’mol qiladi)

| Method | Endpoint                          | Hook                                | Auth        |
| ------ | --------------------------------- | ----------------------------------- | ----------- |
| GET    | `/api/me`                         | `useMe`                             | JWT         |
| GET    | `/api/products?search&page&limit` | `useProducts`                       | JWT         |
| POST   | `/api/orders`                     | `useCreateOrder`                    | JWT         |
| GET    | `/api/orders/:id`                 | `useOrder`                          | JWT         |
| GET    | `/api/reports/sales?from&to`      | `useSalesReport`                    | JWT + admin |
| POST   | `/api/webhooks/payment`           | — (backend only, simulyator script) | HMAC        |

---

## TASK automatic concerns — frontend checklist

- [ ] Checkout body da **price yo‘q** — faqat productId + quantity
- [ ] `INSUFFICIENT_STOCK` xabari tushunarli (i18n)
- [ ] Login/logout ishlaydi
- [ ] Admin report faqat admin uchun
- [x] `pending_payment` da paid chek ko‘rsatilmaydi
- [ ] Cashier UI da margin/costPrice yo‘q (backend DTO ga tayanadi)
- [ ] To‘liq flow bir session ichida demo qilinadi

---

## Vaqt prioriteti (vaqt yetmasa)

| Tartib | Bosqich                                     | Prioritet    |
| ------ | ------------------------------------------- | ------------ |
| 1      | 1–4 — Providers, i18n, NextAuth, API client | 🔴 Majburiy  |
| 2      | 5–8 — Login UI, katalog, savat, checkout    | 🔴 Majburiy  |
| 3      | 9–10 — Payment polling, receipt             | ✅ Tugatildi |
| 4      | 11 — Admin report                           | ✅ Tugatildi |
| 5      | 12 — Polish                                 | ✅ Tugatildi |
| 6      | 13 — Docker frontend                        | ✅ Tugatildi |

**Qoldirish mumkin:** print-friendly receipt, React Query Devtools, 3+ til.  
**Qoldirish mumkin emas:** server-side pricing trust, checkout error mapping, role guard, paid/pending chek farqi.

---

## Qisqa xulosa — ish ketma-ketligi

```
Deps + Providers → i18n → NextAuth/JWT → API client + TanStack Query →
Route guard + Login → Products search → Cart → Checkout mutation →
Payment polling → Receipt → Admin report → Polish → Docker
```

---

## Keyingi qadam

Frontend ROADMAP bosqichlari tugadi. Qolgan: screen recording (TASK talabi). `DECISIONS.md` ✅ yozildi.
