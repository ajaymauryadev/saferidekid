# SafeRide Kids — Updated Codex Build Prompts (After 16 Nov 2026 Audit)

**Purpose:** Restore and finish the EXISTING React/Express/MongoDB application in small, tested phases. Do not create a new project or overwrite working code.

**Evidence read:** `CURRENT_SOFTWARE_AUDIT.md`, `FINAL_UPDATED_REQUIREMENTS.md`, `FUNCTIONAL_GAP_MATRIX.md`, `REVISED_IMPLEMENTATION_ROADMAP.md`, `PUBLIC_WEBSITE_REDESIGN_PLAN.md`, `UI_UX_AUDIT.md` (16 Nov 2026). Audit reported 20 test files / 93 passing tests, successful build/typecheck/lint, but public-only fresh browser checks with no API attached. Historical tests are not proof that current private screens work. The project is **NOT verified for live operations**.

**How to use:** Paste the **MASTER KICKOFF** once, then paste **exactly one phase prompt per Codex turn**. Require its test report. Continue to the next phase only after reviewing the result and correcting blockers. File names and line numbers are initial audit hints: re-check the actual repository.

---

## MASTER KICKOFF — Paste once before Phase 01

```text
You are in my EXISTING SafeRide Kids MERN project repository. This is a continuation/fix of the actual project, NOT a new app or a static simulation.

Read, in this order when present:
1) AGENTS.md and the actual repository tree (including root npm workspaces and README).
2) docs/FINAL_UPDATED_REQUIREMENTS.md, docs/CURRENT_SOFTWARE_AUDIT.md,
   docs/FUNCTIONAL_GAP_MATRIX.md, docs/REVISED_IMPLEMENTATION_ROADMAP.md,
   docs/UI_UX_AUDIT.md and docs/PUBLIC_WEBSITE_REDESIGN_PLAN.md.
   Discover and use their actual locations if they are in the root instead of docs/.
3) The older SafeRide_Final_Simulation_To_Working_MERN_Codex_Prompts.md,
   SafeRide_Complete_Premium_UI_UX_Blueprint.md and
   SafeRide_Complete_Interactive_UI_Simulation.html if available.
4) Actual source files, API routes, DB schemas, tests and current browser-rendered pages.

PRECEDENCE: privacy/security/child safety and truthful money/GPS > FINAL_UPDATED_REQUIREMENTS.md > current tested operational rules > PUBLIC_WEBSITE_REDESIGN_PLAN.md > older blueprint and HTML visual inspiration > older prompt pack. Do not copy HTML demo auth, fake location, fake fares or localStorage business state into production.

BUSINESS: SafeRide Kids = ONE independent Maruti Eeco operator serving villages, small towns and cities, with school child safety/tracking as the core, plus normal/private/tourism/wedding/outstation/urgent (non-ambulance) ride bookings and eligible goods only if a permitted vehicle exists. OWNER may also be DRIVER. Unified CUSTOMER/PARENT account plus restricted STUDENT account; separate driver full dashboard is not needed, but secure minimal Trip Mode is required. Customer proposes the school monthly fee; owner approves/rejects/counters, customer accepts a counter, and only authorized agreement/assignment activates subscription.

STRICT STACK: React + TypeScript + Vite + React Router; Redux Toolkit + one RTK Query server cache; Express + TypeScript; MongoDB/Mongoose; shared Zod validation; Tailwind/theme; Leaflet only with genuine authorized coordinates. No Redis, Docker, SQL/Prisma, TanStack Query, Zustand, extra API caches, compulsory gateway/SMS/paid map provider. Money is integer paise on server. Direct cash/UPI/bank claims require owner verification. Prior charges, receipts, audit and child safety events must not be rewritten.

PRESERVE existing work and data. Check git status, but the audit copy reportedly had no .git metadata: never assume a safe rollback, never git reset/clean or delete source. Prefer minimal changes and selective backup of touched files if necessary. Test ONLY with isolated development data, never production/real children's data. Avoid creating another nested project.

FOR EACH PHASE:
- Reread relevant files, verify the reported defect still exists, and state exact planned files/actions.
- Implement ONE complete vertical slice: UI action -> RTK Query -> authenticated validated Express API -> MongoDB -> refetch -> cross-role display.
- Preserve good existing design, security and working flows; do not add dead buttons or invent demo data as actual results.
- Test positive, negative, wrong-relationship/IDOR, duplicate/idempotent, failed network and at least 360/390px + 1440px visual behavior. Capture honest evidence; for major UI changes inspect 320/360/390/768/1024/1366/1440px.
- Run applicable build, typecheck, lint, Vitest/API and current browser/Playwright E2E with test MongoDB. Do NOT claim a browser pass if only source/unit tests ran. No fake screenshots or green reports.
- Update docs/FEATURE_ACCEPTANCE_MATRIX.md and docs/UI_PARITY_MATRIX.md if present; add concise evidence and remaining issues. Keep the original audit reports as dated history, not retroactively rewritten proof.
- At end report: FILES CHANGED, IMPLEMENTED, API+DB PROOF, BROWSER/UI PROOF, TESTS (actual commands+results), OPEN ISSUES, NEXT PHASE. STOP; do not implement the following phase autonomously.

I will provide a specific Phase prompt next. Follow that prompt only.
```

---

## PHASE 01 — Customer-Proposed School Fee + Owner Approval/Counteroffer [P0]

```text
Continue the EXISTING SafeRide Kids project. Apply MASTER KICKOFF and all FINAL updated requirements. Execute ONLY Phase 01, then STOP.

CONFIRMED AUDIT GAP:
Existing school subscription flow is owner-first quotation. The customer request contract/model/UI omit a customer-proposed monthly fee and morning/afternoon/both choice. The existing owner quote/approve and child enrollment logic must be reused, not removed.

INSPECT FIRST: packages/shared/src/index.ts (audit noted request contract ~line 73), apps/api/src/customer-models.ts, apps/api/src/school.ts, apps/api/src/fee-models.ts, apps/api/src/fees.ts, apps/web/src/school-pages.tsx, apps/web/src/store.ts and related tests. Read existing states and old-record shapes before deciding a migration.

IMPLEMENT END TO END:
1. On /app/school/apply, customer selects Morning Pickup, Afternoon Drop or Both; school, village/landmark/pickup point, preferred start, child slot count, optional note, and PROPOSED MONTHLY FEE (default example ₹1,500, no forced amount in actual form). Use numeric rupee keyboard, inline validation and clear monthly unit. For multiple child slots, make per-child fee agreement unambiguous without forcing full child creation before approval.
2. Store customer-proposed amount in INTEGER PAISE, chosen service, proposer, request timestamp, version and history. No client-chosen role/business/user IDs. Existing owner-assisted requests must record source and customer-consent context; do not impersonate a customer.
3. OWNER on /owner/school/subscriptions sees customer proposal, service, school, pickup point and capacity hints; choose APPROVE proposed fee, SEND COUNTEROFFER with amount/optional reason/expiry, or REJECT with reason. Owner direct approval is enough price agreement because customer proposed the same amount, but normal enrollment/assignment checks still apply.
4. If counteroffer (example ₹1,800), CUSTOMER can explicitly ACCEPT or DECLINE the exact currently valid version; stale or expired offers cannot be accepted. Owner's required final authorization follows the project's secure workflow, without auto-activating students or bypassing seat/route/driver assignment.
5. Show a clear status history: requested -> approved pending enrollment OR counter offered -> accepted/declined -> owner authorized -> enrolled/assigned -> active; rejection/cancellation branches. Resolve statuses consistently with existing models. Send correct scoped notifications and audit events.
6. Version accepted monthly agreement with effective date/due policy. Do not re-price prior fee charges, receipt records or legacy accepted subscriptions. Implement safe read/migration handling of legacy owner-first records without rewriting amounts. Document exact migration/backfill strategy, idempotence and rollback risk.
7. Mobile UI: short progressive form, proposed-vs-counter cards, strong Accept/Decline buttons, owner review drawer/cards, loading/validation/409 conflict/error/empty states. Keep existing premium blue/navy design. Do not add a separate Parent login.

SERVER/SECURITY:
Enforce session + CUSTOMER/OWNER relationship, business boundary, version conflict/atomic transition, legitimate child slots and capacity. Use existing RTK Query injected endpoints, tags and invalidation. Avoid duplicate submissions, empty/zero/negative prices, overflow, invalid service and retroactive changes.

TEST REQUIRED:
A) ₹1,500 customer proposal -> owner approves -> add student only after approval -> vehicle/route/driver assignment -> active -> fee ₹1,500.
B) ₹1,500 -> owner ₹1,800 counter -> customer accepts exact version -> owner final authorization -> activation fee ₹1,800.
C) Same counter declined/rejected/expired, wrong customer IDOR, concurrent/stale version, duplicate API retry, owner-assisted record, multi-child slot rules.
D) Existing approved subscriptions/verified receipts/paid months remain unchanged.
E) Fresh authenticated browser clicks for customer + owner at 320, 360, 390, 768 and 1440px; corresponding Mongo assertions; no UI-only success.

DONE WHEN all new states are genuinely functional across DB/API/UI and tested, OR gaps are explicitly marked. Report evidence, stop; DO NOT begin Phase 02.
```

---

## PHASE 02 — Minimal Secure Trip Mode, Owner-As-Driver, Real GPS [P0]

```text
Continue existing SafeRide Kids after verified Phase 01. Follow MASTER KICKOFF. Execute ONLY Phase 02, then STOP.

AUDIT DEFECT: owner trip/run UI exists but apps/api/src/tracking.ts /sharing and /point require DRIVER role; owner with DRIVER_DUTY cannot send location. Existing driver run/events/tests must be preserved. We want NO extensive driver dashboard, but real authenticated Trip Mode with student boarding/drop and GPS for owner-driver OR separate invited driver.

INSPECT: apps/api/src/tracking.ts, runs.ts, owner-auth/auth.ts, student/guardian guards, vehicle assignments/schedules, apps/web/src/driver-pages.tsx, run-pages.tsx, workspace.tsx, customer tracking page, RTK Query endpoints and GPS tests.

BUILD:
1. A SIMPLE mobile Trip Mode view: assigned run (vehicle/route), morning/return distinction, present/confirmed-leave roster, Start/Stop Sharing, GPS permission/freshness/accuracy, large Boarded / School Reached / Return Boarded / Dropped Home confirmations, delay/help/contact and End Run. Clear safe-stop/no phone while driving guidance. No financial/admin exposure.
2. Owner uses the SAME logged-in OWNER identity with explicitly granted DRIVER_DUTY and exact active assignment, rather than pretending to be a DRIVER. Separate driver uses an invited/revocable authenticated account or secure restricted trip token with proper revocation, narrow rights and expiry. No naked public trip link.
3. Fix backend GPS authorization for assigned OWNER/DRIVER without weakening business/trip/vehicle checks. Validate active run, assignment, consent, coordinate bounds, observedAt, accuracy, frequency and idempotent upload. Trip end revokes location visibility/upload. Never publish other students' locations/contact details.
4. Child event milestones are manually confirmed by authorized person, not inferred from vehicle GPS. Preserve append-only corrections with actor, timestamp and reason; block after-boarding leave contradiction. Parent view displays each child's actual event and assigned vehicle separately.
5. Parent live view shows genuine Leaflet marker ONLY if genuine authorized latest GPS exists. Fresh / stale / unavailable / denied / offline / ended statuses and Last Updated; no simulated movement or fake ETA. Browser can suspend GPS in background; show Call Driver/Owner fallback without misleading guarantee.
6. Driver name, configured contact number, vehicle, route appear clearly on authorized parent tracking page. Missing contact number degrades honestly.
7. Confirm revoked driver has no new updates, reassigned trip permissions are rescoped; avoid high-frequency polling on inactive/offscreen screens.

TEST:
Owner with and without DRIVER_DUTY, assigned/unassigned driver, duplicate boarded, out-of-order events, student absence after boarding, privacy/IDOR, stale and stopped GPS, denied permission, offline/resume, wrong trip and revoked account. Real phone/background/lock behavior must be observed where an authorized test device is available; otherwise mark UNVERIFIED explicitly. Browser/DB end-to-end morning and return for owner-driven and separate-driver cases, 320/390/1440px.

DONE WHEN actual owner-as-driver upload and restricted trip confirmations work, and legitimate parent sees correct status without fabricated location. STOP.
```

---

## PHASE 03 — Real Student Portal + Guardian-Confirmed Absence [P0/P1]

```text
Continue existing SafeRide Kids after Phase 02. Execute ONLY Phase 03. Follow MASTER KICKOFF and inspect current student/leave code first.

AUDIT GAP: /student/home is an empty/coming-soon fallback in apps/web/src/workspace.tsx; student leave/notices routes exist; secure student provisioning/own journey endpoint may be incomplete. Student login is REQUIRED now, restricted and guardian-approved, with only own data.

IMPLEMENT:
1. Secure owner/guardian-approved student account invitation/provisioning after school subscription and child profile approval. One unified /login auto-directs by actual server role. No public student self-signup, no easy guessable password, no access by guessing student ID; guardian age/consent rules respected.
2. /student/home displays only own active school journey (morning/return timeline), assigned vehicle/driver and authorized contact shortcuts, GPS fresh/stale/unavailable via existing scoped tracking, next pickup if configured, today status, notices and a respectful simple fee reminder (no payment control or full parent ledger).
3. /student/leave lets student report today/tomorrow/date with optional reason; request is PENDING GUARDIAN CONFIRMATION. Parent sees Accept/Decline; only confirmed leave affects upcoming driver roster. Cancellation and already-boarded restrictions remain enforced. Owner may record phone-reported leave with source/audit.
4. /student/notices is functional; parent gets child-submitted leave notification; student gets result. Show clear Hindi-friendly states and contact buttons, not complex financial tables.
5. Backend checks relationship for every child, GPS and notice query. Student cannot read sibling/unrelated students unless explicitly permitted child association, edit fee, mark boarded, confirm own leave or change assigned driver.
6. Reuse existing student fee endpoint if present and secure; if missing create a minimal DTO with only status/text needed. Never publish private financial record to student.
7. Retain parent unified customer identity and multi-child selector; student separate role is restricted, not duplicate parent dashboard.

TEST: student invite/activation/revocation, wrong-student IDOR, own journey and no other child's contact, student leave -> guardian confirm -> roster, guardian decline, no auto-fee reduction, after-boarding reject, notification recipient isolation, mobile 320/360/390/1440px with live test DB. No fake success; stop with proof.
```

---

## PHASE 04 — Restore Real Bookings, Vehicles & Public Urgent Flow [P0]

```text
Continue existing SafeRide Kids after Phase 03. Execute ONLY Phase 04; Phase 05 will implement road-distance fare computation, so do not claim a real auto-estimate yet.

AUDIT GAP: apps/web/src/routes.tsx redirects /vehicles and /urgent to /services; apps/web/src/workspace.tsx school-only gate hides /app/book, /app/bookings, owner booking requests and driver private trips, although corresponding backend/models and old frontend code remain. Reuse and secure these rather than starting over.

IMPLEMENT:
1. Restore routed public /vehicles, /urgent (and existing /services and contact) with honest owner-configured vehicles and urgent assistance; remove erroneous redirect. Do not expose student, guardian, GPS or protected driver details publicly.
2. Restore customer /app/book and /app/bookings, booking detail/quote acceptance and payments context, using ONE CUSTOMER/PARENT identity and appropriate authorization. Booking entry starts 'Where are you going?' and supports pickup auto-location consent OR typed village/landmark; destination; then relevant service/time/passengers/stops in progressive steps. Keep valid draft through login when feasible without exposing sensitive data.
3. Restore /owner/bookings/requests, bookings, calendar/dispatch and minimal assigned private-trip controls. Owner can review, quote, approve/reject, assign eligible available vehicle/driver, reschedule/cancel with audit, review manual UPI/Cash/Bank payment claim as pending until verification. Do not accidentally unhide dead pages or make placeholders seem complete.
4. Support local, private/family, tourism, wedding, event, station/airport, outstation; eligible goods ONLY with legally appropriate configured vehicle. Don't pretend a school Eeco is a commercial goods truck. Prevent school-run, existing booking, maintenance and driver/vehicle schedule conflicts via existing backend checks.
5. Public urgent /urgent: large configured Call Owner Now button first; optional very short callback with pickup/phone/note, no mandatory signup, advance or fare wizard. Honest response/availability; medical emergency -> official emergency assistance, not a fake ambulance. Protect public callback with validation/rate limit.
6. Restore relevant nav, service cards, error/loading/empty/quote states, mobile tap targets, calling on supported device. If no owner number configured, clear fallback; never publish demo number.

KEEP FARE HONEST: Until Phase 05 routing adapter exists, display EXACT 'Distance unavailable — owner will confirm the fare.' and let the owner quote. Do not manually set a guessed km and call it auto-calculated.

TEST: guest sees urgent and vehicle pages; new customer and school parent both book using same login; booking reaches owner queue; quote -> customer acceptance -> owner assignment with verified/waived advance policy; conflicting school schedule rejected; unrelated customer 403; eligible goods guard; public callback/rate limit; working mobile/desktop nav. Current DB-backed Playwright verification at 320/360/390/768/1440px; record any remaining P0 gap. STOP.
```

---

## PHASE 05 — Real Road-Distance Estimates & Owner Fare Settings [P0]

```text
Continue SafeRide Kids after Phase 04. Execute ONLY Phase 05. Update automatic fare with truthful routing, not simulated city distances.

AUDIT: apps/api/src/bookings.ts persists null distance and estimate with distanceSource UNAVAILABLE; existing fee/rate settings may be present, check current schema and API. A configured routing service/provider is not guaranteed; default fallback MUST work without paid service.

BUILD:
1. Server-side routing-provider adapter behind configuration. Use a legally allowed provider/API for ROAD ROUTE distance only, check usage/caching/attribution policy, never silently assume public OSM tile servers supply routing or that a paid key exists. Config can be absent: do not block booking.
2. Pickup: opt-in phone GPS/map pin or village, landmark, city/address typed. Destination: easy Hindi/English text with optional map selection. If geocoder or route fails, customer still submits request and server responds exactly 'Distance unavailable — owner will confirm the fare.' No invented kilometres, straight-line numbers or false ETA.
3. Server fare engine in integer paise: rate plan per vehicle/service, base charge, verified road kilometres, minimum, one-way/return policy, package/hour/day, applicable waiting/night/tolls/parking, and explicit estimated/unpriced extras. Rules and assumptions shown in a clear breakdown. Store amount, rate-version snapshot, source, route observation and calculation timestamp. Customer cannot tamper price.
4. Show live recalculation after valid pickup/destination changes, loading/failed-route/retry states, and one prominent Book Request action. Use progressive disclosure: normal passenger booking may only need pickup/destination/date; tourism/wedding asks duration; goods only if eligible vehicle and needs cargo data.
5. Estimate is NOT owner-confirmed final fare; preserve existing versioned owner quote -> customer acceptance -> advance verification -> assignment. Schedules prevent same Eeco from overlapping school duty. Owner may issue manual quote with explicit manually-provided distance if required, prominently labeled MANUAL, never as GPS/provider routed distance.
6. Existing authenticated API, Mongo records, RTK Query tags and shared Zod validated types must remain consistent; don't put authoritative fare in React-only code.

TEST: test provider mocked responses with 12 km at configured rate, min fare, round trip, night/waiting, package pricing, paise rounding, changed rates/immutable quote snapshot, provider unavailable/timeout, unknown village, bad coordinates, tampered client fare, unauthorized rate edit, no configuration, same-account school+ride, booking conflict. Browser 320/390/1440px with both estimate and honest fallback. STOP.
```

---

## PHASE 06 — Correct Fees, Advances, Verified Payments & Reminders [P1]

```text
Continue SafeRide Kids after Phase 05. Execute ONLY Phase 06. Prioritize genuine money correctness and useful parent/student reminders over elaborate charts.

AUDIT GAP: Business.schoolReminderDays defaults [0,3,7], while apps/api/src/fees.ts reportedly sends one notice when due <= 5 days and deduplicates only once per student/month/recipient. Agreed fee has been changed in Phase 01. Existing payment verification, expense and fee-ledger code should be reused, not rewritten blindly.

IMPLEMENT:
1. Reconcile each approved student's versioned agreed monthly fee and service start period with generated month charges (idempotent), partial payment, previous dues, advance/credit and audit-backed adjustments. Leave doesn't automatically change fee. Old paid periods/receipts remain unchanged after future rate revision.
2. Customer-reported payment (UPI/Cash/Bank reference) remains PENDING VERIFICATION. Owner sees verification queue, verifies actual receipt or rejects with reason; only verified payment changes authoritative outstanding/advance/paid KPIs. Duplicate retries cannot double-credit, refunds/reversals remain traceable.
3. Business-wide configurable lead-time reminder offsets (e.g. 7, 3, 1, 0 days) with optional per-student override where existing model permits. Parent gets clear amount/date/remaining due, student gets age-appropriate 'Please remind parent/guardian' message, no pressure language or sensitive transaction info. Only correctly due recipients; settled months suppressed; partial payment reflects correct remaining balance. Idempotency per child, billing period, offset, recipient, due state; no false 'sent' claim for external channels.
4. Scheduled reminders must work on economical hosting: protected idempotent scheduled HTTP endpoint + documented external scheduler and on-access catch-up where safe; do not assume always-on Render background process. In-app notifications required; browser push only if configured and consented. No mandatory SMS/WhatsApp paid API.
5. Owner school and general ride finance navigation show clearly separate fee dues, verified collections, pending claims, booking advance, final balance and expenses. Preserve current ledger/receipt routes and exports where correct; fix false labels or miscalculated totals.
6. Ensure parent and student notification pages and billing/owner settings are intuitive at mobile widths. Provide amount breakdown, due day, status and easy direct owner contact.

TEST: siblings with different fees, ₹1,500 proposal approval, ₹1,800 approved counter, partial ₹500 payment, unpaid previous month, future fee revision, leave day, advance, duplicate claims/UTR flagged, verify vs pending, refunds/reversal, configured reminders on 7/3/1/0, duplicate scheduled calls, already paid, student recipient privacy, late job, owner totals reconciliation. Browser same customer+owner+student, 320/390/1440px. STOP.
```

---

## PHASE 07 — PREMIUM PUBLIC WEBSITE REBUILD (Original Uber/Rapido-Level Polish) [P1]

```text
Continue EXISTING SafeRide Kids after working booking, school and urgent destinations exist (Phases 01–06). Execute ONLY Phase 07. Do NOT rebuild the project or imitate Uber/Rapido branding. Deliver an ORIGINAL premium mobility website that solves local Eeco-owner needs and feels equally polished on low-end Android and desktop.

READ: docs/PUBLIC_WEBSITE_REDESIGN_PLAN.md, docs/UI_UX_AUDIT.md and FINAL_UPDATED_REQUIREMENTS; inspect current public-pages.tsx, styles.css, design-system.css, components.tsx, routes.tsx, public API, existing van asset. Open current site in Chromium at 1440 and 390, capture baseline; do not design from imagination alone. Preserve working form/API/nav conventions and design tokens where effective.

PRODUCT: SafeRide Kids is school-child tracking FIRST plus a real local ride-booking business. Public site must not look like a school noticeboard or empty generic template. User is often a rural Hindi-speaking parent or customer on a basic phone. Premium + trusting + simple, not overloaded. NO fake safety guarantees, reviews, fleet size, seating specs, current location, vehicle photos, live ETA or prices.

DESIGN SYSTEM:
- Existing colors: primary #125fd4, navy #142544, surface #f5f8fd, positive #0c9866; white cards, purposeful warm neutral/amber accent if needed, accessible contrast.
- Use expressive but readable typography including Devanagari-capable font, cohesive iconography, elegant 16–24px card radii, restrained blue-tinted elevation, strong focus/hover/pressed/loading, purposeful illustrations, polished mobile-safe-area handling.
- Responsive hero composition and vehicle media are crucial. Use owner-provided REAL Eeco photo if available and authorized. If absent, retain existing branded illustration labeled 'illustration' and clearly surface a nonblocking business-photo TODO; DO NOT misrepresent it as owner's vehicle, or replace with random SUV/luxury sedan. Avoid real children's identifying images without permission.
- Subtle original animation: button affordances, softly revealed content, microfeedback; honor prefers-reduced-motion; no heavy autoplay or page jank. Lazy-load below-fold photos/maps with defined dimensions and optimized WebP/AVIF if available.

PUBLIC INFORMATION ARCHITECTURE, IN ORDER:
1) Attractive responsive Header: SafeRide Kids logo; Home, Services, Our Vehicle, Contact; Login; prominent 'Book a Ride'; visible Call icon only when number is configured; Hindi/English switch. Accessible mobile menu.
2) Premium HERO: punchy headline 'School rides you can follow. Local journeys you can book.' (natural Hindi equivalent), 1–2 sentences, primary BOOK A RIDE, secondary SCHOOL TRANSPORT and CALL OWNER. Visually strong Maruti Eeco photo/art and a clearly labeled sample school journey card. On 360px headline/CTA BEFORE oversized imagery; no giant empty fold.
3) Quick destination-first booking card: 'कहाँ जाना है?' Pickup GPS permission or village/landmark manual entry, destination, service quick choice; fare estimate only if routing backend returns valid road route; else exact fallback. If signed out, preserve permitted draft through /login/signup without leaking user info. All actions lead somewhere real.
4) School Safety/Tracking: clear illustrated four-step journey (boarded, reached school, return boarded, reached home); explain driver confirmation vs vehicle GPS, last-updated/stale limitations; Call Driver/owner concept and leave. CTA Request School Transport.
5) Six rich interactive SERVICES: School Transport; Local Trips; Tourism; Wedding & Events; Outstation/Station/Airport; Urgent Transport. Goods only if real eligible vehicle configured. Each has proper copy, image/icon and valid CTA. Urgent is call-first, not fake ambulance.
6) OUR VEHICLE: attractive gallery with actual owner Eeco images and verified model/capacity/route/service area, or honest placeholder. Call/Request Booking; never invent permit or insurance facts.
7) How It Works with TWO 3-step flows: school request->customer fee proposal/owner agreement->assigned journey tracking; general pickup/destination->fare estimate/owner quote->confirmed ride.
8) Trust & Safety: actual operational practices and privacy only, no unsupported testimonials, stars or fake GPS promises.
9) Contact/Footer: current configured owner call/WhatsApp, enquiry with real API success/error, area, links to terms/privacy, language switch. Honest phone-unconfigured fallback.

UX REQUIREMENTS:
- 320/360/390/768/1024/1366/1440px no document overflow, clear header and booking CTA on first mobile screen, touch controls >=44px, keyboard/focus/ESC/back, no accidental click traps, accessible alt and ARIA, high contrast, reduced motion.
- Hindi-friendly labels and error states, clear calls. Correctly sized images; loading/empty/offline/skeleton; on poor internet page remains functional without map or photography.
- Forms and CTAs must be connected to existing authenticated/public API and valid routes. Not a static fake demo. Maintain one unified login, no role-selector cards. Protect all child/GPS data from public APIs.
- Public urgent page and vehicle detail page get the SAME premium visual standard, not a generic white form.

TEST / PROOF:
Baseline vs final screenshots at all 7 widths, real browser CTA clicks (Book, School, Call, Services, Vehicle, Urgent, Contact), guest->login booking draft continuity, enquiry Mongo persistence, configured vs absent phone/photo, keyboard/menu, Hindi text wrapping, slow-3G/offline, safe area, reduced-motion. No invented response, no broken images, no dead CTA. Build/lint/typecheck/test. Report asset deficiencies and verified API states. STOP.
```

---

## PHASE 08 — Hindi-First, Village-Friendly UX Throughout the App [P1]

```text
Continue SafeRide Kids after premium public website Phase 07. Execute ONLY Phase 08. Goal: make school parents, customers, owner and student portals genuinely usable in villages, kasbas and smaller cities without degrading security or visual quality.

READ updated requirements and audit; inventory all user-facing strings and workflows in owner/customer/student/minimal Trip Mode, school application, fees, booking wizard, notices, errors and printed documents. Business language setting alone does not localize hardcoded English.

IMPLEMENT:
1. Real Hindi/English language switch persisted appropriately, consistent translation content, Devanagari-legible font and line heights, correct INR/date/time conventions (Asia/Kolkata display), natural short labels rather than literal awkward translations. Default Hindi-first is fine; user can select English. Do not publish machine-literal placeholders.
2. Parent school home above the fold: 'बच्चे की स्थिति', 'गाड़ी देखें', 'ड्राइवर को कॉल', 'आज नहीं जाएगा', plus fee and notices. Always show real event timestamp and offline/stale; no fake real-time certainty.
3. Customer booking starts 'कहाँ जाना है?', typed village/landmark/nearby station and current location only if allowed; saved/preferred pickup; visible calculated price or honest manual quote, no long default wizard. Owner can create phone-assisted request/booking with source and consent.
4. Owner dashboard simple nav: Home, School, Bookings, Money, More; group advanced functions under More, desktop can use structured sidebar. Avoid hiding actions in menus. Current active bookings/urgent and school roster must be reachable easily. Status and totals defined from real DB.
5. Student home simple own ride, leave request pending parent, notice and fee reminder. Trip Mode large safe-stop controls for owner or assigned driver with no financial/admin pages.
6. User-friendly errors/retries for bad network, GPS permission denied, owner phone missing, unknown location, booking fare unavailable, fee claim pending verification. Keep on-screen cache/status truthful; do not silently report success before server acknowledgment.
7. 1–3 taps for Track Child, Mark Leave, Call Driver, Book Ride; form keyboard types, explicit label/validation, no false SMS/WhatsApp 'sent' promises, screen-reader/keyboard access and color contrast.

TEST:
A few realistic *fictitious* village/landmark names and users in isolated test database, Hindi + English at 320/360/390/768/1024/1366/1440, touch/keyboard, large Hindi labels, weak network/offline, interrupted writes, parent/owner/student/Trip Mode each in current app, RTL not required (Hindi remains LTR). Verify actual API status and no data leakage. Include screenshots and measured bundle/perf regression; consider initial JS chunk already warned ~551.86 kB. Fix measured regressions through lazy loading, not by adding a second cache. STOP.
```

---

## PHASE 09 — Complete Cross-Role E2E, Security, GPS Device & Release Gate [P0 release]

```text
Continue SafeRide Kids after Phases 01–08; execute ONLY Phase 09. This is release verification and targeted fixes, not wholesale new feature development. Start current frontend+Express+isolated test MongoDB. Re-run relevant tests and capture NEW evidence, not historical screenshots.

SCENARIOS MUST PASS OR BE REPORTED BLOCKED:
A) New customer -> ONE login -> proposes ₹1,500 both-way school service -> owner approves OR ₹1,800 counter -> customer accepts -> child creation only after approval -> owner vehicle/route/driver assignment -> subscription active, correct fee billing.
B) Owner-as-driver and separate assigned driver authenticated minimal Trip Mode -> real confirmed morning boarded/school reached and afternoon boarded/home dropped -> guardian and student see correct scoped timelines; append-only corrections and duplicate prevention.
C) Active authorized GPS upload + parent reads only assigned vehicle; no fake coordinate; fresh/stale/denied/offline/stopped states and active-trip expiry. Real test phone foreground, background, screen-lock and reconnect where possible; clearly identify unsupported guarantees.
D) Student requests leave -> parent confirms -> driver roster shows absent; after-boarding leave rejected; no fee reduction.
E) Monthly charge, partial ₹500, balance, owner verifies customer UPI claim (not before), advance, previous dues, reminder offsets parent/student and no duplicate/paid reminder.
F) Same parent books regular local trip by village/landmark -> valid road-routed estimate OR clear unavailable fallback -> owner final quote -> customer accepts -> verified advance/waiver -> available Eeco assignment; reject overlap with school duty.
G) Wedding/tourism/outstation scheduling and quote; eligible goods guarded, unsuitable passenger-only vehicle forbidden.
H) Public /urgent call-first without login, official medical emergency guidance, short callback stored/triaged, no false response guarantee.
I) Owner contacts/WhatsApp/tel only when configured, public enquiry, notifications and service pages function in both languages.
J) All financial totals, expenses and receipts consistent; CRUD/permission audit, IDOR, CSRF, session revocation, rate-limit, duplicate requests/transactions, businessId/child scoping, document export safety.
K) Premium public site + customer + student + owner + Trip Mode at 320/360/390/768/1024/1366/1440, Chrome console/404/image failures, keyboard, no horizontal overflow, Hindi/English switch, large actions, low data.

RUN: npm build, typecheck, lint, relevant Vitest, full authenticated Playwright backed by isolated Mongo, DB before/after assertions, production-like smoke test if possible. Inspect indexes, backups/restore plan, commercial hosting limits, photo/contact/UPI config, legal vehicle docs and real phone GPS constraints. Don't touch real customer/child data or paid infrastructure without consent.

DELIVER docs/SAFERIDE_KIDS_RELEASE_ACCEPTANCE_2026.md (date accurately recorded), passed/failed/untested with evidence references, regressions fixed and retested, outstanding P0/P1/P2, verified asset/phone/location limitations and final decision VERIFIED FOR LIMITED PILOT or NOT VERIFIED FOR PILOT. Do not say production-ready if critical operational/device/privacy tests remain blocked. STOP.
```

---

## Later (not part of pilot gate)

After successful limited pilot, consider extended report exports, extra goods logistics forms, advanced fleet management and SaaS multi-operator expansion. They must not delay core school safety, local booking, verified payments or the premium rural-friendly UI.

**Critical dependency reminders:** The audit copy reportedly lacked `.git`; source changes need careful backups/versioning. The operator must supply authorized real Eeco photos, phone number, vehicle/driver details, permitted service categories, UPI details and appropriate consents. GPS background reliability and scheduled push depend on browser/hosting/device; no false continuous tracking or guaranteed delivery claims.
