# Operations

## Local start

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Check readiness:

```bash
curl http://localhost:5000/api/health
```

The response reports `status`, MongoDB state, process uptime, and a timestamp. A healthy local response has `status: "ok"` and `database: "connected"`.

## Configuration

Keep `.env` outside version control. The required values are documented in `.env.example`. For a deployment, use a secret manager for `JWT_SECRET` and credentials, set `NODE_ENV=production`, use `COOKIE_SECURE=true`, provide an HTTPS `CLIENT_ORIGIN`, and use a managed or replica-set MongoDB URI.

## Reset

`npm run seed` deletes and recreates all records in the configured database. It is a development/demo reset only. Do not run it against production data.

## Backup and restore

With MongoDB Database Tools installed:

```bash
mongodump --uri="$MONGODB_URI" --out=./backups/$(date +%Y%m%d-%H%M%S)
mongorestore --uri="$MONGODB_URI" ./backups/<timestamp>
```

Backups should be encrypted, access-controlled, tested by restore drills, and retained according to the deployment's data policy. Payment attempt records and order snapshots are business audit data and must be included.

## Availability measurement

The source target is 99.5% monthly availability excluding planned maintenance and unavoidable third-party outages. Record timestamped health checks in an external monitor or scheduled job:

```text
availability = (scheduled minutes - eligible outage minutes) / scheduled minutes * 100
```

The repository provides the health endpoint and calculation procedure, but it does not claim a month of observed uptime without monitoring evidence.

## Troubleshooting

- MongoDB connection errors: verify the service is running and `MONGODB_URI` matches the port.
- CORS errors: set `CLIENT_ORIGIN` to the exact React origin, including scheme and port.
- Empty catalogue: run `npm run seed` against the intended development database.
- Checkout conflict: refresh the cart; stock is rechecked on every attempt.
- Static production page missing: run `npm run build` before `npm start`.
