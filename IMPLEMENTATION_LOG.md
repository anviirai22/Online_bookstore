# Implementation Log

## Scope and source review

The repository initially contained only `BUILD_ONLINE_BOOKSTORE.md`; it was not a Git repository. The source SRS, SAD, and STP PDFs were read from the local Downloads directory before implementation. The selected implementation is MERN only: MongoDB, Express, React, and Node.js.

## Phase 1 - Inspect and reconcile

- Reviewed the build brief and all three source PDFs.
- Confirmed the required functional IDs `OBS-F-001` through `OBS-F-018`, security IDs `OBS-SR-001` through `OBS-SR-005`, non-functional IDs `OBS-NF-001` through `OBS-NF-005`, and test ID families.
- Found no existing application code to preserve.
- Confirmed business decisions with the user: deterministic sandbox, pending order on failed/interrupted payment, 24-hour pre-shipping cancellation with stock restoration, delivered-only reviews, browser guest cart merging on login, basic user status management, and no notifications.
- The initial Linux command checks could not find `node`, `npm`, `mongod`, or Docker. Runtime verification later used Windows Node.js v24.14.1/npm 11.11.0 through explicit paths, `mongodb-memory-server`, and Playwright Chromium.

## Phase 2 - Foundation

Files added include workspace configuration, `.env.example`, Docker Compose MongoDB, Mongoose models, configuration, validation, middleware, serializers, seed script, and payment adapter boundary.

Validation: `npm install` completed. Seed validation completed against `mongodb-memory-server`.

## Phase 3 - Authentication and RBAC

Implemented registration, bcrypt password hashing, login, HTTP-only JWT cookie sessions, token-version logout invalidation, inactive-account rejection, server-side admin role checks, safe authentication logs, and basic admin user activation/deactivation.

Validation: server unit and API integration tests passed locally.

## Phase 4 - Catalogue and search

Implemented active/inactive books and categories, public search/filter/sort/pagination, escaped search terms, stock availability, book details, ratings, seeded data, responsive catalogue cards, and book detail UI.

Validation: client component, API integration, and Playwright catalogue smoke tests passed locally.

## Phase 5 - Cart and wishlist

Implemented server-authoritative cart quantities and totals, stock bounds, ownership, wishlist persistence, local browser guest cart, login merge, responsive cart/wishlist screens, and empty/error states.

Validation: cart behavior is covered by the passing API integration suite and browser smoke flow.

## Phase 6 - Checkout and payments

Implemented order line snapshots, integer-cents totals, delivery validation, conditional stock reservations, deterministic sandbox success/failure/pending outcomes, payment attempts, idempotency keys, pending-order retry, safe cart clearing, and failure restoration.

Validation: payment adapter unit tests and integration success/failure tests passed locally.

## Phase 7 - Orders and reviews

Implemented owner-scoped order history/detail, valid admin workflow transitions, 24-hour pre-shipping cancellation, stock restoration, delivered-purchase review eligibility, one-review-per-book constraint, and moderation queue.

Validation: cancellation rule tests passed locally; full browser cancellation flow remains a manual acceptance check.

## Phase 8 - Administration

Implemented admin catalogue/category/inventory/order/review/report/user screens and protected APIs. Important order/payment history is soft-preserved rather than deleted.

Validation: protected admin access and the server test suite passed locally; full admin browser coverage remains a manual acceptance check.

## Phase 9 - Security and quality

Implemented Helmet, CORS allowlist, JSON/request limits, rate limiting, safe error responses, request IDs, structured redacted logs, responsive breakpoints, and deployment HTTPS guidance.

Local performance and desktop/mobile browser measurements were completed. Monthly availability and production HTTPS remain unmeasured and are not claimed here.

## Phase 10 - Documentation and CI

Required README, architecture, API, decisions, security, test matrix, operations, implementation log, CI, seed, and startup documentation are included. CI is configured but has not run from this workspace.

## Phase 11 - Full verification

The following local checks passed:

- `npm install`
- `npm run lint`
- `npm run build`
- `npm run test:unit` (10 server tests and 1 client test)
- `npm run test:integration` (4 API scenarios)
- `npm test` (14 server tests and 1 client test)
- `npm run test:e2e` (4 Playwright smoke tests across desktop Chromium and Pixel 5 mobile with seeded `mongodb-memory-server`)
- API health smoke check on port `5050`
- `npm audit` (0 vulnerabilities after upgrading Vitest to 4.1.12)

The E2E setup binds Vite to `127.0.0.1`, starts the API through `server/src/server.js`, and seeds the in-memory database before Playwright starts. A local performance run against seeded in-memory MongoDB measured 100 sequential requests per endpoint: catalogue p90 `6.85 ms`, book detail p90 `6.93 ms`.

Monthly availability, production HTTPS, and keyboard/manual accessibility checks remain unmeasured. CI has been configured but was not run by a remote CI service. No Git write commands were used.
