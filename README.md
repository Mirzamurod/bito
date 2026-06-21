# BITO POS

Multi-tenant point-of-sale — Express API + Next.js frontend.

## Requirements

- Node.js 20+
- MongoDB 7+ (local or Docker)
- Docker Desktop (for `docker compose up`)

## Quick start — Docker (recommended)

```bash
# Build and start mongo + backend + frontend
docker compose up --build

# Seed demo data (from host — seed script needs devDependencies)
cd backend
MONGODB_URI="mongodb://localhost:27017/bito?replicaSet=rs0" npm run seed
```

| Service  | URL                      |
| -------- | ------------------------ |
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:4000    |
| MongoDB  | localhost:27017 (rs0)    |

Demo users (after seed):

| Email            | Password    | Role    |
| ---------------- | ----------- | ------- |
| cashier@demo.com | password123 | cashier |
| admin@demo.com   | password123 | admin   |

### Demo flow

1. Open http://localhost:3000 → login as `cashier@demo.com`
2. Search products → add to cart → checkout
3. Receipt page shows pending payment
4. For local dev only: use **Simulate payment** button (`npm run dev` + `NODE_ENV=development`)
5. In Docker (production build): simulate payment from host:

```bash
cd backend
npm run simulate-payment -- --orderId=<id> --tenantId=<tenantId>
```

6. Login as `admin@demo.com` → **Sales Report** for revenue/margin

## Quick start — local (without Docker)

```bash
# 1. MongoDB on localhost:27017
# 2. Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Backend: http://localhost:4000  
Frontend: http://localhost:3000

> **Note:** Standalone MongoDB (no replica set) works locally — the backend falls back to non-transactional order creation. Docker Compose uses a replica set for full transaction support.

## Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Key env vars (`frontend/.env.example`):

| Variable               | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `AUTH_SECRET`          | NextAuth session signing                     |
| `JWT_SECRET`           | Must match `backend` JWT_SECRET              |
| `MONGODB_URI`          | Login credential validation (same DB)        |
| `NEXT_PUBLIC_API_URL`  | Browser → Express API (default `:4000`)      |
| `PAYMENT_WEBHOOK_SECRET` | Dev simulate-payment route (match backend) |

### i18n

- Locales: **EN** (`/en/...`) and **UZ** (`/uz/...`)
- Language switcher in the header
- All UI strings in `frontend/messages/en.json` and `uz.json`

## API endpoints

| Method | Path                      | Auth        |
| ------ | ------------------------- | ----------- |
| GET    | `/health`                 | —           |
| GET    | `/api/products`           | JWT         |
| POST   | `/api/orders`             | JWT         |
| GET    | `/api/orders/:id`         | JWT         |
| POST   | `/api/webhooks/payment`   | HMAC        |
| GET    | `/api/reports/sales`      | JWT + admin |

## Dev scripts

```bash
cd backend
npm run token -- cashier@demo.com
npm run simulate-payment -- --orderId=<id> --tenantId=<tenantId>
```

## Project structure

```
bito/
├── backend/           Express + MongoDB API
├── frontend/          Next.js 16 + shadcn/ui + next-intl
├── docker-compose.yml mongo + backend + frontend
└── TASK.md
```
