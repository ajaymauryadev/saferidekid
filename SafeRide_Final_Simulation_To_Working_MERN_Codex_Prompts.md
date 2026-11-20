# SAFERIDE — FINAL SIMULATION → COMPLETE WORKING MERN SOFTWARE
## Master reference contract + sequential Codex implementation prompts

**Edition:** 8 November 2026  
**Product:** SafeRide — one transport operator, multiple services, customers/parents, optional students, drivers and vehicles.  
**Deliverable:** A production-conscious, genuinely working React + Express + MongoDB application built from the supplied interactive HTML reference, not a static clone.  
**Development style:** Audit the existing repository, retain working code, complete one testable phase at a time, prove every user flow with real API/database updates.

**Existing repository checkpoint (10 November 2026):** Prompts 00–11 have code and test evidence in this root. Before starting another implementation phase, verify the current code and acceptance matrix rather than replaying earlier prompts. The next planned phase is Prompt 12. This checkpoint is not a claim that the whole product is complete.

> **IMPORTANT: This file replaces the earlier development prompt packs when there is a conflict.** This is the final product definition. The **HTML simulation is the primary visual/interaction specification**; the **Premium UI/UX Blueprint is the detailed product UX requirement**; this document is the **functional and engineering implementation contract**. Never blindly copy demo-only logic from the HTML.

---

# 0. HOW TO USE THIS FILE

Place these files in the SAME VS Code project root:

1. `SafeRide_Complete_Interactive_UI_Simulation.html` — **FINAL, READ-ONLY UI/interaction reference**.
2. `SafeRide_Complete_Premium_UI_UX_Blueprint.md` — detailed screen and UX specification.
3. `SafeRide_Final_Simulation_To_Working_MERN_Codex_Prompts.md` — **this** authoritative implementation plan.
4. Existing `AGENTS.md`, `docs/`, `apps/`, `packages/`, `scripts/` etc. if present. Older prompt packs, if present, are historical and do not override these three files.

**If the exact simulation/blueprint filename differs:** discover files in the root, select the correct uploaded final version by content, document which actual path was used. Do not silently use the older `SafeRide_Kids_Interactive_Simulation.html` instead of the FINAL `SafeRide_Complete_Interactive_UI_Simulation.html`.

**For Codex:** First send the **MASTER KICKOFF MESSAGE** at the bottom. Then execute **PROMPT 00**, **PROMPT 01**, ... in order. At the start of *every* prompt, Codex must reread the required relevant sections and the real existing implementation. At the end, it must run tests, verify the rendered browser, produce evidence, and **STOP**. Do not send all phases as one enormous unsupervised job. It is okay to skip already-completed work only when the agent has proved it meets the **new final** product, design and tests.

## Precedence when files disagree

1. Security, privacy, financial correctness, legal/safety limitations and real-world facts always prevail over prototype appearance or behavior.
2. This file's final architecture, unified customer/parent identity, functionality and acceptance requirements prevail over outdated plans.
3. `SafeRide_Complete_Interactive_UI_Simulation.html` prevails for visual layout, content hierarchy, colors, mobile behavior, navigation patterns, component structure and *intended* interactions (except demo controls).
4. `SafeRide_Complete_Premium_UI_UX_Blueprint.md` prevails for screen completeness, service workflows, progressive disclosure and accessibility.
5. Existing `AGENTS.md` and docs provide implementation context and existing code constraints; reconcile and update them instead of allowing contradictory rules to survive.

**No progress-by-file-count:** Code that compiles but has empty UI, fake data, unimplemented actions, or inaccessible backend is NOT complete. No '100% done' statement without tests and running-app inspection.

---

# 1. NON-NEGOTIABLE GLOBAL IMPLEMENTATION CONTRACT

## 1.1 Technology stack — STRICT

- Frontend **React + TypeScript + Vite** (existing npm workspaces where present).
- React Router for routing.
- **Redux Toolkit + React Redux** for application/client state.
- **RTK Query ONLY** for server-state fetching, caching, mutations, tag invalidation, polling and refetch. Central `createApi` + `fetchBaseQuery`, feature `injectEndpoints`, Redux middleware and `setupListeners`. No parallel custom server cache.
- Node.js + **Express + TypeScript**, REST APIs.
- **MongoDB + Mongoose**, indexed schemas, atomic updates, MongoDB as shared source of truth.
- Tailwind CSS, customized shadcn/ui primitives (or carefully themed equivalents where existing), Lucide icons, React Hook Form + Zod.
- Leaflet/react-leaflet for map rendering **when a genuine authorized GPS point exists**; address/routing provider adapters with honest fallback.
- Test with Vitest/React Testing Library, Supertest, Playwright/Chromium, plus real local MongoDB or `mongodb-memory-server` when appropriate; NO Docker.
- npm workspaces: `apps/web`, `apps/api`, `packages/shared` when already present or when new initialization is necessary.

**ABSOLUTE BANS:** Redis, Docker/Docker Compose, Kubernetes, SQL/Postgres/MySQL/SQLite, Prisma SQL, TanStack Query/React Query, SWR, Apollo data cache, Zustand, MobX, BullMQ, mandatory message queues or background workers, mandatory load balancing, paid payment gateway, compulsory paid SMS/WhatsApp Business API or premium map service, fake implementation masquerading as real.

Use low-cost, single-API-instance architecture with MongoDB as the shared truth. Do not add load-balancers, Redis or distributed caches 'for performance'. Implement purposeful MongoDB indexes, lean/projection reads, pagination, RTK Query cache tags and low-frequency scoped polling instead.

## 1.2 Actual product definition

SafeRide is **one independent transport operator's software**, potentially with multiple drivers and vehicles. This is NOT a multi-owner booking marketplace in this release. All of the following business services are in scope NOW:

- School transport subscriptions, guardian-linked students, scheduled routes, fees, driver-confirmed pickup/drop, leave and journey tracking.
- Wedding/marriage bookings, parties/events, family trips, local and outstation, station/airport pickup and relevant private journeys.
- Goods/luggage/agricultural pickup **only with a legally appropriate vehicle**, with suitable dispatch and delivery records.
- **Urgent non-ambulance transport** with a public call-first, minimal-request flow. For actual medical emergency, make official emergency/ambulance contact prominent; never suggest an ordinary van is an ambulance.
- Price estimates, owner quotations, advance requirement, booking calendar, assignment, trip lifecycle, invoices, expenses and reports.
- Manual direct-to-owner UPI/cash/bank payments; customer-reported payments remain pending until owner verifies real receipt. **NO PAYMENT GATEWAY**.
- Customer/Parent self signup and ONE account/dashboard across all services; separate owner/driver accounts; optional restricted student account.
- Owner can perform powerful business admin operations, corrections, exemptions, overrides and eligible deactivations/deletions with an audit reason and immutable original evidence; cannot falsify bank receipts, GPS or safety event history.

## 1.3 Identity and authorization — non-negotiable

- ONE `/login` form for Customer, Owner, Driver and optional Student; **NO role selector**. Backend authenticated principal determines workspace.
- ONE public `/signup` that creates CUSTOMER accounts. **Customer = Parent = General Booking User**. Do NOT create separate Parent role/login/dashboard; a customer becomes guardian through an approved school subscription and secure student linking.
- Owner bootstrap is private/secure, not open admin signup. Drivers invited/provisioned by owner. Student accounts optional and created only from authorized student profiles, with guardian consent/appropriate age handling.
- Public urgent assistance is available **without login** and must be minimal. Public contact and informational pages are available without login.
- One person can have school subscription(s), private bookings, goods bookings and payments under the SAME user identity. Show contextual sections, never force a parallel login.
- Ownership/relationship checks on **every** API route. Parent sees only their students and permitted active vehicle; customer only their bookings/payments; driver only assigned duties/minimum contacts; owner only their own business (businessId boundary for future growth). No client-side role swapping or trusting user-submitted role/businessId/guardianId.
- Role/account suspension and deletions revoke sessions immediately. Never destroy financial/event/audit evidence unlawfully or without correct controlled retention/anonymization.

## 1.4 Source-of-truth: the FINAL interactive simulation

Mandatory actual file: `SafeRide_Complete_Interactive_UI_Simulation.html`. **Inspect it in the editor AND open it in Chromium**. This specific file already contains:

- The SafeRide branded public marketing website, service cards, vehicles, contact, unified login/signup and public urgent page.
- A responsive **adaptive customer/parent dashboard** (school-active and no-school variations), call/track/leave buttons, fee card, services, bookings, bottom nav.
- School subscription application, quotation, customer acceptance, student-add-after-approval, owner assignment/activation.
- Wedding/private/goods service picker, multi-step booking estimate, owner quotation/advance, booking detail and payment claim.
- Owner sidebar with dashboard, live operations, calendar, school subscriptions/students/routes/leaves, bookings/customers, finance verification/fees/advances/expenses/reports, fleet, notices, settings, user/audit.
- Driver mobile My Day, school roster with pickup/drop actions, private trips, notices and GPS state.
- Optional student view and restricted leave/notices.
- Consistent cards, status pills, tables, search, dialogs, confirmations and preview roles.

**Simulation implementation artifacts — NEVER copy as production functionality:**

- `localStorage` seeded `db` and browser-only mutations.
- `asViewer()`/`preview()`/floating `UI Preview`, demo role switch shortcuts, `demo123` password or `demo-*` login identifiers.
- `sampleCities`/`sampleDistance()` and manually entered km as genuine geocoded road distance.
- `mapSurface()` SVG neighborhood, `gpsIndex`/`gpsOn` simulation and demo coordinates as live vehicle tracking.
- `window.confirm` as the only protection for account/financial/driver safety events.
- UI-only `audit()` array in place of server audit logs.
- In-memory example fee math as audited bills/ledger; auto-verifying a typed UPI reference.
- Public debug/health banners, fake real-time claims, screenshots in place of functioning UI or data APIs.

Keep HTML **unchanged**, isolated as a design reference. It must not ship as the actual React runtime. It is fine to extract the supplied embedded branded vehicle WebP asset to a real local asset (if permitted) and reuse its visual tone.

### Visual token contract — replicate from the FINAL HTML

| Semantic | Value/style |
|---|---|
| Primary blue | `#125fd4` |
| Deep hover blue | `#0c4cac` (simulation) / accessible adjusted value after contrast check |
| Navy | `#142544` |
| Body ink | `#233750` |
| Muted | `#6a7c91` |
| Background | `#f5f8fd` |
| Card | `#ffffff` |
| Border | `#e4eaf3` |
| Positive | `#0c9866`, light `#e1f8ed` |
| Warning | `#a36c0a`, light `#fff3dc` |
| Danger | `#cc4259`, light `#fff0f2` |
| Card radius | ~`21px` |
| Control radius | ~`13px` |
| Shadow | gentle blue-tinted `0 12px 40px rgba(28,65,110,.065), 0 2px 10px rgba(28,65,110,.035)` |
| Typography | Inter / Segoe UI / system sans; readable 14–16px essential body copy |

**Visual matching means:** same proportion, visual hierarchy, content density, soft panels, vehicle artwork placement, CTA treatment, iconography, navigation and active states, modal form style, data-table density, mobile bottom nav, animation restraint. Retain as much of the reference as is genuinely usable, but fix readability and a11y issues. Avoid plain scaffold/Tailwind defaults. No excessively tiny text, pale-on-pale or fake 'button' controls. Main actions min ~44px tap target; accessible contrast; keyboard-friendly navigation.

### Exact navigation from final HTML (map to actual React routes)

**Public:** `/`, `/services`, `/vehicles`, `/contact`, `/login`, `/signup`, `/forgot-password`, `/urgent`.

**Customer:** `/app/home`, `/app/school`, `/app/school/apply`, `/app/school/children`, `/app/school/track`, `/app/school/leave`, `/app/bookings`, `/app/book`, `/app/bookings/:id`, `/app/payments`, `/app/notices`, `/app/account`. Mobile bottom nav: **Home / Bookings / Payments / Account**. Call/Track/Leave as prominent school quick actions.

**Owner:** `/owner/dashboard`, `/owner/live`, `/owner/calendar`, `/owner/school/subscriptions`, `/owner/school/students`, `/owner/school/routes`, `/owner/school/leaves`, `/owner/bookings/requests`, `/owner/bookings`, `/owner/customers`, `/owner/finance/verify`, `/owner/finance/fees`, `/owner/finance/advances`, `/owner/finance/expenses`, `/owner/reports`, `/owner/fleet`, `/owner/notifications`, `/owner/settings`, `/owner/users`. Use grouped sidebar exactly as final HTML: Overview, School, Bookings, Money, Fleet & System.

**Driver:** `/driver/today`, `/driver/run/:runId`, `/driver/trip/:bookingId` and duty/notice section (simulation `/driver/more`). Mobile bottom nav: **My Day / Live Trip / More**.

**Optional Student:** `/student/home`, `/student/leave`, `/student/notices`. Minimal read-only or guardian-approved actions.

Do not implement extra unrelated dashboards or four independent public login pages.

## 1.5 Backend, finance and safety rules

- MongoDB models must be intentional, indexed, scoped to `businessId`, versioned where required and validated with Zod. Authoritative money values are **integer paise**, not JS floating-point amounts. Display INR in `en-IN`. UTC storage, Asia/Kolkata business calendar conventions.
- Payment claim submitted by customer is **PENDING_VERIFICATION**, not revenue/confirmed advance. Owner manually verifies cash received/bank credit; store verifiedBy, verification timestamp, source, amount, method, reference and audit. Duplicate submissions and retries must not duplicate receipts/ledger credits.
- A booking may require owner quotation → customer acceptance → verified advance → owner confirmation/assignment; support policy for waived/zero advance with explicit audited owner approval. Quote, advance, paid, due, refund and cancellation fee must reconcile. Never mark paid from client assertion alone.
- School fixed fee per approved child/agreement and month. No automatically reduced fee for day-off. Partial payment, credits, carry-forward, adjustments, previous months, year/month selection, reminders to customer AND optional student recipient. Fee billing begins according to approved service effective dates/policy, not merely an unapproved request.
- Booking estimated fare is indicative until owner quote. Use actual road route data only from a configured routing service and its allowed use; if unavailable, accept manually entered location and show **'Distance unavailable — owner will quote'**. No fake Lucknow→Kanpur distance as live computation. Support per-km, base, vehicle rate, round trip, hourly/daily package, toll/parking/extra charges and quote override.
- School event changes are explicit driver/authorized-owner confirmations. Distinguish boarded, school reached, afternoon boarded, dropped home, missed pickup/leave; cannot silently turn a student absent after confirmed boarding. Corrections are append-only/audited with reason, original and corrected event; never mutate reality without trace.
- Live tracking comes only from authorized driver/browser Geolocation API with consent, HTTPS, and active assigned trip. Stale age threshold, accuracy, timestamp, permission/offline issues; stop tracking at end, restrict history retention. Browser tab suspended/phone locked cannot guarantee real-time continuous tracking. Never show SVG/dummy moving marker as real GPS.
- Owner may override fees, booking assignment/status, service rules and attendance corrections with reason and audit where appropriate. **No override can make an illegal vehicle suitable, bypass authentication/data isolation, falsify receipt or GPS, erase financial audit, silently cancel a boarded child, or double-book an occupied vehicle without actually resolving conflict.**
- Medical emergency: never promise ambulance service or emergency response when not operated. Promote official emergency/ambulance contact and treat SafeRide's urgent flow as **ordinary passenger call-back/transport subject to availability**. No mandatory login, price wizard or advance to access help. Collect minimal information; protect against spam and disclose no guaranteed response.
- Email/SMS/WhatsApp integrations optional; in-app notifications required. No paid gateway or provider as prerequisite. External WhatsApp action is an explicit click, not automatic API message.
- `tel:`/configured owner or driver phone must be real configured information, with safe fallback; do not publish seeded 'demo' phone numbers as real.

## 1.6 Security & sessions

- Use robust password hashing (Argon2id or bcrypt), secure HttpOnly cookies, session expiry/revocation, login rate limiting, CSRF defense for cookie auth, validation, Helmet, origin/CORS protection, clear server errors, audit logging and no sensitive PII in logs. Do not store auth tokens or API cache in localStorage.
- Prefer same-origin `/api` reverse proxy in dev/prod, verify actual cookie delivery across Vercel→Render or use a compliant single-origin deployment. Never casually assume cross-site cookies work. Authenticate API via trusted server session.
- Prevent IDOR: all customer, student, booking, payment, GPS, driver and owner queries have backend authorization and business scoping. Seeded role switches must not leak into production.
- Secure one-time owner bootstrap; owners can invite drivers and optional students, customers can self-signup. Password reset must use securely expiring tokens via configured channel or owner-assisted reset, not insecure reset by knowing phone alone.
- Public forms limited by rate controls/captcha alternatives as appropriate (no Redis requirement). Retain only necessary child/location data with privacy/retention controls; avoid public student names, phone numbers and live locations.

## 1.7 Developer-facing quality bar for EVERY phase

1. Audit repo and current status first; no destructive resets, blanket rewrites or overwriting uncommitted work. If repo empty, create proper project in the current folder; don't nest a second `saferidekids` directory.
2. Inspect the **actual final HTML** component/render/CSS for each screen before implementing. Maintain `docs/UI_PARITY_MATRIX.md` mapping every demo screen/action to React route, API endpoint, data model, test, screenshot and current status.
3. Compare reference HTML screenshot to React at **1440, 1366, 1024, 768, 390, 360 and 320px** where relevant. Visual parity is about appropriate design fidelity, not reproducing demo-only auth/GPS behavior. Document justified differences.
4. Implement a vertical slice: working React control → RTK Query mutation → authenticated Express endpoint → validated MongoDB write → role-filtered query back → correct UI state, loading, error and success.
5. Add tests for success, failure, unauthorized access, wrong relationship, duplicate/idempotency and relevant edge cases. No tests that only check a button exists while it is inert.
6. Ensure build, typecheck, lint and tests run. If tools/service are unavailable, mark exactly which checks are **UNVERIFIED**; never invent green checks, screenshots or hosting success.
7. For screens not yet implemented: render a clear **not yet available** state behind auth, not a clickable fake success. Don't claim app complete until all deliverables are real.
8. End with `FILES CHANGED`, `IMPLEMENTED`, `API/DB PROOF`, `BROWSER UI PROOF`, `TESTS + RESULTS`, `OPEN ISSUES`, `NEXT PROMPT`. Stop after the requested prompt.

---

# 2. REQUIRED SYSTEM ENTITIES AND WORKFLOWS

The exact schema can be refined based on repo audit, but document and implement these concepts; never hide them inside one giant untyped `data` collection:

**Business & Identity:** `Business`, `User`, `Session`, `Invitation`, `ResetToken`, `RoleGrant/Permission`, `AuditEvent`, `Notification`, `NotificationPreference`, `ContactEnquiry`.

**School:** `SchoolSubscriptionRequest`, `SchoolFeeAgreement`, `Student`, `GuardianStudentLink`, `School`, `Route`, `Stop`, `RouteAssignment`, `Run`, `RunStudentEvent`, `LeaveRequest`, `SchoolMonthlyCharge`, `FeeAdjustment`, `ReminderDispatch`.

**Fleet & Location:** `Vehicle`, `DriverProfile`, `Assignment`, `AvailabilityBlock`, `VehicleDocument`, `MaintenanceRecord`, `TripLocation` (minimal/retention-bound), `DriverIncident`.

**Other transport:** `Booking`, `BookingQuote` (immutable quote versions), `BookingTransition`, `UrgentRequest`, `BookingCharge`, `GoodsManifest/DeliveryProof` when goods enabled.

**Money:** `PaymentClaim`, `VerifiedReceipt/Payment`, `PaymentAllocation`, `Refund`, `FinancialAdjustment`, `Expense`, `Invoice/DocumentSequence`. No gateway transactions.

Key state machines must be documented with allowed actions and ownership: 

- **School:** `requested → quoted → customer_accepted/approved → enrollment_pending → active → paused/closed/cancelled`; deviations via explicit audited owner action; child creation after approval, service only active after route/seat/driver assignment as applicable.
- **Booking:** `requested → quoted → accepted/awaiting_advance → confirmed → assigned → ongoing → completed/settlement_due → settled`, with cancellation/rejection/expiry paths. Zero-advance/waiver explicit, idempotent.
- **Payment claim:** `pending_verification → verified | rejected`; duplicate references flagged, cannot reverify; refunds/reversals are separate records.
- **School event:** session-specific, ordered driver confirmations with non-destructive correction event stream; missed/absent reasons preserved.
- **Leave:** parent created → confirmed/owner-visible; student created → guardian confirmation required → owner/driver visible; cancel restrictions if trip started/boarding occurred.
- **GPS:** no permission / unavailable / active fresh / stale / stopped / error, with timestamp + accuracy.

Centralize authorization and ledger functions on the backend. Never put critical money math or permission authority solely in React.

---

# 3. PHASED COPY-PASTE CODEX PROMPTS

**Note:** Each prompt is a complete task instruction, but inherits Sections 0–2 and all previously committed files. Codex must read the current source of truth and prior phase reports. Execute in order, one phase per agent turn, unless specifically noted.

---

## PROMPT 00 — EXISTING REPOSITORY AUDIT + FINAL SIMULATION MAPPING

```text
You are inside my SafeRide project root. DO NOT assume that the project is either initialized or empty. Inspect the actual repository tree, git status, package scripts, apps/web, apps/api, docs, assets and existing tests before editing anything. The final UI reference is SafeRide_Complete_Interactive_UI_Simulation.html and product blueprint is SafeRide_Complete_Premium_UI_UX_Blueprint.md. This master prompt pack overrides old code-generation plans. Read all three files carefully.

TASK:
1. Verify the final HTML visually in a real browser at public/owner/customer/driver/student views, mobile and desktop; record screenshots where tooling allows. Find component classes, render functions, navigation arrays, modals and action dispatch methods. Do not confuse it with older SafeRide_Kids HTML.
2. Inventory the current repo: implemented/working/missing, code quality, conflicting requirements, current credentials/DB strategy without disclosing secrets, dependencies, build/runtime status.
3. Reconcile AGENTS.md, PRODUCT_SPEC, ARCHITECTURE, PERMISSION_MATRIX and TODO/phase checklist with the FINAL rules: unified customer-parent, all booking services, public urgent flow, manual payment verification, owner overrides, real GPS, final HTML design reference, no banned technologies.
4. Create/update docs/UI_PARITY_MATRIX.md: exact HTML view/function, React route, reference screenshot path, required endpoint, owner of data, screen status, mobile status, outstanding interaction gaps. Create docs/FEATURE_ACCEPTANCE_MATRIX.md with every workflow and test.
5. Identify demo-only functions (localStorage, asViewer, sampleDistance, mapSurface, fake credentials, preview panel) and document correct replacements. Preserve the final HTML unmodified and read-only.
6. Inspect git status and protect existing uncommitted user work. If folder has only markdown/html/png, explicitly report and prepare initialization plan (without making another nested folder).
7. Report discovered current gaps and exact next steps. Do not spend the entire project endlessly rewriting documentation; STOP after this audit, then begin functional implementation in Prompt 01.

DONE ONLY WHEN: Repo inventory and exact HTML-to-React parity matrix exist; no actual code or user data was lost; the next phase and missing files are explicit.
```

## PROMPT 01 — RUNNABLE MERN FOUNDATION + FINAL DESIGN SYSTEM

```text
Read global contract, AGENTS.md, blueprint, final HTML CSS/markup and Prompt 00 audit. Reuse existing working code; only scaffold missing pieces, without changing folder identity. Implement a runnable npm-workspace MERN foundation (React TS Vite, Express TS, Mongoose MongoDB, shared Zod contracts). No banned tech.

BUILD:
- Proper scripts dev/build/typecheck/lint/test/seed:dev; .env.example without secrets; clear README. API starts only with declared config; health/readiness endpoints reflect actual DB connection; central error handling, Helmet, logging redaction, origin controls, safe JSON limits.
- Redux configureStore + Redux Provider + ONE primary RTK Query createApi/fetchBaseQuery middleware. Feature endpoint injection, tags, setupListeners, clear API state on logout later. No axios component-level second data cache.
- Exact simulation tokenized theme in Tailwind/CSS: primary #125fd4, blue-white surfaces, soft shadows, 21px cards, 13px controls, typography, status pills, sidebars, mobile bottom nav, responsive tables, form fields, popovers, dialogs, toasts, skeleton/empty/error/offline states, local van art if legally reusable.
- Reusable React components mapped to final HTML: PublicHeader/Footer, AppSidebar, Topbar, CustomerMobileNav, OwnerMetricCard, VehicleHero, SchoolRideCard, DailyAction, ServiceCard, DataTable, StatusPill, MapCardShell, JourneyTimeline, BookingCard, PaymentStatus, FormDialog, ConfirmationDialog, NoticeCard, EmptyState.
- Route shells for public/customer/owner/driver/optional student but no fake protected data. Ensure app can display appropriate signed-out/coming-soon state until auth is built.
- Produce preliminary real HTML-vs-React screenshot comparison at 390 and 1440; no generic shadcn starter UI or four portal cards.

VERIFY: Frontend + Express run, true DB readiness, source assets work, no hydration/console errors, 320/390/768/1440 rendering, package audit for forbidden deps. Stop at this phase.
```

## PROMPT 02 — PREMIUM PUBLIC WEBSITE + SERVICES, VEHICLES, CONTACT

```text
Implement all final HTML public screens as actual React pages: /, /services, /vehicles, /contact, FAQ/policies if required. Inspect landing(), servicesPage(), vehiclesPage(), contactPage(), navBarPublic(), footerPublic(), CSS and mobile drawer in final simulation. Match design accurately; improve legibility and semantics, not alter overall visual identity.

- Homepage hero: final SafeRide branding, vehicle visual, simple service messaging, prominent Book Vehicle and School Transport actions, short contact option. No customer/owner/driver/student role cards or internal dashboard previews. One header Login.
- School, wedding/events, party/private, local/outstation, goods pickup and urgent service cards with relevant customer actions. Goods availability only for eligible vehicles.
- Public-safe vehicle listing from DB: type, seats, provided photos, offered services; never reveal private school students, current private GPS or protected driver data.
- Business-configured contact, service area, optional WhatsApp and real click-to-call. Enquiry form backed by Express+MongoDB with validation/rate controls; owner can receive it later. No fake submission success.
- Clear pricing disclaimer: estimates subject to quote; urgent medical-service disclaimer; trust info about driver-confirmed pickup/drop and best-effort phone GPS; no invented testimonials.
- Responsive mobile nav drawer, keyboard focus, contrast, accessible form errors and useful empty states if owner has not configured fleet/phone.

TEST: public endpoints only return safe fields; successful enquiry persists and can be retrieved securely by owner later; public UI screenshot comparisons at 390/1440; no developer-only elements. Stop.
```

## PROMPT 03 — ONE REAL LOGIN, CUSTOMER SELF-SIGNUP, AUTH & INVITES

```text
Replace demo login/signup with genuine secure auth using one /login route and one /signup for customers. Inspect final HTML loginPage() for visual reference; copy appearance, NOT demo passwords, asViewer() or local fake auth.

- Customer self-signup with name, mobile/login ID, optional email, password, explicit policy acknowledgements; validation and duplicate-account errors without leaking account existence unnecessarily. A CUSTOMER can become a PARENT automatically by subscribing for school transport: never create a separate parent login.
- Verified backend identity and roles OWNER / CUSTOMER / DRIVER / optional STUDENT. Owner bootstrap from secure non-public one-time CLI/env process. Drivers invited/reset securely by owner. Optional student user later linked to approved student.
- Secure password hashing, cookie sessions HttpOnly, CSRF/origin defenses, rate limits, logout, /me, expiry and revocation, forgot/reset via secure configured delivery or one-time owner-assisted flow. Do not fabricate email/SMS delivery.
- Protected React routes; auto redirect after login: Customer /app/home; Owner /owner/dashboard; Driver /driver/today; Student /student/home. Authz at EVERY backend route; typed role/relationship middleware. No fake public role chooser.
- Owner-as-driver uses explicitly granted protected ability, NOT an identity-spoof selector.
- Development seed accounts only via explicit dev-only script, documented separately, never in production builds, never use localStorage tokens. Clear RTK Query memory/cache on logout/session switch.

TEST: signup+login, owner bootstrap, invited driver, logout/revocation, invalid creds, lockout/rate limit, 401/403/IDOR, same account for school and booking, mobile/desktop login visual parity. Stop.
```

## PROMPT 04 — ADAPTIVE CUSTOMER/PARENT DASHBOARD, CORE SHELL

```text
Rebuild final HTML customer screen pageCustomerHome() and appLayout('customer') into responsive React with genuine RTK Query data. The customer and parent are ONE account and ONE dashboard. Preserve final simulation's phone-like layout and 4-item mobile bottom navigation Home / Bookings / Payments / Account.

- For customer with active school subscription: greeting, child selector, My Child's Ride status (server-confirmed), three LARGE ABOVE-THE-FOLD actions: Call Driver, Track Vehicle, Mark Leave; GPS freshness/unavailable detail, monthly fee summary, service tiles, booking summary and notices.
- For customer without active school subscription: Get School Transport, Book a Trip, Goods Pickup, Urgent Ride as primary, recent bookings/payments/contact below; NO empty fake child card.
- If customer has pending/quoted school application, show status/required next action instead of pretending active tracking.
- Multi-child selection controls only WHICH linked child is viewed; not user account/role switching. Calls use configured and authorized tel: number; absence no number is explained.
- All amounts, status, counts and events originate in MongoDB. Loading, offline, partial-data, denied permission, missing driver contact and stale-location states handled gracefully. Do not preload expensive maps on home; lazy-load map when Track is opened.
- Mobile safe-area bottom tab bar, 44+px targets, 1–3 taps for parent daily actions; beautiful desktop centered layout. No dead CTA.

TEST: customer with none/pending/active/multiple students; on-screen quick actions reach intended destination; unrelated customer's data inaccessible. Reference screenshots at 360/390/768/1440. Stop.
```

## PROMPT 05 — SCHOOL SUBSCRIPTION REQUESTS, QUOTES, APPROVALS

```text
Implement /app/school, /app/school/apply, /owner/school/subscriptions and server subscription lifecycle. Match final HTML schoolPage(), schoolApply(), ownerSubscriptions() UI layout and forms.

CUSTOMER: create subscription request specifying school, area, pickup and return drop point, child count (no full student roster required yet), start preference, contact, optional notes. Show status/history and no misleading automatic approval.
OWNER: view/filter/search requests, check vehicle/route capacity, propose individual monthly fixed fee and approved child slots, approve/reject/pause/cancel with reason, send quote/status notification. A quotation acceptance and owner approval must be distinct authorized actions; never let customer self-approve.
AFTER APPROVAL: customer and owner can add students only up to approved eligible child count; subscription becomes active only when required child/profile/route assignment/start conditions hold. Owner can create request on phone-call customer's behalf, with audit.
DATA: subscription versions/fee agreement with effective dates, school, child capacity, approved slots, acceptance timestamp, history, owner notes, active/pause/cancel status. Atomic capacity reservation where possible; same customer can have multiple subscriptions.

TEST: request → quote → customer accepts → owner approves → add child permission; rejected/expired/wrong-customer access; capacity/duplicate cases; owner-assisted manual request. Screenshot both roles and all status states. Stop.
```

## PROMPT 06 — STUDENTS, GUARDIANS, PROFILE PRIVACY & ENROLLMENT

```text
Implement customer child pages (/app/school/children) and owner Students & Guardians (/owner/school/students), following final HTML childrenPage(), ownerStudents() and modals.

- Customer may add child only after authorized school subscription approval, within approved slots; owner can create child for approved subscription with appropriately recorded guardian relationship. Student name, class, school, pickup point, guardian contact, emergency contact as needed; protect sensitive fields.
- Owner reviews/approves student enrollment, assigns route/stop, service effective date, fee agreement; active tracking only once legitimately activated and assigned. Parent can request corrections to address/stop/fee via approval path; cannot reassign vehicle/fee unilaterally.
- Secure guardian links: one child may have multiple authorized guardians subject to consent/proof/owner review; avoid arbitrary ID-based linking. Multiple children per customer.
- Optional restricted student login only if guardian/owner enables it, after identity setup, with no self signup, no edit rights over attendance or finance.
- Owner can withdraw/deactivate/delete eligible student personal data with guarded confirmation; retention of past financial/safety events and link history as legally required. No cascade deletion of paid receipts or recorded journeys.

TEST: approved vs unapproved add-child, slot capacity, link/IDOR tests, activation, edit requests, owner-assisted enrollment, deactivate and visibility changes. Compare modal/form and child cards to HTML. Stop.
```

## PROMPT 07 — FLEET, DRIVERS, ROUTES, STOPS & AVAILABILITY

```text
Implement /owner/fleet and /owner/school/routes plus shared scheduling services. Inspect ownerFleet(), ownerRoutes(), driverToday(), final sidebar and forms.

- Vehicle CRUD (soft deactivate by default), type/registration/seats/cargo payload/allowed service categories, photos (safely stored), driver assignment, maintenance and documents/expiry reminders where applicable. Actual vehicle legal suitability must be checked by operator; app must not assign passenger-only vehicles to cargo service.
- Driver invite/create/profile, active/inactive, contact, vehicle qualifications, owner-as-driver capability. Drivers see assigned information only.
- School route schedules, stop order, morning/return sessions, school destination, assigned vehicle/driver, student-seat capacity, active weekdays/holidays and exception dates.
- Shared availability model across recurring school runs, bookings, maintenance blocks and driver duties. Server conflicts for vehicle+driver over real intervals, not hard-coded '7–9 AM' or demo vehicle ID. Date/timezone and travel buffers handled; owner may edit/reschedule to resolve conflicts, cannot force two simultaneous trips to be physically run by one vehicle.
- Calendar reflects confirmed assignments. Query/index efficient, pagination/search.

TEST: add vehicle/driver/route, assign students, capacity rejection, overlapping booking rejection, owner-as-driver, maintenance block, wrong-role accesses. Visual parity on desktop/mobile. Stop.
```

## PROMPT 08 — SCHOOL RUN ENGINE & DRIVER-CONFIRMED CHILD STATUS

```text
Implement real Morning and Afternoon school runs, statuses and per-child events; source visuals: final HTML driverRunPage(), ownerRoutes(), trackingPage() journey status cards.

- Owner or assigned driver can start scheduled run; atomic/idempotent run creation (one run per business/route/date/session). Driver sees only assigned route/student roster; owner sees operational oversight.
- Driver at safe stop explicitly marks morning boarded, reached school, afternoon return boarded, dropped home; missed pickup/owner-confirmed leave recorded with reason. Make sequence sensible and reject invalid duplicate/out-of-order updates with meaningful errors.
- Event append-only log with actor/time/run/child/action; current view derived from authoritative events. Do not use GPS geofence to claim child boarded/drop.
- Parent's customer dashboard updates via RTK Query scoped invalidation/refetch and clear timestamp; owner dashboard updates too. Notify relevant guardian(s) on real confirmed events.
- Owner correction through separate append-only correction action with visible original/corrected event, reason, actor. Cannot conceal boarding by overwriting leave.
- Driver controls large, safe-stop explanatory warning, poor-network retry + idempotency; never show confirmed on client before server acknowledges.

TEST: morning start → boarded → school reached → afternoon start → return boarded → home dropped; wrong driver, unrelated parent, double submit, retroactive absence, correction audit. Test UI at 360/390 and owner at 1440. Stop.
```

## PROMPT 09 — LEAVE REQUESTS: CUSTOMER, STUDENT, OWNER

```text
Implement final HTML leavePage(), ownerLeaves(), student restricted leave UI, and the actual leave approval/visibility lifecycle.

- Parent quick Mark Leave (Today/Tomorrow + choose child + optional reason); owner and assigned driver get appropriate visibility; request no retroactive contradiction with boarded trip. Parent can cancel before cutoff/actual run where allowed.
- Optional student can request leave but it remains pending until authorized guardian confirms; unconfirmed student request cannot silently remove student from pickup roster.
- Owner can record confirmed leave from a phone call on parent's behalf, approve/override/correct with required reason and audit. Driver sees skip/leave indication but cannot authoritatively rewrite guardian consent.
- Holidays and route cancellations reflected distinctly from individual absence. No automatic reduction of fixed monthly fee.
- Show intuitive status pills, notifications and history; avoid multiple forms for one tap if possible.

TEST: parent today/tomorrow leave, student pending guardian, duplicate/date conflict, cancellation, after-boarding rejection, owner call-in leave, driver roster visibility, permission tests. Stop.
```

## PROMPT 10 — REAL BEST-EFFORT LIVE GPS + SAFE FALLBACK

```text
Rebuild final HTML trackingPage(), mapSurface() visual shell and ownerLive() with genuine GPS. Do NOT use fake SVG position, gpsIndex, sample city coords or demo motion as live position.

- On assigned driver's *active* trip/run, explicitly request browser Geolocation API permission over HTTPS; start/stop/pause as applicable. Send validated location (latitude,longitude,accuracy,observedAt, trip/run ID) through authenticated API; server checks active assignment, freshness, bounds, rate limiting and identity.
- Secure minimal latest location, trip-scoped timestamps and optional limited retention history in MongoDB. Parent can only access their actively assigned school vehicle while authorized; customer only their booked active trip; owner sees all active business vehicles; driver only own assignments. No public tracking/IDOR.
- Use Leaflet map with legally available tiles when genuine point exists. Clear 'No location yet', 'GPS disabled', 'Last updated X ago', accuracy and STALE states; last known point never falsely styled LIVE. After run/booking ends revoke access and stop uploads.
- Foreground updates modest (e.g. 10–20s or meaningful movement), viewer RTK Query polling scoped to active visible track (e.g. 15–30s) and stop when off-screen/inactive. Avoid high-frequency universal polling/paid realtime dependencies.
- If browser is backgrounded/phone locked, explain native/background limits and show manual event timeline, Call Driver/Owner fallback. Owner sees service degradation status. Map tile/address/routing unavailable gives graceful labeled placeholder, not fake live route.
- Do not promise guaranteed ETA or emergency-level availability. Consider explicit data retention and consent.

TEST: real/mocked geolocation authorized send/read, permission denied, timeout, stale age, ended trip, wrong guardian/customer, offline retry, driver stop. Browser inspect at 390/1440. Stop.
```

## PROMPT 11 — REAL BOOKING WIZARD & HONEST DISTANCE/PRICE ESTIMATES

```text
Implement final HTML services picker, bookingFormPage(), bookingPage(), bookingDetail() aesthetics but replace sampleCities/sampleDistance with truthful fare logic and real backend contracts.

- Services: wedding/marriage, party/family, local/outstation, station/airport, eligible goods pickup. Urgent goes to separate /urgent public simplified screen.
- Multi-step forms: service → pickup/destination city/address or user-selected map position → date/time, duration, passengers/cargo, return/stops, special needs → estimate review → submit. Simple, not cluttered on low-end phones.
- Configurable business/vehicle rates: base, km, hourly, full-day, minimum, round trip rule, toll/parking, waiting, night and discount policy. Server creates estimate snapshot and responds with exact breakdown and *source* of distance.
- Routing provider adapter only if allowed/configured. If not configured or unavailable, show 'Estimate unavailable; owner will quote' and accept typed cities/addresses. Manual distance entry by owner if needed, labeled manual. Never reuse demo Lucknow-Kanpur lookup as production truth.
- No confirmation until owner quotation/approval and any agreed advance steps. Validate service/vehicle legal suitability, count/capacity, duplicate requests and safe times. Customer sees persisted booking history/status; owner receives request.

TEST: booking without school subscription, existing parent books wedding via SAME account, unknown city fallback, pricing min/round/hourly, goods eligibility, invalid date, server-side price tampering and mobile wizard layout. Stop.
```

## PROMPT 12 — OWNER QUOTES, CUSTOMER ACCEPTANCE, ADVANCE & BOOKING DISPATCH

```text
Implement /owner/bookings/requests, /owner/bookings, /owner/calendar and customer booking detail. Follow ownerBookings(), bookingDetail(), quoteBooking/editBooking/acceptQuote design and audit conventions.

- Owner reviews, accepts/rejects requests, sends versioned quotation (fare, extras, validity, advance fixed/%). Customer sees and accepts explicitly, or asks for revision; no auto-confirmation from estimated price.
- Booking lifecycle with authoritative transitions and timestamps; advance-required accepted booking remains Awaiting Advance until receipt is VERIFIED. Zero-advance or owner-waived requires explicit recorded reason/policy and authorizes next step.
- Owner selects eligible available vehicle and active driver, with real interval conflicts against recurring school duty, existing trips, maintenance and buffers. Compute conflict on backend, return informative solution (alternate time/vehicle) and do not bypass physics with override.
- Confirm booking, send notification/itinerary, allow owner-assisted phone booking, reschedule/cancel with auditable fees/refund obligations, maintain quote versions, customer history.
- Goods: manifest, sender/receiver, safe cargo category/capacity, pickup and delivery checkpoints, optional proof-of-delivery that respects file storage/permissions.
- Customer sees advances, due and assignment. Tracking is enabled only for an active assigned trip when the private-trip lifecycle exists in Prompt 16; until then, show a truthful unavailable state. Final invoice/receipt must not be marked paid until receipt is verified in Prompt 14.

TEST IN THIS PHASE: customer requests → owner quotes → customer accepts → advance-required booking waits without being confirmed; zero-advance or explicitly waived booking can be confirmed and assigned. Cover overlap rejection, quote revision, cancellation/refund obligations and wrong-owner/booking access. Add the pending-claim → owner-verification → advance-gate integration test in Prompt 14, then private-trip tracking test in Prompt 16. Stop.
```

## PROMPT 13 — PUBLIC CALL-FIRST URGENT TRANSPORT REQUEST

```text
Recreate final HTML urgentPage() and implement backend, owner triage queue and optional driver assignment. This is URGENT PASSENGER transport, NOT a guaranteed ambulance service.

- Anonymous mobile visitor can reach /urgent without login and immediately see configured Call Operator and official regional emergency/ambulance contact guidance. Make 'Call official emergency services' prominent for medical emergency; ordinary SafeRide does not substitute for ambulance.
- Optional tiny call-back/request form: pickup address or browser geolocation if permitted, contact phone, optional destination/note. NO mandatory login, distance calculator, long booking wizard or advance deposit. Request must not claim owner is responding until accepted.
- Server-side validation, rate limiting, abuse prevention, minimal sensitive data and retention, ack that says 'Request received; no guaranteed response', notifications to owner dashboard.
- Owner can view/accept/decline/contact, choose suitable vehicle/driver, create appropriate follow-up trip if operationally viable; status timestamps, visible callback queue; unmet request cannot silently remain 'driver coming'.
- Browser location denied/offline fallbacks, call-first, large buttons at 320/390px.

TEST: anonymous request, rate limit, owner queue, owner accept/decline, disabled configured number, medical warning, no advance requirement. Stop.
```

## PROMPT 14 — UNIFIED PAYMENT CLAIMS + OWNER VERIFICATION (NO GATEWAY)

```text
Implement customer /app/payments and owner /owner/finance/verify; match final HTML paymentPage(), ownerVerify(), payment modals and status UI. DO NOT introduce any payment gateway, fake UPI processing or auto-bank verification.

- Owner settings define valid UPI ID/QR, cash/bank transfer instructions; show safely to authenticated customer. Customer may pay outside app then submit I HAVE PAID with target (booking advance/final or school fee), amount/date/method/reference and OPTIONAL proof via safe file storage only if configured.
- Claim is PENDING VERIFICATION and must not reduce authoritative due/advance or count as received. Owner verifies actual bank/cash receipt and records verifiedBy/time; or rejects with reason. Owner can record cash/UPI received offline for customer after confirming real receipt.
- Idempotency keys, dedupe review flag for repeated UTR/date/amount, no duplicate verification, audit log. Verified payment immutable; correction/refund via separate authorized reversal/adjustment record, not stealth edit/delete.
- Payment allocations for multiple months or booking charges; clear unallocated credit/advance and remaining due; no negative balance errors. Money integer paise, bank references as strings, precise ₹ format.
- On verification, update booking advance gate and school fee statements via server-owned calculations; RTK Query specific tags invalidate affected views, not whole app.
- PDF/print receipt only for verified collection, pending claim acknowledgment clearly not a receipt of funds. Owner payment verification queue has search/filter/status/count and drill-down.

TEST: customer UPI claim pending NOT counted → owner verify → correct allocations/receipt → no duplicate; owner Cash record, reject, refund/adjust, unrelated customer cannot view claims, invalid/negative amount. Stop.
```

## PROMPT 15 — SCHOOL MONTHLY FEES, ADVANCES, REMINDERS, STATEMENTS

```text
Build reliable fixed school fee accounting and owner /owner/finance/fees + customer fee summary; use final HTML ownerFees() and monthly fee card aesthetics.

- Per-student signed/accepted monthly fixed fee agreement (effective date; version on changes), due day, month/year ledger, opening/closing/proration policy explicitly configured (no implicit proration or fee changes).
- Monthly charge generation is idempotent with unique student+period+agreement semantics. No duplicate bill on restart, retry, multiple visits. Absence does not automatically reduce fixed monthly fee.
- Show billed/verified collected/pending claims/outstanding/credit and previous dues separately, with partial payments, advances and months allocation, waiver/discount by audited owner action, refunds as compensating entries. Parent can see children individually and household total without losing per-student records.
- Both parent customer AND optional student account receive configured lead-time monthly due reminders in-app, with deduped reminder keys, preferences and createdAt; do not rely on a permanently running Render free background worker.
- Implement protected, idempotent scheduled HTTP job endpoint triggered by configured external scheduler (or free suitable scheduler if allowed) AND safe catch-up on relevant access, with a documented reliability limitation. No Redis/cron daemon dependency. No claim of guaranteed SMS/email delivery.
- Real month selector, receipts, statements, owner filters and export.

TEST: 2 siblings different fees, partial/advance, previous dues, multiple payment claims, duplicate reminder run, mid-month start policy, owner fee adjustment with audit, pause/cancel impact, unauthorized view. Stop.
```

## PROMPT 16 — DRIVER MOBILE: SCHOOL & PRIVATE TRIPS

```text
Complete driver screens from final HTML driverToday(), driverRunPage(), driverTripsPage(), driverMore() with production data, strict driver assignment and mobile-first UI.

- Driver My Day shows assigned morning/afternoon school duties and wedding/party/outstation/goods/urgent jobs in chronological order; vehicle, route summary, contact, availability, GPS permission state, big safe-stop actions.
- School roster uses authoritative run engine from Prompt 08; proper morning/return events, notices and incident reporting; parent contact only for assigned student and only necessary fields.
- Private trip: start → reached pickup → passenger/goods picked up → in transit → destination → completed; owner/customer status and tracking are synchronized. Optional odometer, actual additional charges proposed for owner approval (driver cannot alter agreed fare/verified money).
- Driver can notify delay/breakdown and request owner help, cannot see full business customer lists or finance. Call number only if configured.
- Proper authorization checks when assignment revoked/reassigned mid-trip, prevent simultaneous incompatible active trips, idempotent button taps; no use while vehicle moving (safety guidance).
- GPS start/stop tied to active authorized trip and visibly labeled foreground-only limitation.

TEST: driver sees only assigned, school lifecycle, private trip lifecycle, revoked assignment, double tap, offline/permission denied, large 360px controls and no scrolling traps. Stop.
```

## PROMPT 17 — NOTICES, NOTIFICATIONS, CONTACT & OWNER ENQUIRIES

```text
Implement real in-app notifications across all roles and owner /owner/notifications. Match final HTML noticeList(), noticesPage(), ownerNotifications(), contactPage() tone and layouts.

- Notifications: enrollment request/quoted/approved/activated, leave request/confirmation, student pickup/drop, trip delay, booking request/quote/accepted/confirmed, advance reported/verified/rejected, dues reminder, refund, urgent callback and operator notices.
- Store recipients and scope by userId/businessId; delivered/seen/read state; correct unread count and pagination; no leakage of names/addresses/payment details to other customers.
- Owner sends school-wide or selected-route notices, passenger booking notices, holiday/late-run notices; owner views contact enquiries/urgent requests and marks handled.
- Contact UI with real configured Call/WhatsApp only on explicit tap; manual fallback if contact not configured. Optional browser push behind permission and feature detection; never claim it works on all phones/background states. SMS/automatic WhatsApp not mandatory.
- Rate limits on public contact; neutral privacy-safe errors.

TEST: recipients, customer data isolation, notification count/invalidation, mark-read, duplicate event suppression, owner notice, contact/WhatsApp disabled logic. Stop.
```

## PROMPT 18 — OWNER DASHBOARD, LIVE OPERATIONS, CALENDAR, CUSTOMER DIRECTORY

```text
Deliver fully populated (or honestly empty) owner workspace using final HTML ownerDashboard(), ownerLive(), ownerCalendar(), ownerCustomers() and responsive sidebar/topbar as the exact design reference.

- KPI definitions documented: active students, upcoming confirmed bookings, bookings needing action, verified collections, pending claims, school outstanding, advances received/unallocated, active vehicles/trips. Never mix pending UPI claims with received money.
- Today school run status and latest events, active GPS freshness map, upcoming booking cards, urgent triage, fees and payment verification, alerts and quick actions. Source counts from MongoDB aggregations with proper business filters.
- Calendar combines recurring school duties, private bookings, driver/vehicle availability, maintenance. Highlight conflicts and give owner resolution actions; no hardcoded school hours or invented utilization.
- Customer directory: searchable/paginated account details, school relationship, bookings, total dues, context actions and privacy rules; owner-assisted new booking/subscription/record-payment.
- Dense but calm desktop cards, mobile condensed tabs/quick actions; no huge empty cards or horizontal overflow.

TEST: state transition updates KPI accurately, role 403, active/stale GPS, upcoming date filters, cold DB empty state, actual browser at 390,768,1440. Stop.
```

## PROMPT 19 — EXPENSES, COMPLETE BOOKKEEPING, INVOICES & REPORTS

```text
Implement /owner/finance/expenses, /owner/finance/advances, /owner/reports and full printable documents. Visual source ownerExpenses(), ownerAdvances(), ownerReports() and final HTML print style.

- Expense CRUD with audit, category Fuel/Toll/Parking/Maintenance/Driver/Other, related vehicle/booking/trip, date, amount, paid method, proof optional. Expose meaningful cash vs revenue vs collected vs outstanding distinction.
- Service-wise collections for school, wedding/party, private/outstation, goods and urgent completed trips. Booking advances and final balance by booking, verified receipts, refunds, school monthly balance and expenses.
- Reports: daily pickup/drop, attendance/leave, fee collection, outstanding, booking register/status, advance verification, revenue by service/vehicle/time, customer ledger, expenses and estimated profit, vehicle utilization and driver activity, notifications and audit. Date/month/search/driver/vehicle/status filters; true server-side pagination for lists.
- Print-friendly school receipt/statement, quotation, booking confirmation, transport invoice, general payment receipt, goods challan/proof of delivery, expense summaries. Generate PDF/print when actually supported; secure CSV export with formula-injection protection, access checks and current filters.
- Sequential document numbers per business, tax invoice terminology only when legally valid and configured. Refund/adjustment/credit kept in accounting with immutable history. No fake chart values or lost previous dues.

TEST: ledger totals reconciliation, advance vs final, refunds, multiple payment allocation, CSV filters, print layout, unrelated user cannot export protected data, no fee duplication. Stop.
```

## PROMPT 20 — OWNER POWER ACTIONS, ACCOUNT DELETION & IMMUTABLE AUDIT

```text
Implement final HTML ownerSettings(), ownerUsers(), relevant modals, and production-grade owner override controls. This operator needs MAXIMUM operational control without erasing truth or violating privacy.

- Business settings: public name/logo/phones/WhatsApp/service areas, UPI QR/ID/bank instructions, school due/reminder policy, price-per-km/base/hour/day/vehicle, cancellation/advance/refund policies, GPS freshness and retention, language preference, public homepage data.
- Owner can create/edit/deactivate customers, create/invite/revoke drivers, create/edit/deactivate students and guardian links, approve/cancel subscriptions and bookings, adjust fees/prices, correct attendance, change route/vehicle and record verified money. All mutations independently authorized and scoped to business.
- For sensitive overrides, show original → proposed change → financial/safety/assignment impact → required reason → Confirm Override. Server creates append-only audit with actor/time/old/new/reference; no silently erasing earlier payments/run events/GPS claims.
- Account Deactivate immediately revokes sessions and access; Account Delete follows controlled workflow: disallow deletion of last owner, handle active trips/subscriptions, remove eligible personal fields or anonymize per policy and retain legitimately required financial/safety records. No naive cascade deleting paid invoices/audits.
- Strong confirmation for cancellation, full refund and deletion. No 'force double booking' override without actually changing conflicting schedule; no fake bank or GPS state creation.

TEST: owner powers work through DB, non-owner cannot access admin APIs, audit append-only, deleted user's session revoked, money preserved/reversed, correction visible, last owner protected, cross-business scope protected. Stop.
```

## PROMPT 21 — END-TO-END PREMIUM UI FIDELITY, LOW-END AND ACCESSIBILITY

```text
Treat final standalone HTML as an actual UI benchmark. Do a comprehensive route-by-route visual/functional QA pass, not merely unit tests. Compare /, login, /app/home school-active and no-school, subscription, child add, trip booking, payment claims, owner dashboard, owner queues/finance/tables, driver today/run, public urgent, and tracking in Chromium.

At desktop 1440/1366/1024, tablet 768 and phones 390/360/320:
- Preserve branded white/blue panels, rounded cards, gradients, vehicle artwork, strong primary CTA, visual status pills, empty/success states, quick-action prominence and mobile bottom nav. Never show demo preview role switcher/public portals, fake JSON, API health banners or fake GPS.
- Ensure no page-level horizontal overflow, menus open/close and lock backdrop scroll, popovers fit, tables usable (mobile cards or clearly scrollable), modal controls in view, sticky footer/CTA not covering content; all font sizes legible and min tap targets.
- Test in-page navigation, back/forward, reloading nested URL, keyboard/tab/ESC, ARIA labels, 4.5:1 standard text contrast, prefers-reduced-motion, errors/validation and skeleton/offline states. Remove generic UI components that do not match final simulation.
- Fix all invisible buttons, dead CTAs, inconsistent classes, clipping, empty ghost controls and fragile image links. Parent daily actions within 1–3 taps.
- Update docs/UI_PARITY_MATRIX.md with screenshot locations, remaining deviations and intentional differences. No claim of exact visual fidelity without screenshot evidence.

DON'T just report issues—fix them now and rerun checks. Stop when documented and verified or clearly mark blockers.
```

## PROMPT 22 — SERVER EFFICIENCY, MONGODB INDEXES, RTK QUERY & RESILIENCE

```text
Optimize the real application for low-cost hosting without Redis, Docker, SQL, paid infrastructure, continuous background worker, mandatory WebSockets or load balancer.

- RTK Query: one central API; feature endpoint injection; precise providesTags/invalidatesTags for Student/Subscription/Run/Booking/Payment/Vehicle/Notification/Report; `refetchOnFocus`/reconnect, skip unused queries, polling only active visible tracking/run; clear user-scoped cached data on logout. Demonstrate cross-role changes without full-page reload.
- MongoDB: compound indexes for business+role/guardian, student+subscription, route+date+session, vehicle+time blocks, booking+status+date, customer+booking, payment+source+target/period/status, notification+recipient+readAt and reminder uniqueness. Inspect actual query patterns and `explain()`; avoid excessive indexes and unbounded scan.
- Server-side pagination/filter/sort allowlists; lean()/projections, aggregation where appropriate, sensible connection pooling, idempotency constraints and duplicate protection; security for query operators/regex. Avoid reading whole collections into JS for KPI.
- Graceful Mongo/API loss: show usable offline/error states, last received event timestamp not live claim, retry/backoff, no lost or duplicate confirmed safety/money mutations; pending claims only after server receipt. UI map lazy-loaded, code split, responsive assets.
- Scheduled reminders: protected idempotent HTTP job + on-access catch-up, no dependency on persistent always-on Render Free process; explicit delivery-latency disclosure.
- Performance budgets documented from actual measurements, no arbitrary '0ms' promises. Keep sensitive caches memory-only.

TEST: network throttling, 500/401, duplicate request, 10x seeded data, query behavior/index evidence, UI React profiler/bundle report where tools permit. Stop.
```

## PROMPT 23 — FULL CROSS-ROLE E2E ACCEPTANCE / SECURITY / REGRESSION

```text
This is NOT a code scaffolding task. Start real frontend, Express and a real Mongo test database (or mongodb-memory-server for a clean test), authenticate separate seeded identities, and execute complete E2E flows in Chromium/Playwright. No silent mocks for server/data integration. Seeded names/phones must be obviously fictitious and in development only.

MANDATORY WORKFLOWS:
A. New self-signup customer → home with services/no empty child card → school request → owner quotation/approval → customer accepts → adds student(s) within slots → owner assigns route/vehicle/driver → active child card; guardian-child privacy tested.
B. Driver starts morning → marks student boarded/school arrived → customer sees timeline and notifications → afternoon return → home drop → owner corrections require reason and preserve original.
C. Parent creates leave; student-initiated leave needs guardian confirmation; attempt leave after boarding rejected; fixed fee unaffected.
D. Active run real GPS mock upload by assigned driver → authorized customer/owner sees fresh point → wrong customer denied → stale/offline/permission denied clear → completed run stops tracking.
E. Same parent/customer books wedding → typed city/route estimate truthfully sourced or unavailable → owner quotes → customer accepts → customer reports UPI advance → Pending not counted → owner verifies → booking confirmed/assigned, conflict-free → driver completes → final balance + receipt/invoice; owner dashboard totals reconcile.
F. Goods booking eligible vehicle only and delivery proof; unsuitable vehicle denied.
G. Public urgent no-login call-first request → owner queue; no advance or required price wizard; medical-service disclaimer present; no false dispatch promise.
H. Owner self/manual actions, offline phone booking/cash payment, revoke driver, delete/deactivate user, audit history and retained financial evidence.
I. Cross-user IDOR, owner-only 403, rate limit, CSRF, session revocation, double-payment/idempotency and duplicate booking/route conflicts.
J. Desktop and mobile visual checks versus final HTML for all main pages and 320/360/390/768/1024/1440 widths; no console errors/overflows/broken buttons.

DELIVER: docs/E2E_RELEASE_REPORT.md with command run, database used (no secret), endpoints, screenshots, proof of before/after DB state, pass/fail table, defects fixed and rerun, outstanding severity. Do not say PRODUCTION READY if critical tests fail or real tracking reliability is not suitable. Stop.
```

## PROMPT 24 — ECONOMICAL DEPLOYMENT, BACKUPS, PRIVACY & RELEASE GATE

```text
Prepare deployment of the verified MERN app with real operational constraints. Do not invent pricing/hosting availability. Target Vercel frontend + Render Express + MongoDB Atlas for trial if compatible with plan rules; document an alternative commercially compliant paid/single-origin deployment for business use.

- Environment schema, secret rotation, safe initial owner bootstrap, CORS/cookie/reverse proxy same-origin /api, CSRF/origin, HTTPS, host checks, production build routing, service health/readiness, start/restart behavior, Mongo indexes migration/backup/restore plan, data export and domain ownership.
- Vercel Hobby may have non-commercial restrictions; Render free can sleep and cannot guarantee always-on timely updates. Do not represent this as safety-critical live school tracking or a financially reliable always-on product until suitable hosting, alerting and device/location constraints are addressed.
- Durable persistent MongoDB; do not store proof files on ephemeral Render disk. Use provider compatible object storage only when configured, otherwise disable uploads with clear explanation. Retention and deletion policy for children, addresses, location histories and receipts.
- Production logging redacted, auditing, monitoring/health status, routine backups, indexes and rollback instructions, configured real owner phones, UPI details, valid service/vehicle permits, privacy/T&C/consent notices; no demo passwords/preview toggles or seeded data in production.
- Smoke test production-like instance, login/session cookie, sign up, school/booking/payment state, one GPS update in foreground, alerts and stale state; verify public urgent phone and medical warning. Document known non-guarantees and exact minimum production hosting expectations.

DELIVER: deployment guide, env examples, runbook, production readiness checklist and final release decision VERIFIED / NOT VERIFIED with evidence. Do not deploy to paid services or take irreversible external actions without explicit owner authorization. Stop.
```

---

# 4. COMPLETE ACCEPTANCE CHECKLIST — RELEASE CANNOT SKIP

Every feature below must work as a complete system and be marked pass/fail in `docs/FEATURE_ACCEPTANCE_MATRIX.md`:

### Public + account
- [ ] Final simulation-compatible public page, with real services and **NO public role cards**.
- [ ] Exactly ONE login page, self-signup Customer and secure Owner/Driver/Student provisioning.
- [ ] Customer/Parent ONE identity, all services accessible from ONE dashboard.
- [ ] Public urgent call-first flow without login or mandatory advance.
- [ ] Real contact/enquiry and optional configured WhatsApp/call links.

### School + parents + driver
- [ ] Customer subscription request, owner quote/approval, parent acceptance.
- [ ] **Student creation only after approved subscription** by customer or owner, within slots and with guardian linking.
- [ ] Owner final route/vehicle/driver activation, capacity/conflict protections.
- [ ] Driver school duty with four explicit confirmed milestones and event history.
- [ ] Parent Call Driver, Track Vehicle, Mark Leave in 1–3 taps.
- [ ] Student leave needs guardian confirmation; owner phone-call leave supported.
- [ ] Real GPS only with active authorized driver session + fresh/stale fallback and no fake map coordinates.
- [ ] Fixed monthly school fee, due reminders, partial/advance/arrears and receipts.

### General bookings + dispatch
- [ ] Wedding, party, family, local/outstation, airport/station and legally eligible goods.
- [ ] Booking wizard with pickup/destination/time/vehicle/service + honest price estimate.
- [ ] Owner quotation, customer acceptance, advance policy, verification gate and confirmed assignment.
- [ ] Scheduling prevents school-duty/vehicle/driver overlap and ineligible cargo assignments.
- [ ] Customer and driver trip lifecycle, optional goods delivery confirmation and owner completion/settlement.
- [ ] Owner-assisted phone/offline bookings, reschedule/cancel/refund with audit.

### Finance + admin
- [ ] Manual UPI/cash/bank **direct to owner**; no gateway.
- [ ] Customer claim remains pending until owner checks and verifies.
- [ ] Booking advances and final due, school fees, expenses, refunds and reports reconcile.
- [ ] Owner dashboard shows real database totals, not sample/demo values.
- [ ] Owners can create/edit/deactivate/eligible-delete and apply reasoned audited overrides.
- [ ] Print/export of authoritative receipts/quotes/invoices/reports; secure CSV.

### Technical + UX
- [ ] All server state via Redux Toolkit + RTK Query; no competing cache.
- [ ] Express/Mongoose MongoDB authenticated APIs, indexes, pagination, idempotent sensitive operations.
- [ ] Role/guardian/customer/driver scope verified server-side, sessions revoked on deactivation.
- [ ] Final HTML visual parity for PUBLIC/CUSTOMER/OWNER/DRIVER/STUDENT at desktop/tablet/mobile.
- [ ] No dead buttons, generic scaffold, invisible CTAs, 320px overflow or fake real-time success.
- [ ] Code runs without Docker/Redis/SQL/TanStack Query, with documented low-cost deployment limitations.
- [ ] Full Playwright cross-role E2E and security report with actual pass/fail evidence.

---

# 5. MASTER KICKOFF MESSAGE — SEND THIS TO CODEX FIRST

```text
I need the COMPLETE, genuinely working SafeRide MERN transport management software, not a UI mockup.

The FINAL visual and interaction source of truth is the file:
  SafeRide_Complete_Interactive_UI_Simulation.html

The detailed UX/product source is:
  SafeRide_Complete_Premium_UI_UX_Blueprint.md

The authoritative implementation plan is:
  SafeRide_Final_Simulation_To_Working_MERN_Codex_Prompts.md

Read all three, then inspect every relevant existing repository file. Do not rebuild in a new nested folder. Keep previous work that is functional and secure. Treat previous prompt packs as outdated where they conflict with this final reference.

ONE CUSTOMER/PARENT account and dashboard; self-signup; approved school subscription then add children; owner-admin full audited management; weddings/parties/private/outstation/goods/urgent bookings; owner quotes and verified advances; direct manual UPI/Cash/Bank school and booking payments; real driver-confirmed pickup/drop; best-effort authorized live GPS with truthful stale/unavailable fallback; attractive, exactly referenced premium customer/owner/driver UI.

MANDATORY STACK: React + TypeScript + Vite, Redux Toolkit + RTK Query (EXCLUSIVE server-state cache), Express + TypeScript, MongoDB/Mongoose, Tailwind/shadcn-themed UI, React Router, Zod. No Redis, Docker, SQL, TanStack Query, payment gateway or mandatory paid external services.

Inspect the real repository and the acceptance matrix to identify the earliest incomplete phase. Audit/reconcile the code before changing it, then execute ONLY that phase. Do not repeat completed phases or claim completion from screenshots alone. Give precise test and browser evidence, then STOP. I will ask you to execute the following prompt afterwards.
```

For a repository known to contain **only** the blueprint/simulation/prompt files and no source code, use this alternative after the agent confirms that by inspecting the actual root:

```text
Read the FINAL HTML simulation, Premium UI/UX Blueprint and Master Prompt Pack. Verify this repository is actually uninitialized. Execute PROMPT 00 then PROMPT 01 to build the real working MERN foundation in this SAME folder, including the design system. Do not create a nested folder. Run dev/build/typecheck and visually inspect both desktop and mobile. Stop after Prompt 01 and report test evidence.
```

# 6. TEMPLATE FOR EACH NEXT CODEX PHASE

```text
Continue SafeRide in this existing repository. Read AGENTS.md, docs/UI_PARITY_MATRIX.md, the source-of-truth HTML simulation, the Premium UI/UX Blueprint, and SafeRide_Final_Simulation_To_Working_MERN_Codex_Prompts.md.

EXECUTE PROMPT NN ONLY.

Do not break any working modules or reduce UI fidelity. Implement actual React → RTK Query → Express → MongoDB behavior. Compare the current React UI with the FINAL interactive HTML reference at desktop and mobile. Verify all buttons, authorizations, error/empty states and database writes. Run and report tests and screenshots with genuine results, fix failures, update parity matrix. Do not claim completion for untested features. STOP after this prompt.
```

---

# 7. FINAL RELEASE RULE

**SafeRide is not complete merely because its screens resemble the simulation.** It is complete only when a real customer registers, buys school transport through owner approval, adds a child, sees actual driver-confirmed events and honest tracking; that SAME customer books another service, sees a truthful estimate/owner quote, reports an advance, the owner verifies money, assigns a non-conflicting eligible vehicle, the driver completes the trip and both users see accurate statements; the owner can manage staff/vehicles/bookings/fees/expenses/users through a polished admin interface, with every sensitive correction audited and every role's access enforced by the Express API.

**The supplied final HTML dictates the look and intended clicks. MongoDB and authenticated Express endpoints dictate the truth. RTK Query mediates all server state.**
