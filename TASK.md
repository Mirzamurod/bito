# Test task

# BITO — Full Stack (MERN) Test Task — One End-to-End Workflow

**The point of this task:** we are not testing whether you can build features. We are testing whether you can hold an entire system in your head at once — data model, security boundary, concurrency, integration, and UX — and make them fit together. There is **one** workflow. Every part depends on the parts before it. A wrong decision early will break something late. That coupling is the test.

**Time budget:** ~6–8 hours (one focused day). You will likely not perfect every stage — we score how well the pieces connect, not how many boxes you tick.
**Stack:** Node.js + Express, MongoDB, React + TypeScript, Docker.
**Delivery:** Git repo + `DECISIONS.md` + a 3–5 min screen recording walking the full flow once, end to end. Invite us as reviewers.
**AI tools:** Expected. But in the live review, you must explain and change any line on the spot.

---

## The workflow: a point-of-sale checkout in a multi-tenant SaaS

We run one backend shared by many businesses (tenants). A **cashier** at one business uses your app to sell products. Build this single journey, all the way through:

> **Cashier logs in → searches the catalog → adds items to a cart → places the order → a payment provider confirms it → the cashier sees a receipt.**
> Separately, an **admin** at the same business can open a sales report that shows profit margin — a number the cashier must never be able to reach.

That's the whole thing. Now here's what each stage demands, and why it's connected to the others.

---

### Stage 1 — Login & identity

`POST /api/auth/login` returns a JWT. Every later request carries the user (role: `admin` | `cashier`) **and** their tenant. Nothing in the rest of the flow may cross tenants.

> _Connection:_ how you put tenant + role into the token decides whether Stage 4's stock check and Stage 6's margin rule can even be enforced correctly. Don't treat this as boilerplate — it's the spine.

### Stage 2 — Search the catalog (the read path)

The cashier searches products: `GET /api/products?search=&page=&limit=`. The shell currently fetches inefficiently (a query per result to resolve related data). Make it correct and non-scaling. Add indexes; justify field order in `DECISIONS.md`.

> _Connection:_ the shape you return here is the same product data the cart and the order will reference. Decide once, well.

### Stage 3 — The cart (client state that the server must trust... or not)

The cashier adds items and quantities. Build the cart in React + TypeScript.

> _The trap:_ the cart lives on the client. **The server must not trust client-supplied prices or stock.** When the order is placed, the backend re-reads the real price and stock from the DB. If you let the client dictate price, you've failed the most important thing about a POS. Say in `DECISIONS.md` what you trust from the client and what you re-derive on the server.

### Stage 4 — Place the order (atomicity + no oversell)

`POST /api/orders` from the cart must atomically: create the order at **server-side prices**, decrement each product's `stock`, and **reject the entire order if any item would push stock below zero**, leaving the DB unchanged on rejection. The order starts as `pending_payment`.

> _The hard part:_ two cashiers buy the last unit of the same product at the same instant. Your code must not oversell. Transaction, optimistic version, conditional update — your choice, but defend the guarantee and name where it breaks.
> _Connection:_ the error you produce here must surface meaningfully in Stage 3's UI — the cashier has to understand _why_ checkout failed.

### Stage 5 — Payment confirmation (third-party integration, idempotent)

A payment provider calls `POST /api/webhooks/payment` to move the order from `pending_payment` to `paid`.

- Verify an **HMAC signature** (shared secret in env); reject forgeries.
- **Idempotent:** the same `eventId` may arrive several times → exactly one effect.
- Handle: unknown order, wrong tenant, and the webhook arriving _before_ you'd expect.

> _Connection:_ only a `paid` order produces a valid receipt in Stage 6, and only `paid` orders count in Stage 7's revenue. Get the state machine right or everything downstream is wrong.

### Stage 6 — Receipt (the cashier's view) & the margin boundary

After payment, the cashier sees a receipt: items, quantities, line totals, grand total, status.

> _The boundary:_ the receipt — and **every** endpoint a cashier can reach — must never expose `costPrice` or `margin`. Enforce this at the **data layer**, not by hiding fields in React. We will hit your API directly with a cashier token and inspect the raw JSON. A leak here is an automatic concern.

### Stage 7 — Admin sales report (aggregation + the privileged number)

`GET /api/reports/sales?from=&to=` — admin only, current tenant only — returns, in a **single aggregation pipeline**: top products by quantity, total revenue, and **total margin** (price − cost). Cache it; invalidate correctly when a new `paid` order lands. A cashier calling this endpoint gets nothing.

> _Connection:_ this closes the loop — the orders the cashier created in Stages 4–5 are exactly the data the admin analyzes here, with the one field the cashier could never see.

---

## One intentional ambiguity (we're watching for this)

The spec never defines what happens when a request arrives with a **missing or unknown tenant**. Decide, implement it, and defend it in one sentence. There's no single right answer — we want to see that you _noticed the gap_.

---

## `DECISIONS.md` (we read this first — ~600 words)

1. How tenant + role flow through the system from token to data layer.
2. N+1 fix and the indexes (field order + why).
3. What you trust from the client cart vs. re-derive on the server.
4. The no-oversell guarantee under concurrency, and where it breaks.
5. How margin is blocked at the data layer for cashiers.
6. Webhook idempotency + out-of-order handling.
7. The missing-tenant decision.
8. What you prioritized when you ran low on time, and **one thing in this task you'd push back on if a PM handed it to you.**

---

## Scoring (visible — no surprises)

| Area                                                                                                            | Weight |
| --------------------------------------------------------------------------------------------------------------- | ------ |
| **System coherence** — the stages actually connect (cart→order→payment→receipt→report are one consistent truth) | 25%    |
| Correctness — isolation, no-oversell, server-trusted prices, margin never leaks                                 | 25%    |
| Performance — N+1, indexes, aggregation, caching                                                                | 15%    |
| Integration — signed, idempotent, edge-case-safe webhook                                                        | 10%    |
| Code clarity & TypeScript discipline                                                                            | 10%    |
| `DECISIONS.md` judgment + noticing the ambiguity                                                                | 10%    |
| Frontend correctness & error handling                                                                           | 5%     |

**Automatic concerns:** client can set the price; stock goes negative under concurrency; cost/margin reachable with a cashier token; tenant leak; a "paid" receipt for an unpaid order; can't run with `docker compose up`.

**You probably won't perfect all seven stages.** A coherent flow that's missing polish beats a pile of disconnected, half-wired pieces. Tell us what you cut and why — that choice is part of the test.

---

## Live review (30 min — mandatory, weighted)

Be ready to:

- Run the whole flow once, live, and narrate how data moves from login to report.
- Answer: "Two cashiers buy the last unit at the same instant — walk me through exactly what your code does."
- Prove, with a cashier token hitting the raw API, that margin never escapes.
- Make one small change we ask for, on screen.

A polished repo you can't explain or modify is a fail, not a pass.
