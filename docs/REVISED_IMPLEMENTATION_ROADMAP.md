# SafeRide Kids — revised implementation roadmap

**16 November 2026.** Preserve the existing root, source and database records. Each implementation phase starts by rereading the final prompt pack, final HTML simulation, Premium UI/UX Blueprint, this updated requirements file and `AGENTS.md`; the updated requirements take precedence. Complete, test and stop after **one** phase. Use isolated memory MongoDB and test identities; no production reset. Earlier 00–24 reports are reusable evidence, not automatic acceptance.

## Dependency order and priorities

| Order | Phase | Priority | Reason |
|---|---|---|---|
| 1 | Customer-proposed school price and service agreement | P0 | The present owner-first rule is incompatible with the final business contract. Fees/activation depend on the agreement. |
| 2 | Secure Trip Mode and student own-journey access | P0 | School safety is the top objective; owner-as-driver GPS is currently blocked and student home is a placeholder. |
| 3 | Restore booking/urgent/vehicle routes and complete booking fare core | P0 | Required business service is presently unreachable despite retained API; road fare needs backend source. |
| 4 | Financial/reminder correctness and cross-role operations | P1 | Bind charges to new agreement, configured reminders, current booking reconciliation and notification truth. |
| 5 | Premium public website and rural-first localization | P1 | Build after booking/urgent destinations work so public CTAs are real. |
| 6 | Full UI/mobile/device acceptance and production gate | P1/release | Current historical screenshots and HTTP scripts do not prove current complete flows or real GPS device behavior. |
| 7 | Extended reports and visual polish | P2 | Only after operational correctness and release gates. |

## Phase 1 — customer-proposed school fee and service choice (**recommended next prompt**)

- **Goal:** parent proposes ₹1,500 (150000 paise) for morning, afternoon or both; owner can approve/reject/counter (e.g. 180000 paise); parent accepts/declines counter; final owner authorization and dated child agreement precede activation. Owner-assisted enrollment records whose proposal it represents.
- **Reuse:** existing `SchoolSubscription`, history/quote version, guardian link, vehicle seat reservation, route activation, `FeeAgreement`, audit/notice mechanisms and school pages. Do not delete old subscriptions or rewrite paid months.
- **Likely files:** `packages/shared/src/index.ts`, `apps/api/src/customer-models.ts`, `school.ts`, `fee-models.ts`, `fees.ts`, `apps/web/src/school-pages.tsx`, `store.ts`, school/fee API tests, migration script/docs if required.
- **API/DB:** add proposed amount, service choice, proposal/counter versions and explicit decision state/history; validate paise and expiry; owner approve direct proposal or counter/reject; customer decline; compare versions under transaction; convert accepted price to per-child fee agreement only at authorized activation. Existing owner-first records remain readable with a documented legacy interpretation.
- **UI acceptance:** mobile request has rupee keypad and concise service choice; shows proposal versus counter and final agreed amount without ambiguous “owner quote” wording; owner actions are distinct and confirmable; loading/error/conflict states show real server responses.
- **Tests/done:** transaction and IDOR tests for ₹1,500→approve and ₹1,500→₹1,800→accept/decline, stale quote, duplicate submit, capacity, old-record migration, prior charge immutability, 320–1440px Chromium click-through with persisted Mongo assertions. Stop and report evidence before Phase 2.

## Phase 2 — safe school Trip Mode and student portal

- **Goal:** one minimal school run screen for owner or assigned driver, with consent-based GPS and explicit child events; student sees only own ride/leave/notices/simple fee reminder/contact.
- **Reuse:** `runs.ts`, `tracking.ts`, `leaves.ts`, `driver-pages.tsx`, `run-pages.tsx`, `customer-pages.tsx`, `notification-pages.tsx`, `auth.ts` ability grants, existing student fee endpoint.
- **Likely files:** `apps/api/src/tracking.ts`, `runs.ts`, `auth.ts`/`owner-auth.ts`, `students.ts`, `customer.ts`, `apps/web/src/workspace.tsx`, `driver-pages.tsx`, `run-pages.tsx`, `student-pages.tsx`, `store.ts`, targeted CSS/tests.
- **API/DB:** allow authenticated OWNER only with active `DRIVER_DUTY` and exact assignment to consent/upload; retain separate DRIVER revocation. Add guardian-approved student provisioning and own-child read endpoint if missing. Verify trip completion revokes location. No public token or location access.
- **UI acceptance:** one active-trip control surface, large boarded/drop controls, absent list, GPS fresh/stale/denied timestamp, direct contact; student home is a real own-journey screen without unrelated records. Owner and driver flows both work on phones.
- **Tests/done:** negative role/business/child/trip access, ordered events and correction, device GPS permission/lock/offline observation, owner-as-driver and invited-driver live browser run; no fake live marker.

## Phase 3 — booking and urgent restoration with truthful pricing

- **Goal:** same customer can book general rides; public `/vehicles` and `/urgent` work; owner queue/dispatch and driver private trip become reachable; backend road-route estimate or exact unavailable fallback.
- **Reuse:** retained `booking-pages.tsx`, `urgent-pages.tsx`, `driver-pages.tsx`, booking/urgent/availability APIs, `ScheduleBlock`, rate settings, existing payment gate and tests.
- **Likely files:** `apps/web/src/routes.tsx`, `workspace.tsx`, `components.tsx`, `public-pages.tsx`, `booking-pages.tsx`, `urgent-pages.tsx`, `apps/api/src/bookings.ts`, `availability.ts`, public/urgent routers, `packages/shared/src/index.ts`, booking tests.
- **API/DB:** introduce licensed/configurable road routing adapter; server-side fare rule version and breakdown in paise, minimum/package/round-trip/extras; null estimate when unavailable; owner quote remains final. Preserve typed village/landmark fallback. Recheck schedule conflict transaction for school and private ride, legal goods eligibility, urgent short callback/rate limit.
- **UI acceptance:** destination-first entry, truthful estimate/fallback, working protected booking and owner queue, call-first urgent without login, real configured tel action, private Trip Mode only for assigned driver.
- **Tests/done:** full browser + DB quote/advance/dispatch, unavailable/provider-failure/pricing examples, distinct overlap conflict, pending claim versus verified advance, urgent phone/callback, all restored routes at 320–1440px.

## Phase 4 — school money, reminders and owner operations

- **Goal:** monthly agreement/charges, full/partial/advance/previous due, revisions, owner-verified receipts, booking balances/refunds and configured parent/student reminders reconcile with new business rules.
- **Reuse:** `fees.ts`, `payments.ts`, `finance.ts`, owner overview, notices and existing ledger/version models.
- **Likely files:** `apps/api/src/fees.ts`, `payments.ts`, `notifications.ts`, `finance.ts`, `owner-overview.ts`, `models.ts`, `apps/web/src/fee-pages.tsx`, `payment-pages.tsx`, `finance-pages.tsx`, `owner-overview-pages.tsx`, `workspace.tsx`, tests.
- **API/DB:** honor configured reminder offsets, occurrence-level idempotency and settlement suppression; preserve historic charges on fee changes; expose delivery state honestly. Reconcile refund/reversal with outstanding and dashboard numbers; index/paginate current owner queues.
- **UI acceptance:** due and verified figures distinguish pending claims, parent/student wording is appropriate, owner can see booking and school collections together and reach expense/advance views, errors/empty states explain what to do.
- **Tests/done:** generated months across revision, leave fixed fee, partial/advance/credit, duplicate job and settled reminder, refund/cancellation, live owner totals and receipt snapshot.

## Phase 5 — public premium redesign and Hindi-first experience

- **Goal:** implement [public redesign specification](PUBLIC_WEBSITE_REDESIGN_PLAN.md) with real navigation and no invented business proof; give Hindi-first/English choice and rural-friendly forms.
- **Reuse:** existing visual tokens, menu accessibility, public API/content, school tracking language, van illustration as temporary labeled placeholder.
- **Likely files:** `apps/web/src/public-pages.tsx`, `components.tsx`, `styles.css`, `design-system.css`, `routes.tsx`, locale files, booking entry components, public tests. API public/vehicle contracts only where necessary.
- **API/DB:** expose only verified vehicle/business details and safe booking-estimate interface; no public GPS/student data.
- **UI acceptance:** required section order, real Eeco photos if supplied, Book/School/Call above fold, quick booking, six service cards, vehicle, trust, contact, bilingual navigation/forms/errors, reduced motion, keyboard and screen-reader support.
- **Tests/done:** CTA click-through to backend, enquiry persistence, responsive visual QA at all seven widths, Hindi text wrapping, 320px Android keyboard, slow/offline and configured/unconfigured assets/contact states.

## Phase 6 — full acceptance and release gate

- **Goal:** rerun all 22 requested scenarios in the **current** UI and isolated DB; observe actual phone location behavior; decide release readiness honestly.
- **Reuse:** `prompt23-e2e.mjs`, phase21 visual scripts, Vitest, readiness/index checks and prior reports as test design.
- **Likely files:** test scripts and `docs/` evidence/release checklist; minimal defect fixes in affected source only.
- **API/DB:** audit every protected endpoint changed in phases 1–5, CSRF/IDOR/idempotency, Mongo indexes and replica transactions, retention/backup/restore. Never run against production.
- **UI acceptance:** zero dead CTA, correct mobile/desktop states, no clipping, real status and timestamp truth. Capture source and exact screenshot dates.
- **Tests/done:** build/typecheck/lint, API suite, full browser and DB assertions, real device GPS/offline/lock tests, configured real operator contacts/vehicle/legal details, recovery and deployment smoke. If any external gate is absent, report not verified.

## Phase 7 — enhancements

- **Goal:** extended reports, refined finance exports, optional services and restrained animations after core gates pass.
- **Reuse/files:** existing report/finance APIs and UI; change only measured bottlenecks and requested optional services.
- **API/DB:** optional indexed report queries, retention-safe exports; no new state cache or mandatory paid infrastructure.
- **UI/tests:** verify filter totals against underlying ledger, low-end performance and reduced motion; keep school operations clear.

## Explicit hold points

Actual Eeco photographs, phone/WhatsApp/UPI details, vehicle legal eligibility, approved Hindi copy, commercial routing-provider terms, device GPS reliability and production backup/restore depend on verified operator inputs. The implementation can use honest absent states until those inputs exist. No live launch should be claimed from development fixtures.
