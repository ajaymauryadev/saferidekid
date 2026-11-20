# SafeRide operations runbook

## Start and health

Build from the repository root: `npm ci && npm run build`. For a single-origin deployment, set `SERVE_WEB_DIST=true` and start `node apps/api/dist/server.js`. For a split trial frontend, deploy `apps/web/dist` to Vercel, set `SERVE_WEB_DIST=false` on Express, and configure the same-origin `/api` rewrite. Set `NODE_ENV=production`, HTTPS `WEB_ORIGIN`, exact `API_ALLOWED_HOSTS`, persistent replica-set `MONGODB_URI` and the provider's assigned `PORT`. Check `/api/health` and `/api/ready`; only readiness is a deploy health gate. Check nested React routes on reload, an unauthenticated protected API 401, configured Host 200 and unexpected Host 421.

## Daily checks and incident handling

- Check API readiness, 5xx rate, login failures, backup success/age and frontend/API availability. Review owner urgent callback queue manually; no guaranteed dispatch or automated SMS exists.
- Check active school duties against driver-confirmed milestones. If GPS is stale, unavailable, permission denied or the driver is offline, instruct the operator to call the driver. Never treat a missing point as arrival or a payment claim as received money.
- For a 503 readiness response, pause new operational actions, inspect Atlas connectivity and provider logs, restore connectivity, then reconcile outstanding booking/payment writes before retrying. Replayed sensitive writes must retain idempotency keys.
- For a suspected wrong child/location disclosure, revoke affected sessions, restrict access, preserve append-only audit evidence and follow the operator's incident process. Do not paste child or payment data into provider tickets.
- For payment discrepancy, compare customer claim, bank/cash evidence, owner verification event and receipt number. Correct through audited adjustment, not direct database mutation.

## Backups and restoration

Before every index or schema change, verify a current backup. Schedule encrypted backups outside the API host and periodically restore into an isolated database. Record backup timestamp, database/FCV version, archive checksum, restore duration and counts for users, subscriptions, bookings, payments and audit records. Never test restore over the live database. A recovery should: stop writes, select the backup, restore to a new cluster/database, run `npm run indexes:ensure -w @saferide/api`, validate sample financial and school records, then switch `MONGODB_URI` in a controlled deployment. Reconcile operations after the backup time before reopening writes. Revoke old credentials after a successful switch. No restore drill has yet been performed for an external provider.

## Deploy and rollback

Record build version, migration/index command, backup identifier and operator approval. Deploy built frontend and API from the same version. Verify readiness, signup/login/logout, a protected role check, school/booking/payment state and public urgent phone/warning. If a regression occurs, switch back to the prior known-good app build, keep the database forward-compatible or restore to a **new** database after evaluating writes made since backup. Do not silently discard bookings, child events or payment verifications. Render's [deploy behavior](https://render.com/docs/deploys) and process restarts must be reviewed for the selected plan.

## Secrets and retention

Keep database URI and one-time owner bootstrap values in the provider secret manager. Rotate database credentials by adding a new least-privilege user, deploying with it, confirming readiness, then removing the old user. Use audited owner-assisted reset for account passwords. Review GPS TTL, urgent TTL, inactive users, children and payment/receipt retention against the approved schedule every month. Do not enable vehicle-photo or proof uploads until durable private object storage is implemented and tested.
