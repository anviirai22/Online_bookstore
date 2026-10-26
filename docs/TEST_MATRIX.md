# Requirements Traceability Matrix

Status values are honest execution states for this workspace. Local automated verification completed with Windows Node.js, `mongodb-memory-server`, and Playwright Chromium. Results distinguish direct assertions from broader acceptance checks that still need manual or production measurement.

| Requirement | Acceptance test | Evidence | Result |
|---|---|---|---|
| OBS-F-001 | TC-AUTH-01 | `server/tests/integration/api.test.js`, register route/schema | Passed locally (integration) |
| OBS-F-002 | TC-AUTH-02 | `server/tests/integration/api.test.js`, login/JWT cookie | Passed locally (integration) |
| OBS-F-003 | TC-AUTH-03 | logout token-version logic in `authService.js` and auth middleware | Implemented; no dedicated assertion |
| OBS-F-004 | TC-CAT-01 | `catalogService.listBooks`, HomePage, integration catalogue test | Passed locally (integration/E2E smoke) |
| OBS-F-005 | TC-SRCH-01 | escaped title/author/keyword query in `catalogService.js`, HomePage search | Passed locally (integration/E2E smoke) |
| OBS-F-006 | TC-SRCH-02 | category/price/availability filters and UI filter panel | Implemented; broader acceptance pending |
| OBS-F-007 | TC-BOOK-01 | `catalogService.getBook`, BookDetailsPage and published reviews | Implemented; broader acceptance pending |
| OBS-F-008 | TC-CART-01 | cart service stock validation and CartPage | Passed locally (integration/E2E smoke) |
| OBS-F-009 | TC-CART-02 | cart quantity bounds, server price totals, CartPage controls | Passed locally (integration) |
| OBS-F-010 | TC-WISH-01 | `wishlistService`, WishlistContext, WishlistPage | Implemented; no dedicated assertion |
| OBS-F-011 | TC-CHK-01 | address schema, CheckoutPage, order snapshot creation | Passed locally (integration) |
| OBS-F-012 | TC-PAY-01 | sandbox adapter, PaymentAttempt, order integration success/failure tests | Passed locally (unit/integration) |
| OBS-F-013 | TC-ORD-01 | owner-scoped order service, OrdersPage, ownership query | Implemented; broader acceptance pending |
| OBS-F-014 | TC-ORD-02 | cancellation eligibility unit test, cancellation route and stock restore | Passed locally (unit rule); route flow pending |
| OBS-F-015 | TC-REV-01 | delivered-order eligibility in `reviewService.js`, BookDetailsPage | Implemented; broader acceptance pending |
| OBS-F-016 | TC-ADM-01 | admin book/category routes and AdminBooksPage/AdminCategoriesPage | Implemented; admin acceptance pending |
| OBS-F-017 | TC-ADM-02 | stock update and valid order transitions, AdminOrdersPage | Implemented; admin acceptance pending |
| OBS-F-018 | TC-ADM-03 | moderation/report routes and AdminReviewsPage/AdminDashboardPage | Implemented; admin acceptance pending |
| OBS-NF-001 | TC-PERF-01 | repeatable catalogue/detail request procedure below | Passed locally; p90 catalogue 6.85 ms, detail 6.93 ms |
| OBS-NF-002 | TC-REL-01 | `/api/health` and availability calculation in `OPERATIONS.md` | Not measured |
| OBS-NF-003 | TC-UX-01 | responsive CSS breakpoints and Playwright smoke flows | Desktop and Pixel 5 mobile E2E passed; manual accessibility pending |
| OBS-NF-004 | TC-DATA-01 | payment attempt/order state model and integration failure test | Passed locally (integration) |
| OBS-NF-005 | TC-ERR-01 | safe error middleware, validation details, UI feedback components | Implemented; broader error-path acceptance pending |
| OBS-SR-001 | TC-SEC-01 | bcrypt hash storage and safe user serializers | Passed locally (integration) |
| OBS-SR-002 | TC-SEC-02 | server `requireRole` and customer-admin integration test | Passed locally (integration) |
| OBS-SR-003 | TC-SEC-03 | Zod schemas, escaped search, bounded inputs, negative unit tests | Passed locally (unit/integration) |
| OBS-SR-004 | TC-SEC-04 | production HTTPS/cookie configuration in `SECURITY.md` | Deployment check pending |
| OBS-SR-005 | TC-SEC-05 | redacting logger and AuditEvent records | Implemented; dedicated assertion pending |

## Test procedures not represented by a local automated assertion

- **TC-PERF-01:** seed a representative catalogue, make at least 100 catalogue and 100 detail requests under normal local load, record p90 and environment. The recorded local run used Windows Node.js, the Express API, and in-memory MongoDB: catalogue p90 `6.85 ms`, detail p90 `6.93 ms`; repeat in a deployment-like environment before making a production claim.
- **TC-REL-01:** collect health checks over the reporting month, exclude approved maintenance and documented third-party outages, then apply the formula in `OPERATIONS.md`.
- **TC-UX-01:** Playwright desktop and Pixel 5 mobile smoke flows passed. Manually check keyboard focus, labels, empty states, and checkout failure/retry before release.
- **TC-SEC-04:** deploy behind HTTPS, verify redirect and secure cookie behavior, and record the environment.
