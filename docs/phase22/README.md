# Phase 22: low-cost efficiency and resilience

## Measured locally (12 November 2026)

- `npx vitest run --maxWorkers=1 --fileParallelism=false`: 20 files, 89 tests passed after the fee paging change. The parallel run hit a local Windows `ENOBUFS` socket limit; the serial run passed. API tests cover 401, failed operations, idempotent payment and run events, duplicate fee reminders, paging, and escaped search.
- `node scripts/measure-prompt22.mjs`: isolated MongoDB memory server, 1,000 rows per collection (10 times a 100-row fixture). `explain('executionStats')` selected these indexes: booking queue `businessId_1_status_1_createdAt_-1` (20 keys and documents for 20 rows); payment target `businessId_1_customerId_1_status_1_allocations.targetId_1_allocations.month_1` (20/20); unread notifications `businessId_1_recipientId_1_readAt_1` (500/500); driver day `businessId_1_date_1_driverId_1_startedAt_1` (20/20); vehicle conflicts `businessId_1_active_1_vehicleId_1_startAt_1_endAt_1` (11 keys, 10 documents); guardian links `businessId_1_customerId_1_status_1` (500/500). These are small in-memory measurements, not hosted latency guarantees.
- Production Vite build: initial JS 568.10 kB / 175.32 kB gzip; authenticated workspace JS 220.95 kB / 53.34 kB gzip; Leaflet JS 149.90 kB / 43.48 kB gzip, loaded only when the map is used. Initial CSS 35.69 kB / 8.28 kB gzip; workspace CSS 59.54 kB / 15.00 kB gzip. The initial chunk still exceeds Vite's 500 kB warning threshold.
- `node scripts/check-phase22-ui.mjs`: Chromium at 390 px and 1440 px, each API response delayed 400 ms then returned 503. The urgent page displayed its usable fallback after three GET attempts; no horizontal overflow. The offline state appeared after disconnecting the browser context.

## Operating policy

- One in-memory RTK Query API is the server-state cache. It refetches on focus/reconnect and discards unused data after 30 seconds. Logout and confirmed 401 clear user-scoped cache. Only GET requests receive two brief retries on connection/502/503/504 errors. A lost mutation response is never retried automatically; the server's idempotency keys and state checks protect explicit retries.
- Active run and tracking views poll while focused; other views refetch on focus, reconnect, tag invalidation, or user refresh. A separate role in another browser sees updates when that view regains focus; there is no push service or guaranteed immediate cross-device update.
- Fee reminders use the protected `POST /api/jobs/fees/run` with `x-job-token: FEE_JOB_TOKEN`. Schedule an external HTTP call daily. Customer fee access catches up only that customer's reminders. Unique reminder keys prevent duplicates. Delivery can be delayed when the job is not called or hosting is asleep; the UI discloses this.
- Database pool maximum is 10, minimum 0, with idle connections closed after 30 seconds. Indexes are intentionally scoped to the observed read patterns. Sensitive client cache remains memory-only.

## Remaining scale limits

- The owner fee register pages 20 students before computing statements. Some finance/dashboard KPIs still inspect all business rows. Their exact balance arithmetic includes partial allocations and refunds, so replacing them requires a verified aggregate or maintained balance model. Do not call those routes unbounded-scale ready.
- Text searches with escaped case-insensitive regex can scan within a business. Inputs are length-limited and escaped, but a search index or normalized prefix fields would be needed for larger datasets.
- React Profiler was not measured in an authenticated browser in this pass. The build report and database explain output are the available local performance evidence; production budgets should be set from hosted p95 observations.
