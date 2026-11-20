# SAFERIDE — COMPLETE WORKING MERN TRANSPORT MANAGEMENT SOFTWARE
## FINAL CODEX / CODING-AGENT MASTER PROMPT PACK

**Source of truth:** `SafeRide_Complete_Premium_UI_UX_Blueprint.md` in the repository root.
**Visual reference:** `SafeRide_Kids_Interactive_Simulation.html` (or one matching versioned file) in the root, when available.
**Product:** One transport operator with many vehicles/drivers; one customer account for both parent and ordinary booking user; optional restricted student access; owner and driver workspaces.
**Delivery requirement:** Real working React + Express + MongoDB software, NOT a static prototype, not screenshots-only, and not a UI with dead buttons.
**Scope:** School transport + wedding/party/private/outstation bookings + eligible goods transport + urgent passenger requests + live GPS when available + manual UPI/cash/bank payment verification + owner-controlled business operations.

---

# HOW TO RUN THIS PACK

1. Place THIS file and `SafeRide_Complete_Premium_UI_UX_Blueprint.md` in the actual VS Code project root. If the original HTML simulation is available, keep it there, read-only.
2. For the **first Codex task**, execute **PROMPT 00 (short audit) AND PROMPT 01 (runnable code foundation)** in that order, so the first task results in real running software rather than documentation only. Stop after Prompt 01 with tests and screenshots. Then issue PROMPT 02, 03, etc. one at a time. If a stage is already implemented, the agent must audit/test it and fill gaps rather than delete/rebuild it.
3. All later stages inherit the **GLOBAL INSTRUCTIONS** below, the blueprint, and `AGENTS.md` after it is aligned. A fresh agent session must first read all three.
4. The latest VS Code screenshot appeared to show only the blueprint in the Explorer, while earlier screenshots showed a monorepo. **Do not assume either state. Inspect the actual root.** If code is present, preserve it; if not, scaffold inside this folder. Do NOT ask the user to create another project.
5. UI should improve upon the reference with a premium aesthetic, but the **blueprint is authoritative for workflows and navigation**. Never copy demo-only role-selection cards or fake data from the HTML.
6. At the end of each stage, **stop** and report: files changed; APIs/migrations/indexes; screenshots and routes verified; commands and actual outcomes; real end-to-end user flow; unverified items; exact next phase. Do not assert a feature works if it has not been exercised.
7. Important: these prompts represent target requirements. The agent's completion report must clearly distinguish implemented/verified from pending. No time estimate and no placeholder claims.

---

# GLOBAL INSTRUCTIONS — MANDATORY IN EVERY PHASE

You are the lead full-stack MERN engineer, product architect, UX designer, security engineer, database engineer and QA lead for **SafeRide** (school program: **SafeRide Kids**).

## A. NON-NEGOTIABLE TECHNOLOGY
- Frontend: **React + TypeScript + Vite**, React Router, Tailwind CSS, customized shadcn/ui-style accessible components, React Hook Form + Zod, Lucide icons.
- App/client state: **Redux Toolkit + React Redux**. API/server state, all fetching/mutations/caching/invalidation/polling: **RTK Query exclusively** (`createApi`, `fetchBaseQuery`, `injectEndpoints`, `providesTags`, `invalidatesTags`, `setupListeners`).
- Backend: **Node.js + Express + TypeScript**, REST APIs, Mongoose, **MongoDB** (Atlas or local MongoDB).
- Maps: React Leaflet/Leaflet + a policy-compliant OpenStreetMap-compatible tile provider; use browser Geolocation API with HTTPS and permission. Do not require paid map/tracking APIs.
- Testing: Vitest/Jest, Supertest, Playwright/Chromium where available, `mongodb-memory-server` with a replica set if transactions are used (no Docker).
- Workspace: npm workspaces; feature-based modular monolith; can use `apps/web`, `apps/api`, `packages/shared` if already present or create them if missing.
- **ABSOLUTELY NO Redis. NO Docker. NO SQL databases or SQL ORM. NO TanStack Query/React Query, SWR, Apollo normalized server cache, Zustand, MobX or competing caching library. NO BullMQ, Kafka, RabbitMQ, Kubernetes, load balancers, or expensive required SaaS.**
- **NO payment gateway**, no automatic UPI verification, no assumed paid SMS/WhatsApp API. Customer pays **directly to owner** using external UPI, cash, or bank; money is verified manually.
- Optimize for economical hosting and a single Express instance with MongoDB as the authoritative data store. No essential process-level timer, queue or in-memory state as the only truth.

## B. PRODUCT IDENTITY & SCOPE
- **Exactly one operator/business installation for v1**, configurable business identity and many vehicles/drivers. Internal `businessId` boundaries may be used to permit future expansion. Not a public multi-owner marketplace and not a SaaS subscription platform.
- **One CUSTOMER identity**: a school guardian is the same account type as a wedding/private/goods booking customer. No separate Parent login, Parent role cards, or Parent dashboard. A user may use both services concurrently.
- **Only ONE `/login` form and ONE customer `/signup` flow**. Do not ask user to choose role at login. Backend-authenticated permissions determine destination: CUSTOMER `/app/home`, OWNER `/owner/dashboard`, DRIVER `/driver/today`, optional STUDENT `/student/home`.
- Customers may sign up independently. Driver accounts are owner-created/invited. Owner created via secure bootstrap, NOT public signup. A student cannot public-signup; a guardian or owner may create/enable an optional student identity only for an approved linked school enrollment.
- School subscription applications collect school/pickup/return area and number of children FIRST, without collecting a whole child dossier. Once owner reviews capacity and approves the terms, guardian or owner adds child record(s) within approved capacity; owner finalizes assignment and activates service. Never expose another guardian's child.
- Owner has full business management controls, including **audited corrections and overrides**, account deactivation and eligible deletion/anonymization. Never allow forging money received, GPS points, or historical safety events; never permit physically impossible vehicle double dispatch.
- One customer dashboard has school subscription and general bookings; parent daily key actions **CALL DRIVER / TRACK VEHICLE / MARK LEAVE** appear at the top if school service is active.
- Bookings NOW include Wedding/Event, Party/Private, Local/Outstation, Airport/Station, eligible Goods/Pickup, and urgent passenger requests. This **overrides all older prompts saying wedding/goods/emergency are out of scope**. Earlier prompt packs are historical only.
- Urgent public path `/urgent` is call-first, minimal, no signup or advance required to access help. Ordinary vehicles are NOT ambulances. If user indicates a medical emergency, prominently direct them to official emergency/ambulance services and do not imply clinical capability or guaranteed response. Only offer medical transport as such with real authorization/capability and appropriate compliance.

## C. STRICT UI/UX CONTRACT FROM THE BLUEPRINT
The agent MUST read `SafeRide_Complete_Premium_UI_UX_Blueprint.md` in full before design work. If available inspect role-specific CSS/screens in `SafeRide_Kids_Interactive_Simulation.html` only as style reference.
- Brand color `#125FD4`, hover `#0B4FAE`; navy `#142544`; page `#F5F8FD`; white cards; text `#202E45`; muted `#60728A`; border `#E6EAF2`; success `#0E9561`; amber `#9A6700`; danger `#CE4054`. Semantic tokens centralized; WCAG AA contrast.
- Warm blue-white, soft 18–24px rounded cards, gentle shadow, purposeful hierarchy, real/authorized Eeco artwork as fallback, restrained motion; professional, not a generic empty CRUD scaffold.
- Public header: Home, Our Services, Vehicles, How It Works, Contact, ONE Login; no public role cards, API health/debug banner, demo role picker or `Explore Owner Dashboard`.
- Mobile customer header+bottom nav **Home | Bookings | Payments | Account**. If active school subscription, My Child's Ride plus **Call Driver**, **Track Vehicle**, **Mark Leave** above the fold. If none, show service-entry CTAs instead of empty child data.
- Owner desktop: ~252px grouped sidebar, sticky topbar, dense useful card/table dashboard, owner mobile drawer plus quick tabs. Owner navigation: Overview [Dashboard, Live Operations, Calendar]; School [Subscriptions, Students & Guardians, Routes & School Runs, Leave Requests]; Bookings [Requests & Quotes, All Bookings, Customers]; Money [Payment Verification, School Fees, Advances & Invoices, Expenses, Reports]; Fleet & System [Vehicles & Drivers, Notifications & Enquiries, Settings, Users & Audit].
- Driver: large safe-stop controls, My Day/Live Trip/More, no finance.
- Urgent page: conspicuous Call Now and appropriate medical emergency guidance; minimal request. Don't require destination/fare estimate/upfront advance.
- Support low-cost Android phones, slower connectivity, legible basic Hindi/English labels, mobile widths 320/360/390px, desktop 768/1024/1366/1440px; no horizontal clipping, invisible CTAs, dead controls or giant blank content.
- All states: loading/skeleton, empty, pending, invalid form, offline, failure, stale GPS, unauthorized, confirmation, success. Buttons act or truthfully explain why disabled; do not fake outcomes.

## D. ARCHITECTURE AND SECURITY
- Read repo/git status first; avoid destructively replacing working code. Reuse existing shared contracts and functions when correct. One versioned REST API (`/api/v1`). Route/controller/service/model separation, Zod DTO validation on both client/server.
- Same-origin `/api` reverse-proxy strategy in dev and production where feasible. Secure HttpOnly session cookies, CSRF and origin validation, password hash Argon2id/bcrypt, session expiry/revocation, rate-limited signup/login/reset, no JWT in localStorage, safe production cookie settings and proxy trust.
- Enforce authorization on EVERY API: server uses identity from session, not trusted `businessId`/`role`/`studentId` submitted by browser. CUSTOMER sees only their own bookings, school requests, invoices, linked children, assigned active vehicle; DRIVER sees only their duties and minimal assigned contacts; STUDENT only self; OWNER within their business.
- Signup with mobile number plus password must NOT be treated as verified mobile identity merely because it is entered. Avoid auto-linking existing children/records by unverified phone number. Document trusted verification/owner approval process and non-paid recovery route if email/SMS provider not configured.
- Keep secrets in env, never in git. Sensitive student addresses/contact and GPS must not be publicly indexed or logged. Data retention and deletion policy; audit log with original/updated state metadata and reason for overrides. Avoid storing raw children's data or GPS in browser persistent storage/service-worker caches.
- Money as integer paise and INR; immutable verified transactions with compensating reversal/adjustment, idempotency keys, correct partial/advance allocation; no deleting receipts to hide payment history; when changing agreement rate use effective date and adjustment entry.
- Mongoose indexes based on actual reads (`businessId+status/date`, customerId+createdAt, guardianId/studentId, routeId+date+session, vehicleId+time overlap, bookingId+status, recipientId+readAt, payment claim status, fee period unique, etc.). Pagination/filter/sort allowlists, lean/projection on read paths, avoid N+1, maintain appropriate connection pooling, don't create indexes blindly each production startup.
- MongoDB operations requiring atomic multi-document writes use replica-set transactions if supported, otherwise a properly documented atomic/idempotent strategy. Tests must verify retry/double submit behavior.
- Use RTK Query memory cache with granular tags and invalidation. Reset API cache on logout/account change. Poll only active live-trip/tracking contexts at practical intervals (e.g. 15–30s), stop when hidden/unmounted where possible; no global 1-second polling.
- No forced SMS/WhatsApp/push. In-app notifications are reliable relative to DB read; web push optional with real opt-in/configuration. Reminder generation through DB-idempotent scheduled HTTP trigger and safe catch-up when visited; no permanent worker required. Clarify that precise timing needs a working scheduler/hosting.

## E. SAFETY / HONEST STATUS
- Driver confirms school `BOARDED` / `REACHED_SCHOOL` / `RETURN_BOARDED` / `DROPPED_HOME` at safe stops. GPS proximity NEVER marks a child delivered. Parent/student leave before travel and school run transitions are validated server-side.
- Student-initiated absence requires guardian confirmation; unauthorised student action cannot silently exclude a child from roster. Parent leave may be owner-reviewed, and owner can enter leave on behalf with reason.
- Real GPS from driver's permitted browser while active; HTTPS/geolocation permission required. Browser/background/locked-device continuity NOT guaranteed. Server stores last update, timestamp, accuracy, source, GPS freshness/expiry. UI says `Live`, `Delayed/Stale`, `Unavailable`, and provides `Call Driver`/`Call Owner` and real event timeline. Never draw a fabricated moving van or invented ETA.
- Only tracking for active assigned trip/route and authorized watcher. Stop sharing and revoke authorization at trip end. Bounded retention for precise location; no owner override fabricating GPS history.
- Never assert UPI money arrived simply from UTR/image/UPI deeplink. Customer payment report starts `PENDING_VERIFICATION`; owner independently checks and records verification; refunds and corrections auditable.
- Urgent passenger request is not emergency dispatch/medical assistance; immediate public call and official emergency services access must remain visible even if API is offline.

## F. MANDATORY PHASE ACCEPTANCE TEMPLATE
For EACH implementation phase:
1. Inspect source + current app + blueprint and preserve work; state what exists and what is actually missing.
2. Implement real front/back code and DB schema/endpoint (if needed), not merely mock components.
3. Add tests for success, validation error, no-login, role/ownership denial, duplicates/retries, and failures relevant to phase.
4. Run actual available `typecheck`, `lint`, `test`, `build`, API integration and Playwright smoke. Record commands and real outputs; if not run, mark UNVERIFIED.
5. Capture before/after browser screenshots at desktop **1440px** and mobile **390px** (plus 320px for new forms). Check blueprint fidelity; do not claim comparisons without screenshots.
6. Demonstrate `UI -> RTK Query mutation -> Express -> MongoDB -> RTK Query invalidation/read -> other authorized account UI` for cross-user flows.
7. List incomplete risks, including hosting/GPS/notification caveats. Do NOT continue to subsequent stage automatically.

---

# PROMPT 00 — REPOSITORY AUDIT, BLUEPRINT ALIGNMENT & EXECUTION PLAN

```text
You are inside my actual VS Code SafeRide folder. Build the COMPLETE transport management software described in the root file SafeRide_Complete_Premium_UI_UX_Blueprint.md. Read that file from top to bottom. Read this master prompt's GLOBAL INSTRUCTIONS and follow them throughout.

FIRST: inspect actual file tree, git status, package.json, apps/web, apps/api, docs, AGENTS.md and any older prompt packs. The latest screenshot showed only the UI/UX blueprint in Explorer, while earlier screenshots showed apps/. Do not assume the repository exists or is empty. If code exists preserve it; if only docs exist note that, and prepare to scaffold in Prompt 01.

Locate the root HTML simulation, if present, for VISUAL identity only. Keep it untouched. The authoritative UX is the NEW blueprint, especially unified customer/parent account, single login, self-signup, school approval before student creation, bookings across services, real GPS/last-known fallback, owner manual payment verification and admin override. Remove contradictory prior `school-only MVP / no wedding bookings` rules in existing AGENTS.md/docs; preserve non-conflicting safety/technical rules.

Create or UPDATE without destructive overwrite:
- AGENTS.md: immutable stack, blueprint-first UX, phase-gate QA, security requirements.
- docs/PRODUCT_REQUIREMENTS.md: complete feature matrix by public/customer/owner/driver/optional student.
- docs/SCREEN_ROUTE_MATRIX.md: every route from section 10 of blueprint with role, exact key actions, endpoints and completion status.
- docs/DOMAIN_MODEL.md: entities, money definitions, statuses and relationship constraints.
- docs/AUTH_PERMISSION_MATRIX.md: permissions, owner override limits and customer-child authorization.
- docs/WORKFLOW_STATE_MACHINES.md: subscription, school runs, booking, payment claims, location and leave.
- docs/PHASE_STATUS.md: stages 00–20, real existing completeness only.
- docs/UI_PARITY_TRACKER.md: source reference/layout, screenshot evidence, disparities.

Resolve conflicts explicitly: (1) CUSTOMER includes parent + general booking user; (2) student is optional, not a public signup; (3) wedding/private/goods/urgent are IN current scope; (4) no Redis/Docker/SQL/TanStack; (5) single operator, not multi-owner SaaS. Create a prioritized real implementation plan without hand-wavy completion claims.

Do not prematurely claim features implemented. Once the audit/docs are aligned, proceed directly to PROMPT 01 in the SAME initial Codex task when requested by the kickoff; otherwise stop after the audit. The initial delivery MUST include runnable code from PROMPT 01.
```

# PROMPT 01 — COMPLETE MONOREPO FOUNDATION, DATABASE & PREMIUM DESIGN SYSTEM

```text
Read AGENTS.md, blueprint and updated docs. Implement the missing project foundation in the existing folder. If apps/web/apps/api already exist, fix rather than replace; if absent scaffold npm workspaces here. Do not create a separate project.

Build working apps/web (React+Vite+TS), apps/api (Express+TS), packages/shared (Zod types/contracts). npm scripts dev/build/typecheck/lint/test/seed:dev and env examples. Set Vite `/api` proxy and secure production topology. Express startup must report DB status honestly and expose public liveness/readiness endpoints; clean errors when MongoDB unavailable.

Implement Redux configureStore, react-redux Provider, ONE RTK Query base API via fetchBaseQuery, session-aware requests, tag types (Auth, Customer, Child, Subscription, SchoolRun, Route, Vehicle, Driver, Booking, Quote, Payment, Fee, Location, Notification, Expense, Report, Settings). setupListeners, API injected endpoints pattern, global error handling.

Implement premium shared components/tokens from blueprint: Button variants, FormField, Input, Select, DateInput, Modal/Dialog, Toast, StatusBadge, MetricCard, PageHeader, DataTable wrapper, EmptyState, LoadingSkeleton, ErrorState, JourneyTimeline, VehicleCard, MobileBottomNav, OwnerSidebar, OwnerTopbar, PublicNav/Footer, TrackStatus, PaymentStatus, MoneyDisplay and DateDisplay. Fix contrast and low-end mobile performance.

Implement React Router route shells corresponding to blueprint; protected paths must be truly protected once Prompt 02 arrives. Do not create fake clickable private dashboards or seeded fake income on the public page. Add root error boundary, 404, not-configured states.

Tests: app+API boot, API health through proxy, store/RTK Query request, no banned dependencies, builds/lint/typecheck, widths 320/390/1440. STOP.
```

# PROMPT 02 — REAL AUTH, ONE LOGIN, SELF-SIGNUP, USER SECURITY

```text
Implement FULL auth across API, MongoDB and React, visually following blueprint's /login and /signup. Only ONE common login form. Customer and parent are same role CUSTOMER. Customer signs up independently using name, mobile, optional email and password; show unverified contact state until properly verified. Signup must not link children via an unverified number. Account should be usable for bookings according to risk policy while child/student linking needs explicit enrollment approval.

Models: Business, User, Session/SessionToken, Invitation, PasswordResetToken, RoleGrant/permissions, AuditLog; secure indexes. Owner bootstrap via protected one-time CLI/env; driver invites/setup tokens; optional student account only linked to approved existing student. Never expose public owner/driver signup.

Backend: POST /auth/signup, /auth/login, /auth/logout, GET /auth/me, password-change, request-reset and complete-reset (via configured verified contact or secure owner-assisted flow), session revocation. HttpOnly secure same-origin cookies, CSRF/origin checks, rate limits and password hash. Avoid account enumeration. Owner may deactivate, terminate sessions and initiate safe account recovery.

Frontend: beautiful minimal Login/Signup/Forgot UI; no role selector or portal tiles, no separate Parent login. After session role check send Customer -> /app/home, Owner -> /owner/dashboard, Driver -> /driver/today, optional Student -> /student/home. If an owner has driver duty, show privileged internal Driver Mode (same session, backend checked), not identity impersonation.

On logout clear RTK Query sensitive cache; role change invalidates session/cache as appropriate. Test self-signup, wrong credentials, cookie tampering, disabled accounts, reset, role access, repeated login, refresh, mobile accessibility. STOP.
```

# PROMPT 03 — CUSTOMER-FACING PREMIUM PUBLIC WEBSITE & CONTACT

```text
Build a premium public marketing website for ONE actual transport business, implementing blueprint sections /, /services, /vehicles, /contact, how it works, FAQ/policies. NO four role cards, NO demo portal previews, NO debug/API status in public DOM.

Public home hero: supplied van illustration as legitimate fallback, operator branding configurable, headline 'A safer school ride. A simpler way to book your journeys.' prominent 'Book a Vehicle' and 'School Transport' CTAs, ONE Login at top. Include honest service categories (school, wedding/events, private/party/outstation, eligible goods, urgent passenger). Include school journey benefits, route availability caveat, booking explanation, real vehicle public info, pricing estimate caveat, contact/WhatsApp only when configured, safety/privacy, appropriate urgent medical disclaimer. No fake customers, testimonials, verified licences or vehicle capabilities.

Public API only returns allowlisted business profile/vehicles/service areas and never child/driver home address/GPS. Contact form creates persisted enquiry with validation, throttling, honest status and owner inbox. Urgent CTA opens /urgent (full request implemented in Prompt 12, public Call Now/help must work now). No signup needed to view urgent help.

Browser compare original reference's brand styling while overriding public portal mistakes with blueprint design. Test CTA destinations, real configured tel and WhatsApp, form submission into DB, no leaked business-private fields, mobile 320/360/390, desktop 1440. STOP.
```

# PROMPT 04 — OWNER SHELL, BUSINESS SETTINGS, USER MANAGEMENT & AUDITED OVERRIDES

```text
Implement FULL owner admin shell from blueprint: grouped sidebar, sticky topbar, mobile drawer/bottom shortcuts and real navigation. No empty generic admin template. Start with owner dashboard using honest onboarding state; as modules arrive integrate DB-backed metrics.

Owner business settings: business name/logo, phones, service areas, address visibility, school vs private service enablement, working hours, UPI ID/QR metadata, bank/cash instructions, refund/cancellation policy, timezone Asia/Kolkata, supported vehicles/capabilities, public branding/content. Input sanitization; upload only with safe storage plan (do not rely on Render ephemeral disk). Public endpoints reflect approved settings.

Owner users screen: customer list, driver accounts, optional student access, session and status management; invite driver, create customer for offline phone booking, change permitted details, deactivate and safely delete/anonymize eligible user. On deactivate immediately revoke access and active tracker permissions; resolve active bookings/child subscriptions before deletion. Retained invoices/payment/trip audit history must stay consistent without exposing erased PII.

Override framework: owner can correct fees/assignments/bookings/leave/payment classifications/attendance with modal showing original, proposed value, reason, effects and audit record; require reason for sensitive corrections. Immutable append-only correction for historical child status and verified financial records; no backdating fabricated GPS, no rewriting money proof, no impossible overlapping vehicle dispatch. Log who/when/why and expose owner audit UI.

Test owner-only APIs and negative tests for customer/driver, deactivate login/session, safe delete with linked histories, correct public settings and audited override. STOP.
```

# PROMPT 05 — SCHOOL SUBSCRIPTION SELF-SERVICE + STUDENT CREATION AFTER APPROVAL

```text
Implement the blueprint's exact school application flow, not direct public student registration.

Customer /app/school and /app/school/apply: request school transport with school name, general pickup/drop address or area, morning/return need, requested CHILD COUNT, preferred start date and contact. Steps Service Details -> Pickup/Return Needs -> Review. Do not require full child's sensitive profile before approval. Application states Draft, Submitted, NeedsInfo, Quoted, AcceptedByCustomer, Approved, Rejected, Cancelled, Expired. Owner views /owner/school/subscriptions and checks service coverage, route/seats, proposes per-child fixed monthly fee and dates; customer sees quote and accepts; owner approves. Approval is not automatically vehicle assignment or active service.

AFTER approval, customer may add student profiles ONLY within approved child slots: name, class/school, guardian link, pickup/drop details, approved contacts; owner may add/edit on behalf. Owner finalizes route, vehicle, driver and start date, then activates. One customer with 2+ children sees child selector and separate fee rates. If guardian requests extra child, amend/re-approve capacity. Child/student accounts are optional; a Student row is not synonymous with login credentials.

Models: SchoolApplication, QuoteAgreement/fee terms snapshot, SchoolSubscription, Student, GuardianChildLink, Enrollment/Assignment, AuditLog. Server must enforce that a customer sees/edits only own applications and linked children; pending signup phone match alone does not grant child access. Owner edits/deactivates/withdraws students, eligible deletion after retention checks. No school payment intermediary.

Routes and UI match blueprint. Tests: signup -> submit -> owner quote -> customer accept -> owner approve -> add child -> owner assign/activate; overquota denial; unrelated guardian denial; owner offline enrollment. STOP.
```

# PROMPT 06 — VEHICLES, DRIVERS, ROUTES, STOPS & CONFLICT-FREE CALENDAR

```text
Implement owner fleet, driver management, route planning and calendar. Vehicle: type (Eeco/car/van/pickup/truck), registration, seats or legally permitted payload, services permitted, images, status, docs/insurance/fitness dates, maintenance blackout, assigned drivers. Driver: profile, contact, active/inactive, authorized vehicle assignments and account. Do not let a passenger-only vehicle be used for goods service without eligible configuration/compliance.

School route builder: routes per school, morning/return schedules, ordered stops, pickup/drop windows, student assignments, vehicle and driver; show capacities, protect from overbooking. Route planning can use manually ordered stops without compulsory paid maps. Calendar day/week/month combines recurring school time blocks, private bookings, maintenance and vehicle/driver unavailability; avoid conflicts server-side.

Conflict engine: interval overlap with buffers, date-specific school duty, overnight/multiday bookings, maintenance, vehicle capacity, driver availability, status. Owner override can correct schedule/choose a different resource with reason, but cannot force one physical vehicle/driver to be simultaneously on two incompatible active trips. Allow waitlist/alternative proposal.

Implement /owner/fleet, /owner/school/routes, /owner/calendar and relevant API. Tests for same-time collision, school booking collision, capacity, invalid vehicle type, timezones, mobile card scheduling. STOP.
```

# PROMPT 07 — SCHOOL DAILY RUNS, SAFETY EVENT TIMELINE & LEAVE

```text
Implement SchoolRun per route/date/session (morning and return) and immutable ChildJourneyEvent event log. Driver/owner assigned to run marks BOARDED, REACHED_SCHOOL, RETURN_BOARDED, DROPPED_HOME, or MISSED_PICKUP with allowed transitions and timestamps. Only authorized driver/owner. Duplicate taps/idempotency required; don't let home drop occur without correct preceding stage, subject to documented recovery action with audit. No auto drop based on GPS.

Parent /app/school/leave: Today, Tomorrow quick buttons; choose child(ren), future date, optional note. Valid owner/parent-entered absence affects roster after confirmation/business policy. Student-initiated leave is PENDING_GUARDIAN until linked guardian confirms; cannot auto mark absent. Cutoffs and late leave handling visible. Owner /owner/school/leaves can approve/reject, submit on behalf, view history; driver sees accurate roster status. Child who already boarded cannot be marked absent retroactively to erase trip.

Owner daily run board and customer journey timeline show server-confirmed status. Owner correction of incorrect event requires explicit reason and adds correction record rather than overwrite. Notifications triggered to authorized recipients on actual events.

Tests: school run lifecycle and cross-account status, leave states, late/duplicate actions, unauthorized child access, correction audit, date session. STOP.
```

# PROMPT 08 — REAL LIVE GPS, AUTHORIZED TRACKING, STALE/OFFLINE FALLBACK

```text
Implement GPS as top-priority real capability. Driver starts school run or private trip while stationary, explicitly grants phone browser geolocation; device sends throttled coordinates plus accuracy/client timestamp to Express over HTTPS to bounded endpoint. Server validates authenticated driver assignment and ACTIVE trip, plausible coords/timestamps, rate limits, ID relationships. Store current authorized fix and retention-bounded history in MongoDB. Auto stop accepting/showing active updates at trip end/logout/unassignment.

Owner /owner/live shows each active eligible vehicle with lastSeen/accuracy, filters by school/private and honest marker freshness. Customer /app/school/track sees only child's ACTIVE assigned vehicle; customer /app/bookings/:id sees only own ACTIVE assigned trip. Driver /driver/trip and /driver/run show GPS permission/connection state and sharing toggle. Student own limited access only if explicitly allowed. Don't display precise GPS on public pages.

Use React Leaflet/Leaflet with legal tile usage and graceful loading/offline states. Design explicit freshness thresholds/config and labels 'Live', 'Delayed', 'Unavailable'; show last-update timestamp and Call Driver/Owner fallback. When GPS isn't available, show event timeline and last authorized location only if within policy, NEVER fabricate moving marker, ETA or fake movement.

Use RTK Query scoped polling about 15–30 seconds while active, stop when hidden/unmounted. Driver foreground geolocation watch at sensible frequency and battery-aware throttling. A locked/suspended browser may stop; explain in UI and docs. Do NOT claim guaranteed background tracking or rely on a PWA service worker for continuous GPS.

Tests: role and child/booking isolation, off-duty upload denial, stale GPS, location permission denial, no coords, trip ended, polling stops, map and no-map mobile behavior. STOP.
```

# PROMPT 09 — CUSTOMER HOME: PHONE-LIKE PARENT-FIRST DASHBOARD

```text
Implement blueprint /app/home and customer shell with bottom nav Home | Bookings | Payments | Account. This must look genuinely premium and simple on an inexpensive Android phone. Read the exact mobile home layout in the blueprint before coding. Customer parent and other booking user use ONE identity and ONE home.

If ACTIVE school subscription: above the fold display child selector, today's confirmed journey status, three large visible buttons **CALL DRIVER** (valid tel: or call owner fallback), **TRACK VEHICLE** (real authorized GPS or stale state), **MARK LEAVE** (Today/Tomorrow form); compact current monthly fee card; recent notices; below show private booking service tiles and upcoming bookings. Parent should access each daily action in 1–3 taps. If no school subscription: show Get School Transport, Wedding/Party, Local/Outstation, Goods Pickup, Urgent Ride and booking status, NOT fake child or ₹0 fee widgets.

Customer navigation include /app/school, /app/school/children, /app/school/track, /app/school/leave, /app/bookings, /app/payments, /app/account. Use genuine RTK Query data: status based on run events, call number from assigned driver or owner, no made-up route position. Multichild selector never identity switching.

Test at 320/360/390 desktop, slow network, no school subscription, one child, several children, GPS unavailable, no driver number, active private booking. Every CTA real. STOP.
```

# PROMPT 10 — BOOKING FORMS, CITY/DISTANCE PRICE ESTIMATES & QUOTATIONS

```text
Implement customer booking wizard /app/book for Wedding/Event, Party/Private, Local/Outstation, Airport/Station and eligible Goods Pickup. Contextual fields only: passenger vs cargo, date/time, one way/return/hours/days, origin/destination using map optional city/manual text, extra stops/notes. No redundant or school-specific fields. Backend validates service and vehicle eligibility.

Owner /owner/settings pricing policies: per-vehicle base fare, minimum, per-km, hourly/day package, one-way vs roundtrip rules, night/waiting/toll/parking estimated or excluded charges; quote expiry, advance fixed/percentage. For city/addresses integrate free/allowed routing provider behind swappable service adapter respecting provider usage/rate limits. If geocoder/router is unavailable, UI says 'Distance unavailable, owner will quote' and DOES NOT fabricate km/fare. Manual distance entered by owner is labeled and audited. Display price breakdown and 'Estimate only; owner confirms final quote'. Avoid treating straight-line distance as driving distance.

Customer creates REQUEST (not confirmed reservation), owner receives /owner/bookings/requests, reviews availability/school route conflict, sets FINAL quotation (amount in paise, advance requirement, terms, expiry, current itinerary snapshot); customer accepts/rejects. Quote snapshot frozen when accepted; any later change generates versioned amendment requiring relevant consent.

Models PricePolicy, DistanceEstimate, BookingRequest, Booking, QuoteVersion, Itinerary; status state machine and indexes. Test all 4 service categories, pricing edge cases/round trips, no-route fallback, quote expiry, invalid negative prices, other-user booking access. STOP.
```

# PROMPT 11 — BOOKING LIFECYCLE, ADVANCE GATE, DISPATCH & VEHICLE AVAILABILITY

```text
Implement entire general booking lifecycle across owner and customer. Requested -> Quoted -> CustomerAccepted -> AwaitingAdvance (if policy requires) -> Confirmed -> Scheduled/Assigned -> Ongoing -> Completed; also Cancelled/Rejected/Expired/RefundPending. Enforce legal transitions server-side; ensure booking status and payment status are independent concepts. Owner may waive advance for offline/exception with auditable reason rather than creating fake payment. Verified advance gate integrates real finance module in Prompt 13; until then show truthful Awaiting Verification. Do not mark money received from customer claim.

Create booking calendar and assign/reassign eligible vehicle and driver; check school duty, other bookings, maintenance, passenger/cargo suitability, capacity and windows. Owner can create offline bookings from call and quote them; customer sees their own history, detail itinerary, quote versions, status, contacts, cancellation/reschedule, tracking when active and invoice when appropriate. Owner detail tabs itinerary/quotes/payments/dispatch/tracking/invoice/audit. Time/rate/vehicle changes versioned with audit.

Trip start/end by assigned driver or owner with authorization; end event cannot falsify GPS or cash reconciliation. Cancellation policy, charges, refundable advance, driver reassignment and notifications persisted. No unsupported cancellation 'refund successful' state.

Tests: overlapping wedding with school run rejects; valid alternative vehicle succeeds; quote accept/expiry; cancel/reschedule; owner offline booking; customer cannot see another booking; double-click create idempotency. STOP.
```

# PROMPT 12 — PUBLIC URGENT / EMERGENCY-PASSENGER REQUEST, CALL FIRST

```text
Complete `/urgent` independently of normal booking wizard. Keep it accessible before signup and when auth is down. Prominent configured operator Call Now; visible access to official emergency services for medical emergencies. Explicit statement that a normal passenger car is NOT an ambulance or guaranteed medical transport; show only verified authorized medical vehicle capabilities if configured and legally suitable. Do not collect unnecessary patient medical details.

Optional short request: current pickup location (with user permission) OR typed pickup, reachable phone, optional destination/note. NO mandatory registration, fare estimate, vehicle category, future date, advance or online payment. Persist UrgentRequest and immediately create in-app owner alert if backend works; severe rate limit/spam protection; minimal PII retention. Provide honest state 'Request received' vs 'Owner accepted/driver assigned'; never say help is coming until actual acceptance. If no operator configured or API offline, call emergency services/owner fallback remains available with clear indication.

Owner pinned urgent queue, call, accept/decline, dispatch suitable available vehicle, or refer to emergency services. Quote/payment can be settled later as explicit ordinary transport charge if applicable. Tests: works without account, spam throttling, acceptance notifications, no guaranteed claim, no medical service mislabel. STOP.
```

# PROMPT 13 — UNIFIED MANUAL PAYMENTS, CLAIM VERIFICATION & FINANCIAL LEDGER

```text
Build robust shared finance for SCHOOL FEES and ALL BOOKING CHARGES/ADVANCES. NO gateway. Customer/parent pays owner by external UPI app/QR, bank transfer or cash. Customer can tap 'I Have Paid' and submit claimed amount, method, date, optional UTR/receipt evidence; it appears PENDING_VERIFICATION, not collected. Owner independently checks bank/cash and Verifies/Rejects/Requests Clarification; owner may directly record real offline cash/UPI payment when informed by caller. Do not treat UPI deep link or typed UTR as bank-confirmed.

Schema: PaymentClaim, VerifiedPaymentEntry, PaymentAllocation, Receivable/Invoice, Refund, Adjustment, AuditLog; integer paise, idempotency keys, unique immutable payment/receipt refs, repeated-submit protection, atomic/transaction-safe verification and allocation. Each verified payment can be allocated to a specified child fee month or booking balance. Prevent cross-customer allocation and double counting. All corrections are reversal/compensation entries. Receipts issued only for verified collections; rejected claims keep history.

Customer /app/payments tabs School Fees | Trip Payments | Payment Claims | Receipts; UPI QR from owner settings and visible instructions, Pay/Report Payment UX. Owner /owner/finance/verify queue with source, name, date, UTR, optional evidence, comparison details, Verify/Reject/Clarify, manual recording. Owner advances page with total, advance required, verified, pending, remaining/refunds. Booking only advances when required VERIFIED amount received or documented owner waiver.

Financial definitions must be clear: quoted/billed amount, verified collections, advance applied, unallocated credit, outstanding, expenses, revenue recognized by agreed booking/fee policy, refunds and net cash. Do not recognize an advance twice when remaining balance paid.

Tests: user reports UPI -> still pending -> owner verifies -> payment reflected customer+owner -> booking/fee allocation -> receipt; duplicate verification/retry no extra money; user spoofed claims do not count; overpayment/partial/refund/reversal, permission denials. STOP.
```

# PROMPT 14 — FIXED SCHOOL FEES, PARTIAL/ADVANCE CREDITS & REMINDERS

```text
Implement per-student negotiated FIXED monthly school transport agreements, effective start/end, due day, billing months, discounts/waivers/manual adjustments, partial payments, outstanding carry-forward and future advance credits. A student absence must NOT automatically discount fixed fees. Students may have different rates even in same household. School is destination/reference only; parent pays OWNER directly.

Generate monthly FeeCharge idempotently for active enrollment and scheduled period; prevent duplicate bills after retries. Allocate verified payments to correct child+month; future credit tracked distinctly. Fee agreement changes future only unless explicit audited adjustment. Owner /owner/finance/fees with month, billed/collected/pending/due, student+guardian details, adjustment dialogs and printable statements; customer easy fee cards and receipts. Student optional account can view restricted fee reminder where permitted, but cannot pay/verify money.

Reminder configurable N days before due (e.g. 7,3,1,0), recipient customer/guardian and optional student; persistent idempotency key per reminder recipient/fee/event, safe scheduler-protected HTTP endpoint plus on-view catch-up and explicit delivery state. No free-tier worker reliance, no false claims of email/SMS. In-app notifications primary; optional web push with consent/config.

Tests: different siblings' fee amounts, partial, advance next month, fee change effective date, duplicate monthly job, holiday/leave no auto discount, reminder dedupe, account privacy. STOP.
```

# PROMPT 15 — COMPLETE DRIVER MOBILE WORKSPACE & TRIP EXECUTION

```text
Fully implement /driver/today, /driver/run/:id and /driver/trip/:id as a phone-first, high-contrast one-handed workspace. Blue-white design, large >=44px buttons, student roster, morning/return tabs, private booking duties and short instructions. Driver actions only when vehicle safely stopped. Never encourage interacting while driving.

Driver sees assigned school and other booking duties, assigned vehicle, time, stops, authorized student/parent or customer contact only, Call Owner, Start Run/Trip, confirm school events, Missed Pickup, Delay/Breakdown/Incident report, pause/end private trip and permission-based location sharing. Driver does NOT access owner-only revenue, customer ledgers, paid receipts or unrelated families. Owner acting as driver may execute duty via backend-validated driver capability on own session.

GPS sharing button reflects actual permission/active trip state and stops on end; precise location is not a substitute for child confirmation. For poor connection show retriable state; never mark child safely arrived until server acknowledges event. Duplicate submissions idempotent and safe. Tests on 320/360/390, permission denied, stale state, no assigned work, invalid run, repeat taps and owner-as-driver capability. STOP.
```

# PROMPT 16 — NOTIFICATIONS, CONTACT, HOLIDAYS, ENQUIRIES & PUSH (OPTIONAL)

```text
Implement persistent in-app Notification per recipient and type with read/unread, meaningful filters and route links. Events: school run started/boarded/school arrival/return/home arrival, leave request/guardian confirm/owner approval, subscription quote/activation, booking request/quote/accepted/advance verified/confirmed/assigned/cancelled/completed, fee reminder, payment claim/verification/refund, emergency owner alert and driver delay. Do not notify unrelated people or leak private child/booking details.

Owner /owner/notifications can publish holiday, late run, route change or service notice to authorized recipients and manage public contact enquiries. User /app/notices and driver relevant alerts; bell counts real. Optional browser push via permission and available hosting, with push token cleanup and delivery status; no mandatory paid SMS/WhatsApp. Call Driver/Owner uses configured `tel:`; WhatsApp contact link opens only on user's tap. Failures say in-app saved vs external delivered truthfully.

Use outbox/event persistence or consistent DB transaction/idempotent notification creation; no Redis/worker dependency. A protected scheduled endpoint may dispatch time-based tasks, no forever background process assumption. Tests recipients, duplicate notices, no phone numbers configured, push unsupported, privacy, unread counts. STOP.
```

# PROMPT 17 — EXPENSES, FULL OWNER REPORTING, INVOICES & PRINT/EXPORT

```text
Implement Owner expense register: fuel, toll, parking, maintenance, driver allowance, other; amount paise, vehicle, trip optional, vendor/note, paid mode/date, receipt evidence optional, adjustments/reversal history. Do not let driver arbitrarily modify verified owner accounting; driver expense request may require owner approval.

Reports from real DB with filters date range/service/vehicle/driver/customer/status: school pickup & drop, attendance/leave, student fees, dues, booking register, quotes/advance, payment verification, trip revenue, expenses/operating surplus, vehicle utilization, driver activity, notifications and customer ledger. Show clear definitions: billed vs collected vs outstanding vs cash advances vs refunds vs expenses vs profit. No made-up charts or double-counted advances.

Make printable PDF-friendly responsive documents: school fee receipt/statement, quotation, booking confirmation, private trip invoice, payment receipt, cancellation/refund adjustment, goods challan/proof of delivery if relevant. CSV safely escape formulas and special characters. Server-side pagination and authorized exports; no leakage of another customer or minors. Test totals reconcile ledger, exports, print CSS, zero/large data and access control. STOP.
```

# PROMPT 18 — SETTINGS, ONBOARDING, EDGE CASES, ACCOUNT DELETE & OWNER OVERRIDES

```text
Complete real-world owner workflow polish and hard edge cases. First-time setup: business profile/contacts, UPI QR, working service area, vehicles, drivers, school routes, prices, cancellation and fee policies. Contextual setup checklist rather than fake KPI tiles. Clear validation of missing critical configuration before publishing booking estimate or taking enrollment.

Owner create booking/student/payment from phone call without forcing customer to use app. Customer self-service remains available. User management: customer/driver/student deactivation, revoke sessions, ownership transfer/last-owner safeguards, safe deletion or anonymization of eligible personal records, retain legally/financially necessary references using policies. Remove access to active GPS and sensitive records immediately after deactivation. Override reason/impact/audit displayed. Respect data minimization for children and urgent requests.

Business edge cases: parents with multiple children, route reassignment, subscription pause, driver unavailable mid-run, late leave, already-boarded child, confirmed wedding clashes with school run, multi-day booking, booking price amendment, partial refund, payment claim rejected after fake UTR, cash payment manually recorded, no GPS/map/UPI QR configured, customer who only books weddings, family who books wedding too, poor network, repeated operations. Write integration tests and fix all found gaps. STOP.
```

# PROMPT 19 — COMPLETE UI/UX POLISH + CROSS-ROLE END-TO-END ACCEPTANCE

```text
Read the ENTIRE blueprint and run a cross-page audit, not just the homepage. Inspect current app in Chromium using real development MongoDB seed fixtures and authenticated accounts for CUSTOMER, OWNER, DRIVER and optional STUDENT. Compare design to the reference HTML where relevant, using blueprint decisions when they override its demo UI. Ensure every screen has coherent branding and real interactions.

Visual checks widths 320, 360, 390, 768, 1024, 1366, 1440. Validate premium card styling, color contrast, heading hierarchy, legible Hindi/English-friendly copy, sticky nav, safe mobile bottom nav, viewport/keyboard, empty/loading/errors, print sheets, dark OS preference if supported, reduced motion and accessible focus. No white-on-white buttons, giant empty slabs, debug statuses, role cards or dead interactions.

RUN THE REQUIRED 8 END-TO-END STORIES:
1. New customer signs up -> requests school subscription -> owner quotes & approves -> customer creates student -> owner assigns vehicle/route -> school home appears.
2. Driver starts school run & confirms events -> parent sees timeline and can call driver; owner correction logged.
3. Driver streams fresh GPS -> parent sees authorized map -> disable GPS -> stale/unavailable and call fallback; other customer denied.
4. Parent submits leave for today/tomorrow -> roster updates appropriately; student leave needs guardian confirmation.
5. Same parent/customer requests wedding trip -> estimated route price OR honest no-distance fallback -> owner quotes -> accepts -> verified advance -> confirmation & schedule, no school conflict.
6. Cash/UPI reported school fee -> pending -> owner verifies -> one verified ledger entry and receipt.
7. Unregistered person opens /urgent -> call/official emergency guidance -> optional short request -> owner alert/accept/decline; no promised ambulance.
8. Owner creates offline booking, changes price with audit, disables customer, demonstrates revoked access and retained lawful financial history.

For each story show real UI/API/DB evidence, pass/fail screenshot references, no fake claims. Fix all discovered high-severity defects. Output comprehensive docs/FINAL_ACCEPTANCE_REPORT.md and phase status. STOP.
```

# PROMPT 20 — MONGODB INDEXING, RTK QUERY CACHE, SECURITY & LOW-COST DEPLOYMENT

```text
Final hardening: audit package dependencies (no Redis/Docker/SQL/TanStack), Mongoose indexes via explicit safe script and actual query plans; confirm list pagination, projection, no N+1, connection pooling, bounded uploads, caching via RTK Query tags, refetchOnFocus/reconnect, logout cache reset, polling only active map/trip. No server-wide setInterval as only reminder engine; MongoDB stores persistent truth. Security review: cookies/CSRF/CORS/proxy, account reset, brute force, data isolation, IDOR, no PII in logs/browser storage, GPS TTL, audit integrity, financial idempotency, safe errors, backup/restore plan.

Provide deployment docs for Vercel front + Render Express + MongoDB Atlas ONLY where allowed by current plans and terms, with `/api` reverse proxy, correct env vars, secure cookie and CORS setting, readiness/health endpoints, scheduled reminder trigger auth, DB backup/restore, monitoring, legal/operational considerations for transport. Do not assume Vercel Hobby allows commercial clients, or Render free guarantees uptime. If continuous child tracking/urgent response depends on reliability, explain free-tier sleep and recommend a permissible reliable tier or native/GPS tracking later.

Perform production build and smoke with real DB; test deployed-style origin auth and GPS inactive states. Produce README setup/run/seed/test commands, operator setup guide, backup and safe environment config, runbook and exact unresolved limitations. Do not mark production-ready unless key flows and hosting reliability actually verified. STOP.
```

---

# MASTER KICKOFF MESSAGE — SEND TO CODEX FIRST

```text
I want you to implement the COMPLETE WORKING SafeRide MERN transport management software in my CURRENT VS Code repository.

READ THESE BEFORE ANY CODE:
1. SafeRide_Complete_Premium_UI_UX_Blueprint.md — PRIMARY UI/UX and product source of truth.
2. SafeRide_Complete_MERN_Working_Software_Codex_Prompts.md — CURRENT implementation instructions.
3. AGENTS.md and docs/*.md, if present.
4. SafeRide_Kids_Interactive_Simulation.html, if present — VISUAL reference only, NOT its demo/role UX.

Do not trust old school-only prompt packs when they conflict. This product includes: one customer/parent account with self-signup, school subscriptions and owner approval before student creation, school pickup/drop and leave, live GPS with honest fallback, wedding/party/local/outstation/goods bookings, distance-based estimates when routing available, quotations, advance requirements, manually verified UPI/cash/bank payments, urgent call-first transport requests, owner administration and audited overrides, driver mobile duty app, notifications and reporting.

STRICT STACK: React + TypeScript + Vite; Node + Express + TypeScript; MongoDB/Mongoose; Redux Toolkit + RTK Query for ALL server-state caching. No Redis, Docker, SQL, TanStack Query, Zustand, competing caching libraries, payment gateway or mandatory paid APIs.

FIRST TASK: execute PROMPT 00 (audit and alignment), THEN PROMPT 01 (implement or repair the runnable MERN foundation and premium design system) IN THIS SAME TASK. Inspect the actual repository before assuming it exists or is missing; preserve working code. Do not end with documentation only. Actually start the frontend and API, prove the API health call, run builds/tests, and capture desktop/mobile browser screenshots. Stop AFTER PROMPT 01; do not start PROMPT 02 without a new instruction.
```

# POST-PHASE REQUEST TEMPLATE

```text
Continue the same SafeRide project. Read AGENTS.md, the complete UI/UX Blueprint, and the final MERN prompt pack. Execute PROMPT XX ONLY (replace XX with the next phase number). Preserve working functionality. Implement real code, verify browser+API+MongoDB flows, screenshot desktop/mobile, run tests/build and report exact evidence, bugs and unfinished work. Do not start the following phase.
```

---

# FINAL NON-NEGOTIABLE RELEASE DEFINITION

The software is complete only when a **single customer identity** can use school and ordinary transport; a guardian can apply for a school subscription and add children only after approval; an owner can approve, manage all accounts and safely audit overrides; customers can request weddings/party/private/goods trips with estimates and advances; urgent help remains call-first; payments require owner verification; a driver confirms actual pickup/drop and shares real authorized foreground GPS; parents see fresh or honestly stale location and can call/leave in minimal taps; all operations reconcile across the owner dashboard and protected MongoDB API. Beautiful UI without working flows is not complete. Working flows with unacceptably confusing mobile UX are not complete either.
