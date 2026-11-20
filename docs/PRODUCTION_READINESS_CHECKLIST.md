# SafeRide production readiness — Prompt 24

**Decision: NOT VERIFIED (12 November 2026).** This is a release gate, not permission to operate real child transport, payments or live tracking. No cloud account, paid service or domain was changed. The earlier [Prompt 23 report](E2E_RELEASE_REPORT.md) remains a release block.

| Gate | Result | Evidence or required action |
|---|---|---|
| Compiled React/Express/shared contracts | **PASS locally** | `npm run build`, `npm run typecheck`; built React served from Express in [single-origin smoke](phase24-smoke/results.json). |
| Live database transactions | **PASS locally** | Isolated `mongodb-memory-server` replica set exercised school, booking, payment and run writes. Atlas connection and failover remain untested. |
| Session/CSRF/Host controls | **PARTIAL** | Unit tests cover Secure/HttpOnly/SameSite cookie attributes, Host 421, Origin and CSRF rejection. Production TLS and Vercel rewrite `Set-Cookie` were not tested on an actual provider. |
| Production build routing and readiness | **PASS locally** | Single-origin built asset smoke loaded nested routes, `/api/ready`, separate roles; no page errors/overflow in sampled views. No provider restart/health-probe test. |
| First owner and secret handling | **PARTIAL** | Bootstrap is one-time and there are no default credentials. Operator must supply private owner identity, remove bootstrap variables and perform rotation drill. |
| Index migration | **PARTIAL** | Additive `indexes:ensure` command passed against a clean replica set (32 models; session/GPS TTL indexes). Requires backup and staging/live execution. Production auto-index is disabled. |
| Backups and restore | **FAIL / BLOCKED** | No external durable backup, restore drill, recovery objective or retention approval exists. Atlas plan features must be checked for the actual account. |
| Owner phone, UPI, permits, terms, consent | **FAIL / BLOCKED** | Real values, business documents and approved customer notices were not supplied or reviewed. Trial smoke intentionally used fictitious data. |
| Proof and photo storage | **PARTIAL** | Production photo upload rejected until private object storage exists; no proof-file upload implementation is claimed. Expense proof is a reference, goods proof a recorded checkpoint. |
| Logging and alerts | **PARTIAL** | Pino redacts cookie/auth/password fields and server audit records are append-only. Provider log retention, external alerting and incident ownership are not configured. |
| Privacy retention | **FAIL / BLOCKED** | GPS/urgent/session TTL exists; child/address/receipt/backup retention schedule and deletion automation are not approved or implemented. |
| Full cross-role UI and visual E2E | **FAIL / BLOCKED** | Prompt 23 API lifecycle passed; all mandatory UI click paths and page-width comparisons remain incomplete. |
| Tracking reliability | **FAIL / BLOCKED** | Foreground test point and stale fallback passed locally. Real phone permissions, background suspension, coverage, alerting and continuous delivery remain unverified. No guaranteed tracking claim is permitted. |
| Hosting eligibility and uptime | **FAIL / BLOCKED** | No commercially suitable always-on plan selected. Vercel Hobby is non-commercial and Render Free spins down; trial topology cannot meet live duty expectations. |

## Local production-like smoke

Command: `npm run build`, then `SAFERIDE_SINGLE_ORIGIN=1 node scripts/prompt23-e2e.mjs` (PowerShell: `$env:SAFERIDE_SINGLE_ORIGIN='1'; node scripts/prompt23-e2e.mjs`). The script started compiled Express with `SERVE_WEB_DIST=true`, served built React from the same origin, used an ephemeral replica set, created only fictitious identities, and exercised signup, school activation, student/parent leave, driver milestones, fresh/stale/disabled GPS, booking/payment verification, trip completion, goods checkpoints, public urgent, audit/security and sampled viewports. [Results and screenshots](phase24-smoke/results.json) show no runtime/page errors. It ran with `NODE_ENV=test` and HTTP; the production HTTPS cookie and provider networking need separate verification. The urgent page in the local smoke had the medical warning; the operator phone was intentionally unconfigured and displayed as unavailable. A real configured call link is still unverified.

Final local gates: `npm run build` **PASS**, `npm run typecheck` **PASS**, `npm run lint` **PASS**, `node scripts/verify-prompt24-indexes.mjs` **PASS**, and serial Vitest (`npx vitest run --maxWorkers=1 --testTimeout=30000 --hookTimeout=60000 --reporter=dot`) **20 files / 91 tests PASS**. A first default-parallel Vitest attempt hit Mongo memory-server startup timeouts in eight suites under host resource contention; the one-worker rerun passed in full. Logs: [parallel](phase24-smoke/vitest.log), [serial](phase24-smoke/vitest-serial.log).

## Minimum before any real business launch

1. Resolve every **FAIL / BLOCKED** gate above, including Prompt 23 UI coverage.
2. Use an always-on commercially permitted API host with HTTPS, stable domain, health checks and timely restart; use a durable replica-set MongoDB with tested, separately held backup and restore. Set an operational recovery objective and alert owner.
3. Configure verified operator phone, UPI/bank instructions and legally suitable fleet/driver documents; publish reviewed terms, privacy, consent and medical-service disclaimer.
4. Test the actual deployed origin, cookie, logout/revocation, `/api` rewrite (if split), nested route reload, role/IDOR/CSRF, school/booking/payment lifecycle, backup restore and foreground GPS permission/denial/staleness on representative phones. Treat tracking as best effort even after these checks unless a separate reliable tracking system is established.
5. Have the business owner explicitly approve the production configuration and release decision after reviewing evidence. No approval has been requested or given in this phase.

Provider facts used in this decision: [Vercel Hobby use terms](https://vercel.com/docs/plans/hobby), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [Render Free behavior](https://render.com/docs/free), [Atlas Free backup preview](https://www.mongodb.com/docs/atlas/backup/cloud-backup/free-cluster-backup/), [Atlas backup/restore](https://www.mongodb.com/docs/atlas/backup-restore-cluster/).
