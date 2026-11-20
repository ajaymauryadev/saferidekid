# SafeRide — Complete Premium UI/UX Blueprint (Final Product Design)

**Design decision | 8 November 2026**  
**Status:** Product-wide UI/UX source of truth for the EXISTING MERN codebase. This is a design blueprint, not a claim that screens have been implemented.  
**Reference:** Root `SafeRide_Kids_Interactive_Simulation.html` (or versioned matching filename). Retain its blue-white softness, school vehicle art, rounded cards, journey timeline, map area and gentle shadows; DO NOT reproduce its public role selection/demo controls or pretend simulation data is live.  
**Product model:** One transport operator/business, potentially many vehicles and drivers. Customer = parent = general booking user, all within one account. Owner and Driver have privileged workspaces. Student account is OPTIONAL and restricted. No public multi-owner marketplace in this version.

## 1. Experience principles (mandatory)

1. **Parent/customer first:** ordinary users need a phone-like, familiar screen, not an enterprise control panel. Show what matters to them NOW, not all possible features at once. Most parent daily needs: **Call Driver, Track Vehicle, Mark Leave**.
2. **One identity, multiple services:** a customer can subscribe to school transport and request wedding, party, local/outstation, urgent passenger and eligible goods transport in the same account. Do not create a separate Parent login/portal. One `/login` form, one `/signup` for customers, role determined by secure backend session.
3. **Progressive disclosure:** dashboard displays 2–4 primary actions; advanced information appears inside the selected task, not in fifty tiles on the home screen.
4. **Owner controls business:** powerful dense desktop tools, mobile operational shortcuts; overrides allowed with appropriate permissions and a reason/audit entry, not silent history rewriting.
5. **Driver works from a phone:** big readable controls, minimal form fields, action only when safely stopped. Driver cannot manipulate income/payment records.
6. **Honest status:** no fake GPS, paid status or trip progress. Pending payment claim is never “received” until verified. Offline and stale data clearly identified.
7. **Low-data and low-literacy friendly:** simple English plus Hindi text help, prominent real phone contacts, short labels, no excessive motion, fast page load and usable 360px layout.
8. **Consistency:** identical action/button patterns and semantic colors across public/customer/owner/driver screens; tasteful premium design rather than flashy enterprise styling.

## 2. Brand and visual design system

### Identity
- **Public business branding:** configurable operator name and logo, e.g. `SafeRide` with subtitle `School & Private Transport`. Use `SafeRide Kids` as the school transport program/module, not as a label forcing weddings into a child-specific category. Existing repository/app name can remain SafeRide Kids; renaming code is NOT required.
- Base personality: trustworthy, modern, warm, clear, calm, professional. Not a role-switch demo, taxi aggregator or luxury limo website. Real operator vehicle photograph from business settings; user's supplied van artwork is the initial illustrative fallback.
- Background `#F5F8FD`, card `#FFFFFF`, primary `#125FD4`, hover `#0B4FAE`, secondary blue `#087CE4`, navy `#142544`, main text `#202E45`, muted text `#60728A`, border `#E6EAF2`.
- Positive/confirmed `#0E9561` on light green `#DFF8EA`; caution/pending `#9A6700` on `#FFF4D8`; error/urgent `#CE4054` on `#FFF0F1`; neutral grays for no activity. An 'emergency' service button may use restrained red/warm styling but must not imply ambulance availability.
- Use semantic design tokens in CSS/Tailwind rather than scattered hard-coded colors. Status ALWAYS has word + icon (not color alone).
- Font: Inter or system sans, body 14–16px, important prices 24–32px, titles 24–30px, customer/mobile main greeting 23–28px, public hero 40–54px desktop/30–36px mobile. Avoid tiny 9px essential text.
- Surfaces: 18–24px card radius, 12–14px control radius, 1px fine border, subtle blue-tinted shadow, balanced 16–24px content padding. Use soft neumorphism selectively, not embossed inputs everywhere.
- Buttons: Primary solid/gradient blue WHITE readable text; secondary white navy border; subtle pale-blue; success for confirmed; danger for destructive. 44–48px minimum tap height. No invisible pale-on-pale CTAs.
- Icons: same Lucide stroke style 18–22px; no random emoji primary controls. Use simple visual hierarchy and short labels.
- Spacing: 4/8/12/16/24/32px scale; mobile outer margins 16px, desktop max-width 1280px public and fluid content for admin.
- Images: hero van picture, vehicle cards and route map only where informative. Lazy-load photos/maps, no broken remote placeholder dependencies.
- Motion: 150–200ms transitions, respect reduced motion. Avoid decorative continuous animation.

## 3. One public website / no multiple portals

### Public nav (desktop)
`[Operator logo]     Home   Our Services   Vehicles   How It Works   Contact     [Log In]`

Mobile: logo, visible `Log In` and menu; nav drawer for others. One obvious `Book a Vehicle` CTA and one `School Transport` CTA in page content. Do NOT show Owner/Parent/Driver/Student tiles, developer preview controls, API health messages or “Explore Dashboard” links.

### `/` Homepage
- Header clean white, subtle sticky behavior, primary Login.
- Hero within rounded 26px pale blue/mint gradient: headline **“A safer school ride. A simpler way to book your journeys.”** Supporting 2-line copy, a real/supplied vehicle image. CTAs: **Book a Vehicle** and **School Transport**. Small Call owner link.
- Three trust benefits: pickup/drop confirmation, location when available, easy UPI/cash record (not gateway).
- Service selector (school, wedding/events, local/outstation, goods, urgent passenger) with clearly different explanations and actions, no role portals.
- Vehicle highlights from public-safe business data; type, seats, luggage/payload only when configured; empty state prompts to contact.
- How-it-works for school and trip booking in separate slim tabs/sections.
- Pricing explanation: estimated fare may change after quotation; honest policy notice, not ungrounded fixed claims.
- Safety/privacy: manual driver-confirmed pickup/drop; GPS subject to browser/network; emergency medical disclaimer and official services route.
- Testimonials only when genuine and authorized; otherwise use useful FAQs.
- Contact: call, optional configured WhatsApp, validated enquiry form, business-defined service area. No invented phone/address.
- Footer: simple legal/policies, contact, ONE standard login link; no role links.

### `/services` / `/vehicles` / `/contact`
Services page has service-specific cards/FAQs and clear actions. Vehicles cards have image/type/seat capacity/busy/available only where live/public exposure is allowed (do not expose school route assignments). Contact mobile action has full-width `Call Owner`, WhatsApp when configured and visible business hours if configured.

### `/login` and `/signup`
One centered elegant card: logo/illustration on large screens; user identifier, password + show/hide, sign-in, forgot password, new customer signup. No role picker. Backend-derived destinations: customer `/app/home`; owner `/owner/dashboard`; driver `/driver/today`; optional student `/student/home`. Parent and booking customer are the SAME customer identity. Existing customer uses one login for everything.
Signup: name, mobile (required), optional email, password, acknowledgement of policies. Do not promise OTP delivery without configured provider. Customer account can be created directly; owner is provisioned securely; drivers owner-invited. Emergency assistance page must be accessible before login.

## 4. Customer/Parent mobile application (PRIMARY USER EXPERIENCE)

### Shell
- 360–430px phone priority: white header with logo, first name, bell; blue-white surfaces; vertical scroll; consistent top-level bottom nav: **Home | Bookings | Payments | Account**. School Tracking and Leave are explicit, large Home quick actions whenever the account has an active school subscription.
- Desktop is a clean centered two-column portal with optional narrow navigation, not giant stretched blank cards.
- Account may switch between **linked children** in the school block, but does NOT switch roles or identities.

### `/app/home` when customer has active school subscription
**Above the fold, in this order:**
1. Compact greeting and notification indicator.
2. **My Child’s Ride** card (child selector, school, session, status pill: Waiting / On the Way / Picked Up / Reached School / Homeward / Dropped Home / No Active Trip; latest CONFIRMED event and time). If multiple children, horizontal selector chips.
3. Main action row: **CALL DRIVER** (green), **TRACK VEHICLE** (blue), **MARK LEAVE** (amber/soft). Three strong buttons, 44px+ hit areas; no tucked-away menu for daily needs. If driver phone absent, Call Owner instead.
4. A compact route tracking preview or distinct GPS stale/unavailable message. Map lazy-load only when opening Track.
5. Month fee summary `₹ due` / `Paid` + view Pay/Report Payment.
6. `Book Another Trip` service tiles: Wedding/Party, Outstation/Local, Goods, Urgent. Keep secondary to school operations.
7. Current private booking status, recent notices and useful support.

### `/app/home` when no school subscription
Greeting, compact services grid with **Get School Transport**, **Book a Trip**, **Goods Pickup**, **Urgent Ride**; existing booking/quote status below; recent payments and contact. Do not show empty student panels or fee due ₹0 pretending a subscription.

### `/app/school` subscriptions
A card per subscription: status, child limit/seats, school, route request, proposed/accepted monthly fee and agreed start date. Primary action `Request School Transport` if none; `Add Child` if approved and quota remaining; `View Children` if active. A customer who has both school and other services sees them in one dashboard.

### `/app/school/apply` school onboarding
Simple stepper with 3 sections: **Service area/school**, **Pickup & return needs + number of children**, **Review & submit**. Initial request collects *count* and route info, not full sensitive child dossier. Owner reviews route/capacity and quotes individual/aggregate fee terms. Customer sees Pending → Quoted → Approved. After approval, customer **adds student profile** (or owner enters it on their behalf) and owner finalizes seat/route assignments. The request should be allowed before student creation. Student access is optional, not automatic. Parent can add only within approved capacity; additional children require an amended request.

### `/app/school/children`, `/app/school/children/new`, details
Cards with nickname/name, school/class, route, pickup stop and approved guardian contacts; minimal, understandable form. Parent edits permitted contact information; schedule/fee/route changes submit request for owner review. Owner may add, edit, withdraw or deactivate a student with reason. Child deletion/anonymization subject to audit and retention policy.

### `/app/school/track` location
Header: child and morning/return trip status. Map or bounded visible unavailable state. Floating van pin only if server has fresh authorized GPS; `Updated 2 minutes ago`, optional `GPS Accuracy ~x m` and `Live / Delayed / Unavailable` labels. Timeline from real driver confirmations: Picked Up → Reached School → Picked Up for Return → Reached Home. Sticky **Call Driver** and optional **Call Owner** actions. If no GPS, show “Live location unavailable. Last update at …” + last known timestamp if within authorized retention; do not pretend the van moves or generate ETA from no data.

### `/app/school/leave`
Two-tap common flow: `Today` / `Tomorrow` quick chips + choose child(s) + optional reason + **Submit Leave**. Date calendar for future absence, cancel/edit within allowed cutoffs. Confirm success with `Driver/Owner will be notified` only if actual notification delivered/queued; show pending if not. Student-initiated leave requires guardian confirmation.

### `/app/bookings` main screen
Tabs `Upcoming | Requests & Quotes | Completed | Cancelled`; compact booking tiles show service, dates, pickup/destination, price status, advance/remaining, assigned vehicle if confirmed and action `View Booking`. One action `New Booking` on top. Customer can have multiple concurrent bookings without confusing school subscriptions.

### `/app/book` general booking wizard
Step 1 choose service: `Wedding/Event`, `Party/Private`, `Local/Outstation`, `Goods Pickup`. Step 2 contextual form (pickup, destination or city, time/date, passenger count or cargo, one-way/round-trip, vehicle preference). Step 3 price preview from owner-configured base, rate/km and routing estimate (if available), explain tolls/night/waiting and subject to quote. Step 4 Submit Request (owner quote) or Confirm & Pay Advance based on policy. Progressive disclosure: do not ask weight for wedding, passenger count for goods, or irrelevant school fields.
- City text entry available without map selection. For valid routing distance, show `Estimated road distance`; if provider unavailable, mark `Distance currently unavailable—owner will send a quote`, never invent kilometers.
- Price panel: base, chargeable km, per-km rate, estimated extras, indicative total, advance requirement, verified collected, balance.
- Owner receives request, reviews schedule + school duty conflicts, sends final quote; customer accepts or rejects. Booking may need verified advance to become Confirmed. Customer receives confirmation/driver details after availability is validated.

### `/urgent` VERY FAST unauthenticated request
IMPORTANT separate from normal booking wizard. Big **CALL NOW** link to configured operator and official medical emergency services guidance. Small optional form: pickup address/current location, reachable phone, optional destination + optional notes; single `Request Urgent Transport`. Zero mandatory advance, fare estimate, date picker or signup before help. Explicit **not an ambulance** label unless operator has authorized medical vehicle capability. If operator cannot respond, say so promptly; no “Help is on the way” without actual acceptance. Medical emergency directs to official emergency/ambulance number/service immediately, not replaced by ordinary passenger booking.

### `/app/payments`
Tabs `School Fees | Trip Payments | Payment Claims | Receipts`. One clear school fee card per child per month and trip payment card per booking; show amount due, paid verified, pending claim, remaining. Tap `Pay / I Have Paid`: owner-controlled UPI ID/QR and Copy UPI ID, instructions for cash/bank. Submit mode, amount, date, optional UTR/photo proof; state explicitly **“Reported—waiting for owner verification”**. Owner can add transaction after phone call, cash handover; user sees verified/partially paid and receipt only when confirmed. Never claim UPI success via deeplink or self-reported UTR alone.

### `/app/account`
Profile + preferred language, linked children, contact settings, notices, help/contact owner, security/logout. No developer role controls.

## 5. Owner Admin UI (desktop information-rich, mobile action-friendly)

### Global shell
- 252px white sidebar with blue brand header using supplied van artwork; compact icon labels; active item deep blue pill; section groupings and collapsible submenu. White sticky topbar with breadcrumb, global scoped search, date, notifications, user menu and `+ New` quick action.
- Main background `#F5F8FD`, cards 20px radius, max 1440–1600 content. Tables 14px+ body readable, sticky filters, 20 rows default pagination; hover row quick actions.
- Owner mobile: drawer/sidebar and four bottom tabs `Home | Runs | Bookings | More`; payment verification and emergency alerts surfaced on Home. Desktop-only dense tables become card rows or scroll with cue.

### Side navigation (grouped)
**OVERVIEW:** Dashboard; Live Operations; Calendar.
**SCHOOL:** Subscriptions; Students & Guardians; Routes & School Runs; Leave Requests.
**BOOKINGS:** Requests & Quotes; All Bookings; Customers.
**MONEY:** Payment Verification; School Fees; Advances & Invoices; Expenses; Reports.
**FLEET & SYSTEM:** Vehicles & Drivers; Notifications & Enquiries; Settings; Users & Audit.
Show unread/pending counts where genuine. Do not dump 20 ungrouped nav items or create redundant financial modules.

### `/owner/dashboard`
At top: Greeting, date range and `+ Booking`, `+ School Subscription`, `Record Payment` actions. KPI row: Active Students, Today's Runs, Bookings Awaiting Response, Collections (selected period), Pending Verification, Total Outstanding. KPI values from DB; honest empty state if none. Main grid: current school runs + stop progress, upcoming bookings, live vehicles map with freshness, pending fee/payment actions, monthly revenue by category, recent activity and important reminders. Primary quick workflows accessible within one click.

### `/owner/live`
Full width location/operations board, vehicle chips and `School | Private | All` filter. Only real fresh map markers, last-seen/accuracy; list of ongoing runs/trips with Call Driver, open details. Offline vehicle never shown as moving. Device-dependent reliability warnings.

### `/owner/calendar`
Day/week/month views; recurring school routes shown as fixed duty windows, one-time bookings and maintenance. Clear overlap warnings. Manual `Owner override` requires reason, permits documented exceptions ONLY where safe/legal/physically feasible—never assign one vehicle to two physically impossible overlapping active journeys.

### `/owner/school/subscriptions`
Status tabs `New | Quoted | Approved | Active | Paused | Closed`; table/cards: guardian, school, zone, requested children, fee agreement, assigned route/driver, start date. Side drawer detail with `Quote fee`, `Approve`, `Request information`, `Pause`, `Reject`; after approval student-add access opens; assignment requires seat checks. Support owner-created offline subscription.

### `/owner/school/students`
Searchable table: Student, Guardian, School/Class, Route/Stop, Monthly Fee, Status, Actions. Drawer tabs: Profile, Guardians, Subscription, Journey History, Payment History, Audit. Owner add/edit/withdraw/deactivate; regulated deletion or anonymization workflow without destroying historical trip and finance records.

### `/owner/school/routes`
Route cards with morning/afternoon, ordered stops, assigned vehicle/driver, capacity and run schedule; route builder with stop reordering and student assignments. Daily Runs screen combines today's date/session toggle, roster and each child's attendance events. Correcting driver's event creates correction record, reason and audit—not invisible overwrite.

### `/owner/school/leaves`
New/Tomorrow/Approved/History; list with parent/student source, date, notification status, owner approve/reject and optional note. Owner can register leave on customer's behalf.

### `/owner/bookings/requests`
Pipeline with `New → Quoted → Awaiting Advance → Confirmed → Scheduled → Ongoing → Completed` plus rejected/cancelled. Split list/detail: contact, trip category, itinerary, eligible vehicle, availability conflicts, customer proposed details, owner quote builder, advance settings and status action. Urgent requests pinned with immediate call, not mixed silently into ordinary quote queue.

### `/owner/bookings`
Table columns: Ref, Customer, Service, Date, Pickup→Destination, Vehicle/Driver, Total Fare, Advance Verified, Balance, Status, Actions. Filters: service, dates, status, vehicle, payment state. Detail tabs: Itinerary, Quotes, Payments, Dispatch, Tracking, Invoice, Audit. Owner can create bookings from phone calls. Cancellation/reschedule and refunds are recorded with policies.

### `/owner/customers`
Customer name/mobile (privately protected), services used (School/Bookings/Both), total active subscriptions, requests, payment status; actions to call, view history, create booking, reset invited access, deactivate. Never expose one customer's data to another.

### `/owner/finance/verify`
Highest-priority financial action board: pending claims queue with source `School Fee` vs `Booking Advance/Balance`, submitted amount, method, UTR, customer note, proof attachment if provided, bank/cash check boxes, `Verify` / `Reject` / `Need Clarification`. Owner manual payment entry (when customer paid offline). All updates atomic/idempotent and auditable.

### `/owner/finance/fees`
Month selector, students billed, due, verified collections, future advances, adjustments. Table `Student | Parent | Agreed Monthly | Paid | Pending | Due | Status | Record/Review`. Owner may change future fee rates with effective date; retroactive billed changes are adjustment records, not hidden rewriting. Printable statement.

### `/owner/finance/advances`
Booking cards/list with agreed fare, advance required, verified collected, pending claims, remaining, refunds and final settlement. Never double-count advance as a second revenue event when final settlement occurs.

### `/owner/finance/expenses`
Add expense (fuel/tolls/maintenance/driver/other) with vehicle, related booking if any, amount, paid method/date and optional proof. Charts for actual cash movement and service-wise contribution with correct definitions.

### `/owner/reports`
Tabs/filters: school pickup/drop, attendance/leave, monthly fee, outstanding, bookings by service, advances and balance, payment verification, revenue, expenses/profit, vehicle/driver utilization, notifications. Print/PDF/CSV, date range, vehicle, customer, status and search. No dummy charts.

### `/owner/fleet`
Vehicles grid/list with photo, registration, seating/payload suitability, driver, current status, school duty, bookings, maintenance and documents. Drivers profile, assignments, availability, contact and compliance document reminder fields. Prevent impossible or illegal assignments.

### `/owner/notifications`
Broadcast school delay/holiday notices to relevant guardians, customer booking notices, payment reminders, opt-in push when supported; in-app delivery/read statuses; operator contact enquiries. Do not claim free automatic SMS or WhatsApp API delivery.

### `/owner/settings` and `/owner/users`
Business name/logo, contact phone/WhatsApp/UPI QR, business service settings and public content, geographic coverage, rates per km/base/hour/day, special charges, booking advance/cancellation/refund policies, school fee due/reminder policies, language, driver GPS settings, data retention/backup. User management: invite driver, change access, deactivate, delete eligible personal data and audit. **Override confirmation dialog:** original state, proposed change, impact, required reason, `Confirm Override`; mark corrected records explicitly. Cannot override reality (fabricate GPS/payment receipt or clear legally retained audits).

## 6. Driver Mobile UI

### Shell
Narrow, one-handed, high-contrast; top header `Today's Duty`, GPS status and call control; 3 bottom tabs `My Day | Live Trip | More`. No finance screen.

### `/driver/today`
Today's shift hero: assigned vehicle, route, upcoming task, time, status and one big **Start Run / Start Trip** action. Below `Morning School | Afternoon Return | Other Bookings` tabs and schedule cards. Show school roster count and route contacts only as authorized. GPS permission explanation and Start Sharing button linked to real active duty (must not start tracking outside active trip).

### `/driver/run/:id`
Route progress header, stop list, student roster with each child's name, pickup point, color-coded *server-confirmed* status. Big actions `Picked Up`, `Reached School`, `Return Picked Up`, `Dropped Home`, `Missed Pickup` with relevant guardrails; use confirm dialog where needed. `Call Parent`/`Call Owner` direct dial; delay and incident actions. Driver must use phone only when safely parked.

### `/driver/trip/:id`
Booking itinerary, customer call, pickup/destination, start/pause/end status, safe-stop updates, GPS timestamp, notes, incident, end-trip confirmation. No owner-only fare edits.

## 7. Optional student view
Short read-only shell: `My Ride | Leave Request | Notices | Help`; no forced separate portal for small children. Linked to approved student; any leave request requires parent's confirmation. No right to edit attendance or paid receipts.

## 8. Shared screen state and interaction requirements
- Standard UI states: loading skeleton, no results with actionable next step, permission denied, service offline, invalid form, success, duplicate submission prevention, retry, stale GPS, pending verification, cancellation confirmation.
- Call button uses actual configured number with `tel:` and no dead control; WhatsApp only when configured and user explicitly taps.
- Input forms use friendly labels and native numeric/date keyboards where possible. Sticky mobile bottom CTA only if it does not cover nav or content.
- Search, pagination and filters persist per page as appropriate. Expense/fee values display ₹ using `en-IN`; dates in local business timezone; store server timestamps UTC.
- Cross-view updates happen through RTK Query tags/refetch; do not silently cache sensitive data in localStorage. No Redis/Docker/SQL/TanStack Query.
- Permission errors have clear user message; no exposing protected children, addresses or active GPS to unrelated customers.

## 9. Exact critical interaction flows (acceptance)

1. New customer registers → logs in → sees general services (no empty child profile), creates school subscription request → owner sends fee/availability approval → customer adds student(s) within capacity → owner finalizes assignment → parent's home gains Call/Track/Leave and monthly-fee blocks.
2. Existing parent books a wedding from SAME account → city/location estimate → owner quote → customer accepts → advance payment reported → owner verifies → confirmed booking appears in customer dashboard and owner's calendar; no vehicle conflict with school route.
3. Customer reports UPI school fee → shows `Pending Verification`, not paid → owner verifies → both ledgers and receipt reflect verified money, with no duplicate count.
4. Parent opens Track during active school run → fresh authorized location shows marker/time; GPS disabled/background stopped shows `Unavailable`/stale and Call Driver, plus real pickup/drop timeline. Never fake live dots or progress.
5. Emergency caller opens public urgent help → can call before signup → optional minimal transport request; no quote wizard or upfront advance; official emergency services indicated for medical emergencies.
6. Driver safely marks picked up, reached school, return boarding, home arrival → parent sees confirmed events; owner corrects mistake only with reason and audit.
7. Owner creates customer/student/booking offline and edits data; owner deactivates/deletes eligible user via clear confirmation and access is revoked, while retained booking/financial history remains auditable.

## 10. Screen-by-screen navigation map

| Workspace | Screen | Route / entry |
|---|---|---|
| Public | Home, Services, Vehicles, Contact, FAQ/policies | `/`, `/services`, `/vehicles`, `/contact` |
| Identity | Login, Signup, Reset Password | `/login`, `/signup`, `/forgot-password` |
| Emergency | Call + fast request | `/urgent` (public) |
| Customer | Adaptive Home | `/app/home` |
| Customer | School Overview, Request, Child Profiles | `/app/school`, `/app/school/apply`, `/app/school/children` |
| Customer | Track, Leave, Notices | `/app/school/track`, `/app/school/leave`, `/app/notices` |
| Customer | Booking List, New Booking, Booking Detail | `/app/bookings`, `/app/book`, `/app/bookings/:id` |
| Customer | Payments, Claims, Receipts, Account | `/app/payments`, `/app/account` |
| Owner | Dashboard, Live Operations, Calendar | `/owner/dashboard`, `/owner/live`, `/owner/calendar` |
| Owner | Subscriptions, Students, Routes/Runs, Leave | `/owner/school/subscriptions`, `/owner/school/students`, `/owner/school/routes`, `/owner/school/leaves` |
| Owner | Requests, Bookings, Customers | `/owner/bookings/requests`, `/owner/bookings`, `/owner/customers` |
| Owner | Verification, Fees, Advances, Expenses | `/owner/finance/verify`, `/owner/finance/fees`, `/owner/finance/advances`, `/owner/finance/expenses` |
| Owner | Reports, Vehicles/Drivers, Notifications | `/owner/reports`, `/owner/fleet`, `/owner/notifications` |
| Owner | Settings, User Management & Audit | `/owner/settings`, `/owner/users` |
| Driver | My Day, School Run, Private Trip | `/driver/today`, `/driver/run/:id`, `/driver/trip/:id` |
| Student | Optional Own Ride, Leave, Notices, Help | `/student/home`, `/student/leave`, `/student/notices` |

## 11. Mandatory device / UI verification

- Compare HTML reference role screenshots to rebuilt screens at identical viewports; original is a visual starting point, NOT a production auth/content blueprint.
- Test **320, 360, 390, 768, 1024, 1366, 1440px** widths. No overflowing 320px page, hidden sticky submit, invisible CTAs or broken overlays.
- Parent daily tasks accessible in **at most 1–3 prominent taps** from Home where service is active.
- Customer can discover and submit wedding/local/goods bookings without entering school flows.
- Owner dashboard meaningful with full data, sparse data and zero data; all date/amount figures real MongoDB state.
- Keyboard, touch, screen reader names, accessible contrast, reduced motion, forms errors, full logout and server-side authorization tests.
- Validate unavailability and failure flows with network off / GPS off / server unavailable. Never misrepresent cached state as current.
- Where UI actions require a service not configured, show an honest disabled/explanatory state—not false success.

## 12. Non-negotiable stack and cost constraints

**Frontend:** React + Vite + TypeScript + Tailwind + custom themed shadcn/ui, React Router, Redux Toolkit + RTK Query (exclusive server-state and client caching), React Hook Form + Zod, Lucide icons, Leaflet maps where supported.  
**Backend:** Node.js + Express + TypeScript + Mongoose + MongoDB; REST API with secure role/relationship checks.  
**No:** Redis, Docker, SQL/Prisma SQL, TanStack Query, competing data-cache library, payment gateway, compulsory paid maps, SMS or WhatsApp API.  
**Hosting:** inexpensive topology, with commercial usage terms and reliability constraints explained before deployment. Tracking in browser is best-effort; guaranteed background tracking requires later native app or tracker.

---

**Final design acceptance sentence:** A parent should open one simple customer dashboard and immediately see the child's status plus three large actions **Call Driver / Track Vehicle / Mark Leave**, while also retaining general booking features; a driver sees today's duty and large safe-stop controls; the owner sees a polished, auditable, dense business workspace for school transport, all bookings, money, staff, vehicles and exceptions. One visual language, one login system, real data, no pretend tracking or payment confirmation.
