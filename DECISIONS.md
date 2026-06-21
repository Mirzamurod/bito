# DECISIONS.md — BITO POS

This document explains the non-obvious choices in the implementation. We optimized for **one coherent workflow** (login → catalog → cart → order → payment → receipt → admin report) with security and concurrency enforced at the **data layer**, not in React.

---

## 1. Tenant + role: token to data layer

**Login:** The frontend uses NextAuth Credentials. On successful login, credentials are validated against MongoDB (`User` + `bcrypt`), then a JWT is signed with the same `JWT_SECRET` as the Express API. Payload: `{ sub, tenantId, role }` where `role` is `admin` | `cashier`.

**Every protected API request** goes through:

1. `authenticate` — verifies `Authorization: Bearer` and attaches `req.user`.
2. `requireTenant` — confirms `req.user.tenantId` references an existing `Tenant` document.
3. Service queries always filter by `req.user.tenantId` from the token (orders, products, reports). **Tenant is never taken from the request body or query for authorization.**

**Role enforcement:** `roleGuard('admin')` on `GET /api/reports/sales`. Cashiers receive `403 FORBIDDEN`. Order/product DTOs also branch on `role` (see §5).

We did not add `POST /api/auth/login` on Express; login lives in NextAuth, but all business APIs share the same JWT contract the task describes.

---

## 2. N+1 fix and indexes

**Before:** Listing products could trigger one query per row for category resolution.

**After:** A single aggregation pipeline: `$match` (tenant + optional name/sku regex) → `$lookup` categories → `$unwind` → `$sort` → `$facet` (paginated items + total count). One round-trip per page.

**Indexes** (field order matters — equality on `tenantId` first, then range/sort keys):

| Collection | Index | Why |
|----------|-------|-----|
| Product | `{ tenantId: 1, sku: 1 }` unique | Tenant-scoped SKU uniqueness |
| Product | `{ tenantId: 1, name: 1 }` | Search/sort by name within tenant |
| Product | `{ tenantId: 1, categoryId: 1 }` | Category filter |
| Order | `{ tenantId: 1, status: 1, createdAt: -1 }` | Paid-order report `$match` |
| User | `{ tenantId: 1, email: 1 }` unique | Login lookup |

Search uses case-insensitive regex on `name` and `sku`, not a text index — acceptable for demo catalog size; a text index on `{ name, sku }` prefixed by `tenantId` would be the next step at scale.

---

## 3. Client cart: what we trust vs re-derive

**Trusted from client (checkout body):** `productId` and `quantity` only.

**Re-derived on server at `POST /api/orders`:** `unitPrice`, `unitCostPrice`, `name`, `stock`, line totals, and tenant ownership. The Zustand cart keeps `displayName` / `displayPrice` for UX; `getCheckoutItems()` strips everything except id + quantity.

If the client sends a fake price, it is ignored. If stock changed since the cart was built, the conditional stock update fails with `INSUFFICIENT_STOCK` and the DB is unchanged (within a transaction) or stock is rolled back (standalone fallback).

---

## 4. No-oversell under concurrency

**Mechanism:** For each line item, `Product.findOneAndUpdate` with filter `{ _id, tenantId, stock: { $gte: quantity } }` and update `{ $inc: { stock: -quantity } }`. Only one concurrent request can decrement the last unit; the loser gets `null` and we return `409 INSUFFICIENT_STOCK`.

**Transactions:** Order creation (all stock decrements + order insert) runs inside a MongoDB transaction when a replica set is available (`docker compose` uses `rs0`). On standalone local MongoDB, we detect unsupported transactions and fall back to the same operations without a session, with **manual stock rollback** if a later item fails.

**Where the guarantee weakens:** Without transactions, a crash between decrementing stock and creating the order could leave stock decremented without an order (rollback in `catch` handles logical failures, not process crash). With replica set + transaction, this is atomic. Two cashiers on the last unit: conditional update ensures at most one winner — no negative stock.

---

## 5. Margin blocked at the data layer (cashiers)

`costPrice` / `unitCostPrice` never appear in cashier API responses:

- `toProductDto` — adds `costPrice` only when `role === 'admin'`.
- `mapOrderItems` / `toOrderReceiptDto` — adds `unitCostPrice` only for admin.
- `GET /api/reports/sales` — admin-only route; margin is computed in aggregation as `quantity × (unitPrice − unitCostPrice)` from **order line snapshots** (cost at order time).

Cashiers can hit products and orders endpoints, but DTO mapping strips cost fields. Margin is not derivable from cashier-visible JSON without guessing. Hiding fields only in React would fail the task’s curl-with-cashier-token test.

---

## 6. Webhook: signature, idempotency, ordering

**HMAC:** `X-Signature` = HMAC-SHA256(raw body, `PAYMENT_WEBHOOK_SECRET`). Invalid signature → rejected before business logic.

**Idempotency:** `PaymentEvent.eventId` has a unique index. Flow:

1. Fast path: existing `eventId` → return `{ duplicate: true }`, no side effects.
2. Otherwise: conditional `Order` update `pending_payment` → `paid`, then insert `PaymentEvent`.
3. Duplicate key on `eventId` (race) → treated as duplicate.

**Edge cases:**

| Case | Behavior |
|------|----------|
| Unknown `orderId` | `404 ORDER_NOT_FOUND` (provider may retry) |
| Wrong `tenantId` for order | `403 FORBIDDEN` |
| Webhook before order exists | `404` — same as unknown order |
| Order already `paid` | Idempotent success (`duplicate: true`) |
| Same `eventId` replayed | No double transition |

On successful first payment, in-memory report cache for that tenant is invalidated.

---

## 7. Missing or unknown tenant (intentional ambiguity)

**Decision: fail closed with `403 TENANT_INVALID`.**

- JWT without `tenantId` → rejected at token parse.
- `tenantId` in token but no matching `Tenant` row → `requireTenant` rejects.
- We never infer tenant from headers/body and never fall back to a default tenant.

Anonymous or cross-tenant access is worse than a hard error. Webhook payloads must include `tenantId` matching the order’s tenant or the event is rejected.

---

## 8. Time trade-offs and one pushback

**Prioritized:** End-to-end workflow, server-side pricing, stock safety, DTO-level margin isolation, webhook idempotency, Docker Compose (mongo + backend + frontend), i18n (EN/UZ).

**Deferred / lighter touch:** Backend `POST /api/auth/login` (NextAuth + shared JWT instead), print-perfect receipt styling, automated concurrency load tests, Redis for report cache (in-memory TTL is enough for demo).

**If a PM handed me this spec unchanged, I would push back on:** requiring both a standalone Express login endpoint and a separate frontend auth stack when a single JWT issuer (NextAuth signing with backend secret) already satisfies “every request carries tenant + role.” The security property is identical; duplicating login endpoints adds surface area without strengthening isolation.

---

*~600 words. Reviewers: verify cashier margin leak with `npm run token -- cashier@demo.com` and curl against `/api/products`, `/api/orders/:id`, and `/api/reports/sales` (expect 403 on the last).*
