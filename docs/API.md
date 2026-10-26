# API Contract

Base URL: `http://localhost:5000/api` in local development. JSON is used for request and response bodies. Authenticated browser requests use the HTTP-only cookie set by login; API clients may also send `Authorization: Bearer <token>`.

Successful responses use `{ "data": ... }`. Errors use `{ "error": { "code": "...", "message": "...", "details": [] } }`. The API does not return stack traces, password hashes, JWTs, or payment secrets.

## Public routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Database readiness, uptime, and status |
| GET | `/books` | Catalogue with `q`, `category`, `minPrice`, `maxPrice`, `available`, `sort`, `page`, and `limit` |
| GET | `/books/:id` | Active book details and published reviews |
| GET | `/categories` | Active categories |

Example:

```bash
curl 'http://localhost:5000/api/books?q=javascript&available=true&sort=rating'
```

## Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer |
| POST | `/auth/login` | Public | Authenticate a customer or admin |
| POST | `/auth/logout` | Authenticated | Increment token version and clear cookie |
| GET | `/auth/me` | Authenticated | Return the current safe user |

Registration body:

```json
{ "name": "Reader One", "email": "reader@example.com", "password": "readmore1" }
```

## Cart and wishlist

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/cart` | Customer | Current cart and server-derived totals |
| POST | `/cart/items` | Customer | `{ "bookId": "...", "quantity": 1 }` |
| POST | `/cart/merge` | Customer | Merge browser guest items after login |
| PUT | `/cart/items/:bookId` | Customer | Replace quantity |
| DELETE | `/cart/items/:bookId` | Customer | Remove item |
| DELETE | `/cart` | Customer | Clear cart |
| GET | `/wishlist` | Customer | Current wishlist |
| POST | `/wishlist/items/:bookId` | Customer | Add book |
| DELETE | `/wishlist/items/:bookId` | Customer | Remove book |

## Orders and payment

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/orders` | Customer | Validate address, create payment attempt, and execute sandbox payment |
| GET | `/orders` | Customer | Current customer's order history only |
| GET | `/orders/:id` | Owner | Authorized order detail |
| POST | `/orders/:id/pay` | Owner | Retry a `PENDING_PAYMENT` order with a new idempotency key |
| POST | `/orders/:id/cancel` | Owner | Cancel an eligible order and restore stock |

Checkout body:

```json
{
  "address": {
    "fullName": "Reader One",
    "line1": "1 Main Street",
    "line2": "",
    "city": "Bengaluru",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India",
    "phone": "+91 9000000000"
  },
  "paymentMode": "success"
}
```

`paymentMode` is a deterministic local sandbox control with `success`, `failure`, and `pending`. A successful creation returns `201`; a pending adapter result returns `202`; a declined result returns `402` with the pending order in `data.order`; invalid address/stock is `400`/`409`.

## Reviews

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/reviews` | Customer | Submit a rating and text after a delivered purchase |

Reviews start as `PENDING`. Public catalogue responses include only `PUBLISHED` reviews.

## Administration

All routes below require an authenticated user with role `admin`. Customer calls receive `403`.

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/admin/books` | List all books / create a book |
| PUT/DELETE | `/admin/books/:id` | Edit / deactivate a book |
| PUT | `/admin/books/:id/stock` | Update stock quantity |
| GET/POST | `/admin/categories` | List / create categories |
| PUT/DELETE | `/admin/categories/:id` | Edit / deactivate category |
| GET | `/admin/orders` | List orders with optional status/page filters |
| GET | `/admin/orders/:id` | View any order |
| PUT | `/admin/orders/:id/status` | Apply a valid fulfilment transition |
| GET | `/admin/reviews` | List moderation queue |
| PUT | `/admin/reviews/:id` | Publish or reject a review |
| GET | `/admin/reports/sales` | Basic order/revenue/item report |
| GET | `/admin/users` | List accounts |
| PUT | `/admin/users/:id/status` | Activate/deactivate a customer account |

Order transitions are server controlled: `CONFIRMED -> PROCESSING -> PACKED -> SHIPPED -> DELIVERED`. Cancellation is limited to `CONFIRMED`, `PROCESSING`, or `PACKED` within 24 hours.

## Status codes

- `400` validation or malformed identifier
- `401` missing, expired, logged-out, or inactive session
- `402` deterministic payment decline
- `403` role or ownership permission failure
- `404` missing resource
- `409` duplicate, stock conflict, invalid workflow, or cancellation rule
- `500` controlled internal error with a request ID
