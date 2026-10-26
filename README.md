# Leaf & Line Online Bookstore

Leaf & Line is a complete MERN online bookstore for guest browsing, customer purchasing, and protected administrator operations. It uses a layered Express API, MongoDB persistence through Mongoose, and a responsive React/Vite interface.

## Requirements

- Node.js 20 or newer and npm 10 or newer
- MongoDB 7 or a compatible MongoDB deployment
- A modern browser for the React client
- Docker Desktop is optional and can provide local MongoDB

The application does not require a live payment account. Checkout uses an explicit deterministic local sandbox adapter and never accepts raw card data.

## Setup

```bash
cp .env.example .env
npm install
```

Set `JWT_SECRET`, `ADMIN_PASSWORD`, and `DEMO_CUSTOMER_PASSWORD` in `.env` before sharing the application or deploying it. The values in `.env.example` are development placeholders only.

Start MongoDB directly or use the optional container:

```bash
docker compose up -d mongodb
```

Seed repeatable development data:

```bash
npm run seed
```

The seed creates five categories, eight books, one administrator, one customer, a demo delivered order, a published review, and a wishlist. Running it resets the configured database, so never run it against a database containing real transactions.

Start the API and React client together:

```bash
npm run dev
```

- React UI: `http://localhost:5173`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

Build the client for a production-style server:

```bash
npm run build
npm start
```

The Express server serves `client/dist` when it exists. In production, put the server behind an HTTPS reverse proxy and set `COOKIE_SECURE=true`.

## Main flows

1. Open Browse as a guest and search, filter, or inspect a book.
2. Add books to the browser-backed guest cart, then sign in to merge it into the customer cart.
3. Complete delivery details and choose a deterministic sandbox outcome. Success confirms an order; failure or pending creates an auditable `PENDING_PAYMENT` order that can be retried.
4. Open Orders to view only the signed-in customer's records. Confirmed, processing, or packed orders can be cancelled within 24 hours and restore stock.
5. A customer can submit a review only after an administrator moves a purchased order to `DELIVERED`. New reviews start as `PENDING` and are moderated in Admin desk.
6. Administrators can manage books, categories, stock, order transitions, reviews, reports, and customer account activation.

## Sandbox test modes

The checkout form exposes `success`, `failure`, and `pending` modes. The server verifies the adapter result before confirming an order. `PAYMENT_SANDBOX_MODE` sets the default adapter mode, while the checkout field allows repeatable local test scenarios. This is not live payment processing.

## Commands

```bash
npm run lint
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

The integration and E2E suites use `mongodb-memory-server`. The E2E command seeds an isolated database before starting Playwright. Playwright requires its browser install in a fresh environment:

```bash
npx playwright install chromium
```

## Demo access

The seed uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_CUSTOMER_EMAIL`, and `DEMO_CUSTOMER_PASSWORD` from `.env`. Use those configured local-development values to sign in. Do not commit them or reuse them in a deployed environment.

## Reset and backup

For a clean development reset, stop the app and run `npm run seed`. For a database backup and restore, see [`docs/OPERATIONS.md`](docs/OPERATIONS.md). Never use the seed script as a production migration.

## Project documents

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - layered design and data flows
- [`docs/API.md`](docs/API.md) - REST contract and examples
- [`docs/DECISIONS.md`](docs/DECISIONS.md) - confirmed business decisions
- [`docs/SECURITY.md`](docs/SECURITY.md) - controls, deployment, and limitations
- [`docs/TEST_MATRIX.md`](docs/TEST_MATRIX.md) - OBS-to-test traceability
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) - setup, health, backups, and availability measurement
- [`IMPLEMENTATION_LOG.md`](IMPLEMENTATION_LOG.md) - implementation phases and actual validation status
