# SafeRide Kids — current software audit

**Audit date:** 16 November 2026. **Decision:** substantial school transport implementation, but the current product does **not** meet the updated combined school and local-booking requirements and is not verified for live operations. This is an audit, not an implementation phase.

## Evidence standard and limits

- Direct inspection: root prompt pack, HTML simulation, Premium UI/UX Blueprint, `AGENTS.md`, README, phase and release reports, React routes/pages/store, Express routers, shared Zod contracts, Mongoose models, and test files.
- Fresh checks: `npm run build` passed (Vite initial JS 551.86 kB, gzip 170.87 kB, large-chunk warning); `npm run typecheck` and `npm run lint` passed; `npx vitest run --no-file-parallelism --maxWorkers=1 --reporter=dot` passed **20 files, 93 tests** using isolated memory MongoDB where applicable.
- Fresh browser check: local Vite on `127.0.0.1:5173`, system Chrome. Home, Services and Login were captured at **320, 360, 390, 768, 1024, 1366 and 1440px** in [audit-current](audit-current/); no document-level horizontal overflow at those widths. `/vehicles` and `/urgent` resolved to `/services` at 390 and 1440px. No API/database was connected for these captures. This proves present routing and public layout only.
- Historical evidence: [15 November verification](FULL_SOFTWARE_VERIFICATION_2026-11-15.md), [cross-role report](E2E_RELEASE_REPORT.md), [parity matrix](UI_PARITY_MATRIX.md). These used an isolated memory MongoDB and a prior UI. The current school-only route gate supersedes their claims that private-booking and urgent **browser** flows are reachable.
- `git status --short` failed: the supplied directory is not a Git repository. There is no `.git` metadata here, so uncommitted state/history cannot be determined. No source or data was changed in this audit.

## Architecture and progress

The root npm workspace contains `apps/web` (React/TypeScript/Vite, React Router, Tailwind themed CSS, React Hook Form), `apps/api` (Express/TypeScript/Mongoose), and `packages/shared` (Zod contracts). [store.ts](../apps/web/src/store.ts) uses one RTK Query `createApi` with injected endpoints, CSRF headers, read-only retry and cache invalidation. [app.ts](../apps/api/src/app.ts) mounts public, auth, school, fleet, run, leave, tracking, booking, urgent, payment, fee, communication, overview and finance routers. Mongo models cover business, user/session, vehicle/driver, route/schedule, subscription/child/guardian, run/events, leave, booking, payment, fee and audit records. No forbidden second cache, SQL, Redis or Docker dependency was found in `package.json`.

### Implemented with meaningful evidence

| Area | Evidence and actual limit |
|---|---|
| Unified customer/parent account; single sign-in; owner/driver/student roles | `auth.ts`, `auth-models.ts`, `auth.test.ts`; cookie session, origin/CSRF, role guards, logout/revocation. Student role exists, but student home is currently a placeholder. |
| School request → owner quote → customer acceptance → owner approval → child/route activation | `school.ts`, `school.test.ts`, `customer-models.ts`; prior live memory-DB lifecycle and selected Chromium clicks in 15 November report. **Owner sets the first fee**: the new customer-proposal rule is missing. |
| Guardian-child access and fleet/route capacity | `students.ts`, `fleet.ts`, `availability.ts` and tests; business and relationship queries, seat reservation and conflict checks. Real operator vehicle eligibility and photographs remain unverified. |
| Morning/return events, leave, consent-based GPS | `runs.ts`, `leaves.ts`, `tracking.ts` and tests; event idempotency, append-style corrections, guardian confirmation, GPS freshness and trip scoping. Prior test points were simulated HTTP observations, not a real driver's device. |
| Monthly charges and manual payment verification | `fees.ts`, `payments.ts`, `fee-models.ts`, `customer-models.ts` and tests; paise amounts, pending claims, owner verification, charge versions, partial allocations. Reminder policy and real delivery need audit. |
| Private booking, quotes, conflicts, urgent callbacks, driver trip progress | Server routers/models/tests and old browser report. **Current web route gate hides these workflows**, so they are not working as a complete product now. No road routing provider is configured; booking request sets `distanceSource: UNAVAILABLE` and null estimate. |
| Public enquiry and business settings | `public.ts`, `public-pages.tsx`, public tests; real enquiry persistence when configured. Fresh browser showed the school-focused site; business API unavailable during capture. |
| Owner overview, finance and notifications | API, page and test files exist. Current sidebar exposes school/fees/reports, but booking/urgent/advance/expense/customer operations are gated or omitted. Historical database-backed totals passed selected tests; current full UI is unverified. |

## Confirmed defects and missing behavior

1. **P0 — customer fee proposal absent.** [shared contract](../packages/shared/src/index.ts:73), [subscription model](../apps/api/src/customer-models.ts), [school router](../apps/api/src/school.ts), and [school form](../apps/web/src/school-pages.tsx) have no initial proposed monthly paise amount or morning/return service choice. The owner sends the first quote; there is no explicit approve-proposal versus counteroffer lifecycle, decline action, or proposal-version acceptance evidence. Existing quote and approval records should be reused and migrated safely.
2. **P0 — current UI removes required booking/urgent paths.** [routes.tsx](../apps/web/src/routes.tsx) redirects `/vehicles` and `/urgent` to `/services`. [workspace.tsx](../apps/web/src/workspace.tsx:50) allows only school-oriented pages; `/app/book`, `/app/bookings`, owner booking queues/finance extensions and driver private trip pages are excluded or fall into “coming soon.” [README](../README.md) explicitly documents this narrowing. The API remains, so prior reports are backend/old-UI evidence only.
3. **P0 — student journey home is a placeholder.** `/student/home` is allowed by the gate but has no rendered component in [workspace.tsx](../apps/web/src/workspace.tsx:61); the fallback says “coming soon.” Student leave and notices are routed. Provisioning and authorized own-journey view require a focused live test.
4. **P0 — owner-as-driver GPS mismatch.** `workspace.tsx` exposes owner duty/run routes after `DRIVER_DUTY`, but [tracking.ts](../apps/api/src/tracking.ts:33) requires role `DRIVER` for `/sharing` and `/point`. Thus an owner using their own authenticated account cannot share GPS through the same Trip Mode. Confirm whether run-event authorization has the same mismatch before implementation.
5. **P0 — no automatic fare.** [bookings.ts](../apps/api/src/bookings.ts:28) always persists null estimate/distance and `UNAVAILABLE`. This is honest but does not meet configured road-kilometre pricing, destination-first estimate and backend fare calculation. A provider adapter and truthful fallback are needed.
6. **P1 — public identity and journeys.** The fresh homepage and `/services` show only school transport; no Book a Ride CTA, quick booking, full service set, vehicle listing, or `/urgent` action. Header/footer say “SafeRide,” not “SafeRide Kids.” The bundled van image is an illustration, not an owner-provided Eeco photograph. Actual photo and verified vehicle details are missing.
7. **P1 — reminder configuration mismatch.** `Business.schoolReminderDays` defaults to `[0,3,7]`, but [fees.ts](../apps/api/src/fees.ts:27) sends one reminder whenever due is within five days and deduplicates once per child/month/recipient. It does not implement configurable before-due dates or renewed balance-sensitive messages; in-app notification is present, external delivery is not evidenced.
8. **P1 — rural language gap.** Business has `language: en|hi`; inspected public pages, school forms and navigation are English strings. There is no demonstrated Hindi-first UI or readable Hindi typography. Landmark text input exists in booking source, but booking is inaccessible in current UI.
9. **P1 — policy copy conflict.** [terms/privacy pages](../apps/web/src/public-pages.tsx) say the operator provides the monthly fee quote, inconsistent with the new parent proposal rule. Public content should be changed only after workflow rules are implemented.
10. **P2 — performance and report breadth.** Vite warns about 551.86 kB initial JS despite lazy workspace/map assets. Existing report and retention/backup evidence does not prove production restore, real-device GPS, or full live-data UI at all seven widths.

## Security and operational review

Server routes generally use authenticated cookies, role checks, `businessId`, record relationship, Zod validation and CSRF. Tests cover selected IDOR, duplicate and conflicting actions. This is a **sampled** review, not proof that every future protected read/write meets the invariant. Keep the trip/child relationship tests and negative checks for every changed endpoint. `AuditEvent` blocks common update/delete operations, but application-level historical integrity and migration safety still need tests. GPS TTL and freshness exist; browser background updates remain best effort. Payment claims remain pending until owner verification in the inspected code. `FEE_JOB_TOKEN` guards the fee job, but scheduler deployment/delivery is unverified. Confirm indexes and transaction behavior in the eventual deployment Mongo replica set.

## Requested scenario verdict

| Scenarios from request | Current classification |
|---|---|
| 1 signup/login; 5 child/guardian; 6 route/vehicle/driver; 7–9 run/pickup/parent status; 11–13 leave; 14 partial payment; 19 schedule conflict; 22 owner metrics | Implemented and previously tested in selected memory-DB/API or Chromium paths; **not freshly repeated end-to-end on this current narrowed UI**. |
| 2 customer proposes ₹1,500; 3 owner approves/counters that proposal; 4 customer accepts revised offer | **Missing as specified.** Existing owner-first quote and acceptance is a different rule. |
| 10 GPS fresh/stale/unavailable | API and fixture evidence; **real device not testable** here. Owner-as-driver upload conflict found in source. |
| 15 configurable parent/student fee reminder | **Partial**: in-app once-per-month recipient notice exists; configured schedule and delivery not established. |
| 16–18 same customer books, fare or fallback, owner confirms | API/old-UI evidence, **defective current UI access**; fallback exists, automatic fare missing. |
| 20 urgent reaches owner; 21 call actions | Urgent API/old-UI evidence, **defective current UI access**; no real operator number configured during fresh browser pass, so actual `tel:` call could not be verified. |

Do not treat the old 126 fixture screenshots or 15 November script as proof of the current protected pages. No production database, actual vehicle documents, driver phone, payment account, GPS device, SMS or deployment was accessed.
