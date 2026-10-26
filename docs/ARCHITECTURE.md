# Architecture

## Shape

The application follows the selected layered modular-monolith architecture:

```text
Browser (React/Vite)
        |
        | REST/JSON over HTTPS in deployment
        v
Express API routes and middleware
        |
        v
Application services and validation
        |
        v
Mongoose models -> MongoDB
```

External payment behavior is isolated behind `server/src/integrations/payment/sandboxAdapter.js`. There is no notification integration because notifications are optional and were explicitly excluded from this implementation.

## Repository modules

- `client/src/pages` contains customer, checkout, order, review, and admin screens.
- `client/src/contexts` owns session, cart, and wishlist state. A guest cart is browser-local and is merged after login.
- `client/src/api.js` is the single browser-to-API boundary and always includes the secure session cookie.
- `server/src/routes` maps REST paths to request validation and services.
- `server/src/middleware` contains authentication, server-side role checks, validation, rate limiting integration, request IDs, and safe errors.
- `server/src/services` contains catalog, cart, wishlist, order/payment, review, authentication, and admin rules.
- `server/src/models` contains MongoDB schemas with timestamps, references, uniqueness, and indexes.
- `server/src/integrations` contains replaceable external adapters.

## Data model

- `User` stores a unique email, salted bcrypt hash, role, account status, and token version. Password hashes are never selected in normal responses.
- `Category` stores a unique slug and active state.
- `Book` stores catalogue fields, integer `priceCents`, inventory, active state, and denormalized published-review statistics.
- `Cart` is owned by a customer and contains book references plus quantities. Totals are calculated from current book records.
- `Wishlist` is owned by a customer and has a set-like book array.
- `Order` stores immutable line snapshots, delivery address, integer totals, workflow status, and inventory reservation/restoration flags.
- `PaymentAttempt` stores state, amount, idempotency key, safe gateway reference, and safe failure details. It never stores card secrets.
- `Review` references a customer and book, has a unique customer/book constraint, and has moderation state.
- `AuditEvent` records security and business events without request secrets.

## Checkout flow

1. The authenticated customer sends the delivery address and an `Idempotency-Key`.
2. The service reads the persisted cart, reloads current books, validates active state and stock, and recalculates line snapshots and totals.
3. A `PENDING_PAYMENT` order and `PENDING` payment attempt are created.
4. Inventory is decremented with conditional atomic updates. If one item cannot be reserved, earlier decrements are restored and the attempt is marked failed.
5. The sandbox adapter returns `SUCCEEDED`, `FAILED`, or `PENDING`.
6. Only `SUCCEEDED` changes the order to `CONFIRMED` and clears the cart. Failed and pending outcomes preserve the order/attempt audit trail and restore the temporary inventory reservation.
7. A retry uses a new idempotency key and rechecks stock before attempting payment again.

MongoDB transactions are not required by the local standalone setup. Conditional inventory updates and compensating restores are used, and the production operations guide recommends a replica set plus transactions if the deployment requires stronger multi-document atomicity.

## Authorization

The browser receives an HTTP-only cookie containing a signed JWT. Every protected request reloads the user, verifies account status and `tokenVersion`, and checks ownership or administrator role. Logout increments `tokenVersion`, invalidating the active JWT before its natural expiry.

## Source alignment

The implementation uses MERN exclusively, follows the SAD layered modular-monolith recommendation, preserves REST/JSON boundaries, and keeps payment outside the bookstore domain behind an adapter. Source requirement IDs and test IDs are preserved in [`TEST_MATRIX.md`](TEST_MATRIX.md).
