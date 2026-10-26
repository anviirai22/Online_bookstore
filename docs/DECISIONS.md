# Decisions

## Confirmed business decisions

These were clarified before implementation as required by the build brief.

1. **Payment:** use the deterministic local sandbox adapter. It records explicit `PENDING`, `SUCCEEDED`, and `FAILED` attempts and never represents a local click as a bank charge.
2. **Payment failure/interruption:** create and preserve a `PENDING_PAYMENT` order and payment attempt. Failed attempts restore the temporary stock reservation; retries use a new idempotency key and recheck stock.
3. **Cancellation:** allow customer or administrator cancellation only before `SHIPPED`, within 24 hours of order creation, for `CONFIRMED`, `PROCESSING`, or `PACKED` orders. Restore reserved stock exactly once.
4. **Reviews:** require a delivered order containing the book. Enforce one review per customer/book and moderate new reviews before public display.
5. **Guest cart:** use browser local storage. On login, merge quantities into the server cart, capped by current stock.
6. **User administration:** provide basic list and customer activation/deactivation. Passwords and roles are not editable through this UI.
7. **Notifications:** do not include a notification provider or delivery claims.

## Engineering defaults

- Use integer cents for prices and order totals.
- Use HTTP-only cookie JWTs plus a user token version for explicit logout invalidation.
- Use a fixed local delivery charge from `SHIPPING_CENTS`; the server calculates it, not the browser.
- Soft-deactivate books and categories instead of deleting records referenced by order history.
- Keep order line snapshots so future catalogue price changes cannot rewrite historical totals.
- Use compensating stock restores for a standalone local MongoDB deployment. Production deployments that require cross-document transactions should run MongoDB as a replica set and add transaction-backed checkout.

## Deliberate limitations

- The payment adapter is local and deterministic, not a live gateway and not evidence of settlement/refunds.
- Notifications are omitted by confirmed choice.
- A local performance run is recorded, but monthly availability and deployment-level performance still require evidence from the target environment; source thresholds are not claimed from code inspection.
