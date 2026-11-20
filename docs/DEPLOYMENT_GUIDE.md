# SafeRide deployment guide — Prompt 24

**Status:** preparation only. No external service was deployed. The [release checklist](PRODUCTION_READINESS_CHECKLIST.md) remains **NOT VERIFIED** because [Prompt 23](E2E_RELEASE_REPORT.md) did not finish the full UI and tracking acceptance.

## Topologies and terms

### Free Vercel and Render trial

1. Import the repository root into Vercel and select Node 24.x. Copy the stable production HTTPS origin from the project's Domains settings.
2. Create a MongoDB Atlas database and database user for this deployment. Include the database name in the connection URI. In Render select **New → Blueprint**, select the repository and apply the root [render.yaml](../render.yaml). Enter `MONGODB_URI` and `WEB_ORIGIN` when prompted. Use the exact Vercel HTTPS origin without a trailing slash. The Blueprint selects Free, builds both API and shared contracts, ensures MongoDB indexes at startup and uses Render's assigned port. Allow the service's outbound ranges in Atlas Network Access. Retry the deployment if the initial database connection timed out. Find the ranges under **Connect → Outbound**. [Render outbound IPs](https://render.com/docs/outbound-ip-addresses)
3. Copy the actual hostname from the Render service URL. Replace both occurrences of `replace-with-render-host.invalid` in the root [vercel.json](../vercel.json) with that hostname. Commit and redeploy to Vercel. Keep the project root at **.** and use the committed build and output settings. Database credentials belong on Render. The API accepts the Render-provided hostname and the configured frontend origin.
4. For a fresh database, initialize the business and bootstrap its owner once using the instructions below. You can run those commands locally from a trusted workstation with temporary access to the deployment database. Build the shared package first.
5. Visit `/api/ready` on the Vercel domain and confirm HTTP 200 with `ready: true`. Reload `/login`, sign in, refresh a protected page and test tracking with assigned test accounts. In browser Network, requests to `/api/live?EIO=4&transport=polling…` should return Engine.IO packets. An HTML response indicates a rewrite misconfiguration. Confirm logout removes access.

The Vercel build uses Socket.IO long-polling through the session cookie's own domain. Render handles the existing private rooms and pushes accepted GPS observations through that transport. The single-origin build uses WebSocket. During a cold start, wait for readiness before signing in. Render Free also blocks the SMTP ports used by optional email delivery. [Render Free limits](https://render.com/docs/free)

Vercel [Hobby terms](https://vercel.com/docs/plans/hobby) restrict it to personal, non-commercial use. Render says its [free services](https://render.com/docs/free) spin down after inactivity, use an ephemeral filesystem and are not for production applications. Atlas Free backup availability has changed: [an optional private-preview paid backup subscription](https://www.mongodb.com/docs/atlas/backup/cloud-backup/free-cluster-backup/) may appear, while [standard Atlas cloud backup](https://www.mongodb.com/docs/atlas/backup-restore-cluster/) is for higher tiers. Check the chosen account's current feature and terms before provisioning. No price or free-plan availability is assumed here.

**Commercial candidate:** one always-on paid Express web service serving both built React and `/api` at the same HTTPS domain, plus a durable MongoDB Atlas replica set with a working, tested backup/restore arrangement. Build with `npm ci && npm run build`; start `node apps/api/dist/server.js` with `SERVE_WEB_DIST=true`. `apps/api/src/server.ts` serves hashed assets and falls back to `index.html` for browser routes. A paid Vercel frontend plus always-on paid Render API is another candidate after same-origin rewrite testing. Hosting plans, data region, business use rights, support and monitoring must be chosen by the operator; neither topology alone makes school tracking reliable.

## Runtime environment and trust boundary

Use [production.env.example](production.env.example) as a key list. Supply values through the provider's secret manager, never a committed `.env`. `MONGODB_URI` must target a durable replica set; school and payment operations use transactions. `NODE_ENV=production` requires an HTTPS `WEB_ORIGIN` and sets `Secure`, `HttpOnly`, `SameSite=Lax` session cookies. `API_ALLOWED_HOSTS` adds exact Host values that can reach Express; the public `WEB_ORIGIN` host is allowed automatically. The API validates Host, then CORS/browser Origin, then role/session and CSRF for protected writes. Do not trust `X-Forwarded-Host` from arbitrary clients; restrict direct API ingress where the provider permits. If a Render hostname is the upstream Host for a Vercel rewrite, add that hostname to `API_ALLOWED_HOSTS` after inspecting an actual request. Restrict Render's direct endpoint separately at the provider edge if available. Keep `/api` and the browser under one visible HTTPS origin; do not put authentication tokens in browser storage.

`/api/health` is liveness only; `/api/ready` returns 200 only with a MongoDB connection. On shutdown Express stops accepting requests and Mongoose disconnects. Configure the provider's health check to `/api/ready`, restart on process failure, and alert on repeated 503, elevated 5xx, failed backup, or prolonged no GPS updates during a scheduled active duty. A 200 readiness response does not prove transactional writes or actual driver location. Configure a supported Node version matching the repository's build requirement (Node 22+), and verify it in deployment logs.

## First owner and business configuration

1. Create a new database user with least required application permissions; restrict Atlas network access to the API egress range where possible. Record the database name and backup destination privately.
2. Build and connect the app, then run `npm run seed:dev` **once** with verified `BUSINESS_NAME`, `PUBLIC_PHONE`, `PUBLIC_WHATSAPP`, `PUBLIC_AREA` and `PUBLIC_HOURS`. The command updates the primary business settings and creates no demo identities. Do not rerun it later with stale blank values; use owner settings instead.
3. In a private one-time job, set `BOOTSTRAP_OWNER_NAME`, `BOOTSTRAP_OWNER_MOBILE`, `BOOTSTRAP_OWNER_PASSWORD` and `MONGODB_URI`, run `npm run bootstrap:owner`, then immediately remove those environment values and process logs. Bootstrap refuses a second owner for the business. No default account is created.
4. Owner signs in using the one login form, configures actual phone/UPI/bank instructions in owner settings, and verifies public call links and payment text against real business details. Owner must review vehicle registrations, permits, insurance, legal suitability, driver qualifications and expiry before accepting real assignments. Publish correct service terms, privacy information, consent and emergency notice before any real enrollment.

Rotate database credentials in the provider secret manager and Atlas, redeploy, and confirm `/api/ready` before revoking the old database user. Rotate an owner password through the assisted reset flow and revoke sessions; never pass passwords in tickets or source control. The app has no separate JWT signing secret: session tokens are random, hashed server-side, and stored in MongoDB. A database compromise requires database credential rotation, session revocation and incident review. Never run development fixtures or `prompt23-e2e.mjs` against production.

## Indexes, files and data retention

Production disables Mongoose automatic index creation. After a backup and before cutover, run `npm run indexes:ensure -w @saferide/api` against the intended database. It creates declared indexes without dropping existing indexes; unique-index errors require data review, not a blind deletion. Validate the indexes on a staging copy first. Keep migration output and database version with the deployment record.

No proof-file upload store is configured. Expense proof is a reference string; goods delivery is a reasoned checkpoint, not an uploaded image. The API now rejects production vehicle-photo uploads with `UPLOADS_UNAVAILABLE` until durable object storage, private access, lifecycle rules and retrieval authorization are implemented. Existing development vehicle photos are MongoDB binary records; do not rely on an ephemeral Render disk. The owner UI shows the API's explicit rejection if a photo is attempted. Do not enter an external proof URL that exposes a child, receipt or vehicle record publicly.

Current automatic retention: session/action-token TTL at their expiry, urgent request TTL at 30 days, and the latest GPS point with configurable `gpsRetentionDays` (default one day). MongoDB TTL removal is asynchronous. Children, guardian links, addresses, school/booking history, receipts, payment evidence and audit events **do not have automatic deletion**. Before real collection, the operator must approve a written schedule specifying purpose, access, retention period, deletion/anonymization, financial record preservation and backup expiry for each category, then implement it. Existing eligible user and child anonymization endpoints retain financial/audit evidence; test that behavior with the chosen schedule. Backups also contain old personal data until backup retention expires. This is an operational policy proposal, not a claim of legal compliance.

## Backup, restore and domain

Use provider-managed snapshots with a documented recovery point and recovery time target, or a scheduled encrypted `mongodump` archive on a separate secured machine/object store; do not write backups to the API's local disk. Restrict backup access and test `mongorestore` into an isolated database before launch and after major migrations. MongoDB documents [`mongodump`/`mongorestore`](https://www.mongodb.com/docs/database-tools/) and [restore behavior](https://www.mongodb.com/docs/database-tools/mongorestore/). Keep app and database versions compatible. Export customer/business records only through authenticated, scoped reports; CSV exports are sensitive and need secure storage and deletion after use.

The operator must own the domain and registrar account, control DNS/TLS renewal, list authorized administrators, and document transfer/recovery access. Point the canonical HTTPS host to the selected frontend or single-origin service; verify redirects from any alternate host, cookie scope, links and deep-route reloads. Never redirect a production login through an unrelated domain.

## Release gate

The local single-origin built-asset smoke is recorded in [phase24-smoke/results.json](phase24-smoke/results.json). It used `NODE_ENV=test` and HTTP to exercise the same compiled assets, Express API and isolated replica-set database. It **does not verify the production HTTPS cookie or an external Vercel/Render rewrite**. The remaining gates and owners' operational inputs are in [PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md).

## Two-phone GPS staging

Use one long-running Express process for the built frontend, API and Socket.IO rooms. On a staging host you control, point a DNS name at its TLS proxy, allow inbound 443, and obtain a certificate trusted by both phones. For example, with Caddy on the same host, replace the example hostname with your DNS name in this Caddyfile:

```caddyfile
rides-stage.example.org {
    reverse_proxy 127.0.0.1:4000
}
```

Set NODE_ENV=production, SERVE_WEB_DIST=true, PORT=4000, WEB_ORIGIN=https://rides-stage.example.org and MONGODB_URI to a dedicated staging replica set in the service environment. From the repository root run `npm ci`, `npm run build`, `npm run indexes:ensure -w @saferide/api`, then the business initialization and private owner bootstrap above. Start `node apps/api/dist/server.js`. Route /socket.io/ including WebSocket upgrades to this same process and preserve Host and Origin. Verify /api/ready over HTTPS. Leave ORS_API_KEY and REVERSE_GEOCODER_URL empty for manual quotation testing. Basic GPS needs neither.

Create fictitious family, child, vehicle and driver records through the existing workflows, approve the subscription and assign today's school route. On phone A use the HTTPS site, start the assigned run, allow precise location and start sharing while parked. On phone B sign in as the linked parent, open the child and watch the same marker after the vehicle moves. An attendant or parked operator can confirm boarding and drop. Compare the timestamp and radius. Test GPS denial and stop, network loss past the configured freshness interval, screen lock, backgrounding, reconnection, unrelated parent, wrong driver, logout and end of run. Confirm the ended view still shows authorized journey history. Repeat with the owner assigned as driver. Record observed results separately from automated MOCKED GPS.

A locked or suspended browser, OS power management, or loss of connectivity can interrupt observations. If continuous unattended background tracking becomes a requirement, evaluate a native Android foreground location service with explicit consent or dedicated vehicle GPS hardware. Physical two-phone and public HTTPS results are UNVERIFIED until this exercise is run.
