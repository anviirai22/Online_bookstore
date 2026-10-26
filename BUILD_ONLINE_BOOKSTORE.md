# GIT SAFETY — STRICT

You are working in my existing repository. You may create, modify, and delete application files as necessary, but **do not run `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git reset`, `git rebase`, `git merge`, or `git cherry-pick`**. Do not change branches, remotes, tags, Git configuration/history, or anything inside `.git/`. Read-only commands such as `git status`, `git diff`, and `git log` are allowed. Leave all changes uncommitted for my review.

# BUILD BRIEF — Complete Online Bookstore

Build a **complete, runnable, tested Online Bookstore** in this repository, not a prototype, UI-only mockup, or design document. This brief is adapted from the reference `BUILD_STUDENT_RECORD_SYSTEM.md`, but the authoritative project scope comes from the three Online Bookstore documents:

- `Online_Bookstore_SRS_Team4.pdf` — Software Requirements Specification v1.0
- `SAD_Team4_OnlineBookstore (1).pdf` — Software Architecture and Design Specification v1.0
- `Online_Bookstore_Test_Plan_Team4.pdf` — Software Test Plan v1.0

**Use MERN exclusively:** MongoDB, Express.js, React, Node.js. The source documents mention Django as an alternative; MERN is the selected implementation stack. Do not add Django or MySQL. Preserve the exact source requirement IDs `OBS-F-001`–`OBS-F-018`, `OBS-NF-001`–`OBS-NF-005`, and `OBS-SR-001`–`OBS-SR-005` in traceability and tests.

Ignore team allocation, academic schedules, sprint dates, and milestone assignments when implementing. Finish the full application, while keeping code and tests organized so that four team members can collaborate through GitHub PRs. Do not fabricate completion, test results, or external-service integrations.

---

# 0. HOW YOU MUST WORK

1. Inspect the repository and the three project PDFs before making changes. Identify what already works; preserve useful existing code.
2. **Actually implement** all required modules, models, APIs, frontend pages, tests, configuration, and documentation. Install dependencies and execute available tests/builds. Do not stop at scaffolding or provide pseudocode in place of implementation.
3. Before each major phase, print a short update, e.g. `[Phase 3/11] Authentication — building registration, login, logout and role protection.` After each phase summarize files changed, commands run, actual pass/fail results, and next phase.
4. Maintain `IMPLEMENTATION_LOG.md` with progress, important decisions, assumptions, validation commands, real test results, and limitations. Keep `docs/DECISIONS.md` for minor engineering choices.
5. Ask me before making consequential choices not specified in the source documents. Explain the decision, sensible options, and your recommended default; wait for my answer for that decision. You may continue independent work. Do not repeatedly ask settled questions.
6. In particular, clarify before finalizing: payment gateway versus deterministic local sandbox; payment-failure and retry behavior; eligible cancellation statuses/window and stock restoration; whether reviews require completed purchases; guest-cart persistence; admin user-management scope; and notification delivery. If I have already answered, use my answer. Never silently invent business rules.
7. Local sandbox/mock adapters are allowed for **external payment and optional notification providers only**. Authentication, catalog, cart, wishlist, orders, inventory, reviews, admin functions, and persistence must be real.
8. Do not assume a service started, a command passed, or a browser flow worked unless verified. If tooling/services are unavailable, report exactly what could and could not be tested.

## Definition of done

- A fresh checkout can be configured and started using the README and `.env.example`.
- MongoDB data persists; repeatable seed data and a reset procedure exist.
- Guest, customer, and administrator flows work end-to-end through React UI and Express APIs.
- All `OBS-F-001`–`OBS-F-018` are implemented and mapped to tests.
- All five security requirements and five non-functional requirements have implementation or measurable verification evidence; environment-dependent metrics are not falsely claimed.
- Unit, integration, and representative browser/system tests pass, or failures are explicitly documented.
- No required screen is an empty placeholder; checkout is usable with a documented test-payment adapter when live credentials are absent.
- Documentation, GitHub Actions CI, final smoke-test results, and a precise limitations list are supplied.

---

# 1. ARCHITECTURE AND TECHNOLOGY

Follow the SAD's **layered modular monolith**, not microservices:

`Browser (React customer/admin UI) → Express REST/JSON API → business services/data access → MongoDB`

The backend alone accesses MongoDB. External payment and optional notification providers are isolated behind adapters. Keep presentation, routing, validation, services, and persistence separate. Use server-side authentication, authorization, and stock/price validation; never trust client-submitted prices, roles, totals, or payment status.

Recommended concrete choices (engineering defaults, not additional SRS requirements):

- Node.js LTS, JavaScript throughout (matching selected stack), npm workspaces if helpful.
- React + Vite + React Router; responsive semantic HTML and maintainable CSS.
- Express + Mongoose + schema/request validation (Zod or Joi), bcrypt/Argon2 password hashing, JWT or secure session strategy, Helmet, CORS allowlist, request rate limiting.
- MongoDB with unique indexes, references and appropriate atomic updates/transactions for order/stock integrity. Document replica-set requirements if using MongoDB transactions.
- Vitest/Jest for unit tests; Supertest for API integration tests; React Testing Library for key components; Playwright for representative end-to-end flows.
- GitHub Actions for install, lint (if configured), build, and automated tests on pushes and pull requests. Never claim CI passed until a real workflow run confirms it.
- Optional Docker Compose for local MongoDB/API/web, with a straightforward non-Docker setup too.

Do not introduce paid libraries or production credentials. Keep secrets in environment variables; commit only `.env.example`.

## Suggested repository layout

```text
online-bookstore/
  client/
    src/
      api/ components/ contexts/ layouts/ pages/
      routes/ hooks/ utils/
    tests/
    package.json
  server/
    src/
      config/ middleware/ models/ routes/ controllers/
      services/ validators/ integrations/
      app.js server.js
    tests/
      unit/ integration/
    scripts/seed.js
    package.json
  e2e/
  docs/
    ARCHITECTURE.md
    API.md
    DECISIONS.md
    SECURITY.md
    TEST_MATRIX.md
    OPERATIONS.md
  .github/workflows/ci.yml
  .env.example
  .gitignore
  README.md
  IMPLEMENTATION_LOG.md
  package.json
```

Adapt the layout to an existing working repository rather than needlessly rewriting it.

---

# 2. USERS AND ACCESS CONTROL

- **Guest:** browse, search, filter, and inspect book details. Can use a temporary cart if chosen, but must authenticate before protected checkout/account actions.
- **Customer:** register, log in/out, manage cart and wishlist, checkout, view only their own orders, track/cancel eligible orders, and review eligible purchased books.
- **Administrator:** access protected administration pages/APIs for books, categories, inventory, orders, review moderation, and basic sales/order reporting; support user administration only to the extent established in the source documents or clarified with me.

Default deny. Check roles and ownership in every protected backend endpoint, including direct API calls. A customer must not view another customer's cart, wishlist, order, or review-management privileges. UI hiding alone is never authorization.

---

# 3. FUNCTIONAL REQUIREMENTS — IMPLEMENT ALL 18

Use the source IDs and acceptance criteria exactly in the requirements/test matrix.

## Authentication — `OBS-F-001` to `OBS-F-003`

- **OBS-F-001:** Register a customer using a unique email and validated password. Reject duplicate/invalid input and show a confirmation. `TC-AUTH-01`.
- **OBS-F-002:** Authenticate email/password and establish an authorized session/JWT. Reject incorrect credentials. `TC-AUTH-02`.
- **OBS-F-003:** Logout invalidates the active session from protected features. `TC-AUTH-03`.

Implement secure hashing, protected route middleware, safe session expiry, and understandable validation errors.

## Catalogue and search — `OBS-F-004` to `OBS-F-007`

- **OBS-F-004:** List active/available books with title, author, price, cover image, and stock/availability. `TC-CAT-01`.
- **OBS-F-005:** Search by title, author, or relevant keyword; handle no results. `TC-SRCH-01`.
- **OBS-F-006:** Browse/filter by category and supported criteria such as price and availability. `TC-SRCH-02`.
- **OBS-F-007:** Book detail page with description, author, category, price, stock status, and available ratings. `TC-BOOK-01`.

Support consistent pagination/sorting where helpful, without displacing source-defined features.

## Cart and wishlist — `OBS-F-008` to `OBS-F-010`

- **OBS-F-008:** Add an in-stock book to the cart with correct quantity and price. `TC-CART-01`.
- **OBS-F-009:** Update quantity/remove cart items; recompute totals and reject quantities above available stock. `TC-CART-02`.
- **OBS-F-010:** Authenticated customer can add/remove wishlist books and see changes persist after refresh. `TC-WISH-01`.

Recalculate all amounts on the backend; recheck stock at checkout. Never rely on stale browser cart totals.

## Checkout and orders — `OBS-F-011` to `OBS-F-014`

- **OBS-F-011:** Validate delivery address and show an accurate order summary before payment confirmation. `TC-CHK-01`.
- **OBS-F-012:** Initiate payment through configured external gateway/sandbox and create a confirmed order only after explicitly successful payment confirmation. `TC-PAY-01`.
- **OBS-F-013:** Display the signed-in customer's own order history and current status. `TC-ORD-01`.
- **OBS-F-014:** Permit cancellation only for eligible statuses/within configured rules; show a clear reason otherwise. `TC-ORD-02`.

Keep order/payment attempt state auditable, handle failed or interrupted payment safely, avoid duplicate confirmed orders on retries, and maintain stock integrity. Use a deterministic local payment adapter with success/failure test modes if a real gateway is not configured; clearly label this as sandbox behavior, not live charging.

## Reviews and administration — `OBS-F-015` to `OBS-F-018`

- **OBS-F-015:** Eligible purchaser submits a rating/review tied to the correct book and customer. `TC-REV-01`.
- **OBS-F-016:** Admin creates/edits/activates/deactivates books and manages categories. `TC-ADM-01`.
- **OBS-F-017:** Admin updates stock and manages order status changes with valid workflow transitions. `TC-ADM-02`.
- **OBS-F-018:** Admin moderates inappropriate reviews and views basic sales/order information. `TC-ADM-03`.

Provide real admin pages, confirmation/error feedback, and server-side checks. Do not silently delete important order/payment history.

---

# 4. DATABASE DESIGN

Create Mongoose models with indexes, timestamps, and ownership references. At minimum:

- `User`: unique email, password hash, role, account status, timestamps.
- `Category`: name/slug, active state.
- `Book`: title, author, description, category, price, cover URL, stock quantity, active state, timestamps.
- `Cart` and `CartItem` (embedded or referenced): customer/session, book, quantity; compute totals from current book records.
- `Wishlist`: owner and unique book entries.
- `Order` and order line snapshots: customer, purchased book/price/quantity snapshots, delivery address, totals, status, timestamps.
- `PaymentAttempt`/payment records: order/checkout correlation, gateway reference, amount, state, timestamps, retry/idempotency identifiers; no raw payment-card secrets.
- `Review`: owner, book, rating, text, moderation/visibility status.
- Optional `AuditEvent` for login/admin/order-security events and reporting support.

Choose transaction and reservation/stock-decrement behavior explicitly, after resolving any material ambiguities. Prevent overselling, duplicate payment confirmation, and unauthorized modifications. Include realistic seed books/categories, a demo customer, and an admin account with credentials configured/documented for **local development only**.

---

# 5. FRONTEND — REQUIRED SCREENS

Build a cohesive, usable, responsive interface with clear navigation, loading/empty/error states, form labels, and mobile layouts.

**Guest/customer:** Home/catalogue, search/filter results, book details, register, login, cart, wishlist, checkout/delivery/order review, sandbox payment outcome, order confirmation, order history, order detail/status, cancellation action, rating/review submission, and account/logout.

**Admin:** Protected dashboard, book create/edit/list/activation, category management, stock management, order list/detail/status updates, review moderation, and basic sales/order report. Add user-management UI only when its required behavior is clear from the documents or confirmed by me.

Primary flow: **browse/search → book details → cart → checkout → payment → confirmed order**. Provide informative stock labels and never expose backend stack traces to users.

---

# 6. REST API CONTRACT

Honor the SAD's documented examples and extend consistently:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/books` | List/search/filter catalogue |
| GET | `/api/books/:id` | Book details |
| GET/POST/PUT/DELETE | `/api/cart` and item paths | Manage cart |
| GET/POST/DELETE | `/api/wishlist` and item paths | Manage wishlist |
| POST | `/api/orders` | Checkout/order creation via payment workflow |
| GET | `/api/orders` | Current customer's order history |
| GET | `/api/orders/:id` | Authorized order details |
| POST | `/api/orders/:id/cancel` | Eligible cancellation |
| POST | `/api/reviews` | Submit eligible review |
| GET/POST/PUT | `/api/admin/books` and item paths | Manage books |
| GET/POST/PUT | `/api/admin/categories` and item paths | Manage categories |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET/PUT | `/api/admin/reviews` and item paths | Review moderation |
| GET | `/api/admin/reports/sales` | Basic order/sales reporting |
| GET | `/api/health` | Health check |

These additional route shapes are suggested implementation details; preserve SAD examples and document the final API. Use JSON, proper HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500` as appropriate), request validation, and a consistent safe error format. Document auth, sample payloads, permissions, and error cases in `docs/API.md`.

---

# 7. SECURITY REQUIREMENTS — ALL FIVE

- **OBS-SR-001:** Store passwords securely as salted password hashes, never plaintext; verify with `TC-SEC-01`.
- **OBS-SR-002:** Enforce role-based access so customer accounts cannot access admin operations; `TC-SEC-02`.
- **OBS-SR-003:** Server-side validation/sanitization of account, search, cart, review, and admin inputs; `TC-SEC-03`.
- **OBS-SR-004:** Protect authenticated/sensitive communication with HTTPS in deployed environments; `TC-SEC-04`. Local HTTP development is acceptable only with documented limitations and an HTTPS-capable deployment configuration.
- **OBS-SR-005:** Log relevant authentication/admin security events without recording passwords, tokens, or other secrets; `TC-SEC-05`.

Add secure headers, sensible request limits, protected cookies or carefully managed tokens, safe CORS settings, least privilege, and no secrets in Git. Handle injection-like inputs and cross-account authorization attempts. Explain any limitations in `docs/SECURITY.md`.

---

# 8. NON-FUNCTIONAL REQUIREMENTS — ALL FIVE

- **OBS-NF-001 / `TC-PERF-01`:** At least 90% of tested catalogue and book-detail requests complete within **3 seconds** under normal load. Provide repeatable performance test and record environment, sample size, measured p90; do not claim compliance without results.
- **OBS-NF-002 / `TC-REL-01`:** Target **99.5% monthly availability**, excluding documented maintenance/third-party outages. Provide a health endpoint, monitoring procedure, and calculation; do not claim a month of measured uptime without observing it.
- **OBS-NF-003 / `TC-UX-01`:** Usable on representative desktop and mobile screen sizes. Test primary flows at both.
- **OBS-NF-004 / `TC-DATA-01`:** Preserve auditable order/payment state across failed or interrupted checkout; test failure and retry paths.
- **OBS-NF-005 / `TC-ERR-01`:** Clear, nontechnical validation/error messages with no sensitive details or stack traces.

---

# 9. TESTING — FOLLOW THE SOFTWARE TEST PLAN

Implement automated tests and document manual checks as needed:

**Unit:** validation, authentication helpers, search/filter logic, cart totals/quantity bounds, stock checks, cancellation eligibility, review eligibility, payment state transitions.

**Integration:** Express API + MongoDB for register/login/logout, book catalogue/search, cart/wishlist, checkout success/failure, ownership checks, admin RBAC, inventory/status changes, reviews, and reporting. Use a separate test database and isolated test data.

**System/E2E:** guest browse/search, customer registration/login, add-to-cart → checkout → sandbox success → order history, sandbox failure, order cancellation where eligible, admin book/inventory/order management, and customer denial from admin routes.

**Negative/boundary:** duplicate emails, wrong credentials, empty results, zero/negative/excess quantities, inactive/out-of-stock books, invalid addresses, tampered prices, payment retry, unauthorized order IDs, malformed inputs, invalid order transitions, ineligible review/cancellation, secret leakage.

**Security:** `TC-SEC-01`–`TC-SEC-05` as above, JWT/session expiry/logout, admin API protection, input validation and safe logging.

**Performance/responsive:** `TC-PERF-01`, `TC-UX-01`, plus health/availability documentation and `TC-DATA-01`.

Maintain `docs/TEST_MATRIX.md` mapping **every** OBS requirement to a test ID, test file/procedure, and observed result. Record failures and fixes in `IMPLEMENTATION_LOG.md`. Respect the test plan's exit criteria: execute high-priority tests, no known blocker/critical defect, core customer/admin acceptance flows pass, and auth/RBAC checks complete. External gateway internals, actual bank settlement/refunds, courier operations, and production-scale infrastructure are outside this project's testing scope.

---

# 10. EXTERNAL PAYMENT AND NOTIFICATIONS

Payments must be handled by an external provider or documented sandbox/mock adapter, never by pretending that a UI click is a real bank payment. Keep an explicit `PENDING`/`SUCCEEDED`/`FAILED` attempt record (or equivalent), verify confirmation server-side, and only mark an order paid/confirmed after successful verification. Provide deterministic local success/failure scenarios and idempotency protection. Ask me before choosing a provider or business-sensitive payment/refund behavior.

Notifications are optional in the SRS/SAD. If included, provide a development adapter that records or previews messages without sending real email; never claim delivery unless verified. Do not add unrelated third-party integrations.

---

# 11. SEED DATA AND DEMONSTRATION

Provide a repeatable seed script that creates several categories, diverse books with realistic prices/stock, one or more customers, an administrator, and optionally sample completed orders/reviews. Clearly distinguish seed/demo records from actual transactions. Use development-only demo credentials supplied through environment configuration or generated locally; never ship a hardcoded production password. README must explain starting MongoDB, seeding, launching the app, and testing the main customer and admin flows.

---

# 12. DOCUMENTATION AND CI/CD

Required deliverables:

- `README.md`: prerequisites, installation, `.env` setup, MongoDB setup, run/build/test commands, demo walkthrough, troubleshooting.
- `.env.example`: documented nonsecret settings (MongoDB URL, ports, auth secret placeholder, payment adapter mode, client API URL, etc.).
- `docs/ARCHITECTURE.md`: layered design, modules, data models, main checkout/admin flow, and SAD alignment.
- `docs/API.md`: endpoints, auth, sample requests/responses, errors.
- `docs/DECISIONS.md`: clarifications, minor defaults, deviations from source documents.
- `docs/SECURITY.md`: security controls, testing, HTTPS setup, limitations.
- `docs/TEST_MATRIX.md`: OBS requirement → acceptance test → evidence/results.
- `docs/OPERATIONS.md`: health checks, local setup, backup/restore guidance, availability measurement.
- `IMPLEMENTATION_LOG.md`: real work completed and validation results.
- `.github/workflows/ci.yml`: install, lint if applicable, build, unit/integration tests on push/PR; use appropriate MongoDB service for integration tests.

Do not run any Git write operations. I will create commits and PRs manually.

---

# 13. IMPLEMENTATION PHASES — EXECUTE, DO NOT JUST PLAN

**Phase 1 — Inspect and reconcile:** read project PDFs and repository; inventory existing code; identify missing features and meaningful ambiguities; document source-to-implementation mapping.

**Phase 2 — Foundation:** MERN project setup, environment validation, MongoDB connection, app structure, error handling, base routes, seed data.

**Phase 3 — Authentication and RBAC:** registration, login, logout, secure hashing, customer/admin route protection, unit/integration tests.

**Phase 4 — Catalogue and search:** book/category models, listing, details, search/filter, frontend pages, tests.

**Phase 5 — Cart and wishlist:** add/update/remove, persistence, stock bounds, totals, UI and tests.

**Phase 6 — Checkout and payments:** address/order summary, sandbox/provider adapter, auditable payment attempts, order creation, stock/data integrity, retries and failure tests.

**Phase 7 — Orders and reviews:** order history/status, eligible cancellation, reviews/ratings and their tests.

**Phase 8 — Administration:** books/categories, inventory, order statuses, moderation, basic sales reports, protected UI and APIs.

**Phase 9 — Security and quality:** verify all five security requirements, responsive behavior, safe errors, measurable performance, health monitoring, and regression tests.

**Phase 10 — Documentation and CI:** README, API/security/architecture/operations docs, RTM/test matrix, GitHub Actions, seed and startup verification.

**Phase 11 — Full verification:** install/build/lint/test, run API and UI, execute main customer/admin smoke flows, fix discovered bugs, report remaining issues precisely.

After each phase, keep the implementation log updated. Do not mark a phase complete merely because files exist; validate behavior.

---

# 14. QUALITY BAR

- Implement all source-defined functionality; do not add unrelated features instead of completing the core requirements.
- No required API route should be a stub; no core screen should be a placeholder.
- Keep modules readable and maintainable for a four-person student team.
- Validate data on both client and server, with the server authoritative.
- Handle loading, empty, unavailable-stock, payment-failure, unauthorized, and network-error states gracefully.
- Never store passwords or sensitive payment details in plaintext; never expose secrets in logs.
- Ensure database consistency, access control, and repeatable testing.
- Do not claim production-grade availability or live payment integration without evidence.

# 15. FINAL RESPONSE I EXPECT

When finished, provide:

1. A concise description of the implemented application and main flows.
2. The actual project structure and key files created/modified.
3. Exact install, seed, run, build, and test commands.
4. A requirements coverage summary for `OBS-F-001`–`018`, `OBS-NF-001`–`005`, `OBS-SR-001`–`005`.
5. Commands executed and **actual** test/build results (including failures and skipped checks).
6. Demo customer/admin access procedure without disclosing secrets.
7. Remaining decisions, limitations, and unresolved defects.
8. `git status` summary, confirming all changes remain **uncommitted**.

**Start by inspecting the existing repository and the three Online Bookstore source documents, then proceed to implementation.**
