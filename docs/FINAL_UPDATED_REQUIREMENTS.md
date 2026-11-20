# SafeRide Kids — final updated requirements

**Authority:** user's 16 November 2026 audit request, then root `AGENTS.md` stack/security invariants. The older master prompt pack, Premium UI/UX Blueprint and HTML are historical/visual references where they disagree. The HTML is read only and never supplies live identities, money, location or fares.

## Product and scope

**SafeRide Kids — School Transport Tracking & Local Ride Booking** is for one independent Indian transport business, initially operating a Maruti Suzuki Eeco, with optional additional eligible vehicles and drivers. School-student safety is the highest priority; the same customer account books local/private/wedding/event/tourism/outstation/station/airport and urgent ordinary transport. Goods appear only for a legally suitable configured vehicle. No public owner marketplace, owner signup or SaaS super-admin. Owner may drive using their authenticated account.

## Roles and authorization

- **Owner:** business-scoped administration of students, guardian links, fee agreements, school routes/runs, vehicles/drivers, bookings, finances, communications, reports and settings; can use Trip Mode when explicitly authorized as driver.
- **Customer/parent:** one identity and sign-in for school and general rides; proposes school monthly fee, accepts/declines counteroffers, manages authorized children and leave, sees own journeys, reports payments and contacts operator/assigned driver.
- **Student:** restricted account linked to an approved child and authorized guardian/subscription; own journey/location, absence request requiring guardian confirmation, notices, simple fee reminder and authorized contact numbers only.
- **Driver:** minimal, revocable authenticated Trip Mode for assigned duty, GPS consent and explicit boarding/drop or private-trip events. Separate extensive dashboard is optional; owner-as-driver shares the same controls. No public tracking link.
- One login form derives role from server session. Every protected read/write checks session, role, business and record relationship. Sensitive child, payment, GPS and schedule fields are never public.

## School enrollment and price agreement

Customer chooses child count, school/reference, pickup/return service (morning, afternoon or both), location/landmark, preferred start and **proposed individual monthly fee in integer paise**. Owner may approve, reject or counter the proposal. A counter has version, amount, expiry/effective date, reason and history; customer explicitly accepts or declines. Final agreement and owner authorization are recorded before child slots, route/vehicle/driver and activation. Owner-assisted requests record the customer's proposal/consent context without pretending the owner is the customer. School is destination only; parents pay owner directly. Future revisions create versions and never rewrite prior charges or verified payments. Capacity and eligible vehicle/driver/schedule are checked atomically.

## Daily safety operations

Morning and afternoon school runs have dated rosters, confirmed absences, active assigned operator, explicit boarded/school-arrived/return-boarded/home-dropped events, timestamps, notifications and end state. Vehicle location and student events are independent. No inferred boarding from GPS, duplicate event, silent retroactive edit or post-boarding absence. Corrections append actor/reason/original reference. Trip GPS requires active assignment, consent and timely observation; family sees only the authorized current trip and clear fresh/stale/disabled/unavailable states. Sharing stops at completion. Browser location is best effort under lock/background/offline conditions; no continuous-tracking guarantee.

Parent may submit and cancel leave within policy. Student leave awaits guardian confirmation before roster removal. Owner phone report records source and audit. Duplicate/date and after-boarding rules apply. Leave never automatically reduces agreed monthly fee.

## Booking and pricing

Public and signed-in entry starts with **“Where are you going?”** Pickup can use consented current location or typed village/landmark; destination search/manual entry, service, schedule, passenger/cargo/package details follow progressively. Backend calculates estimates from **actual routed road kilometres only when a compliant provider is configured** plus applicable base/per-km/minimum/round-trip/waiting/hourly/day/toll/parking/night rules. If route distance is unavailable show exactly **“Distance unavailable — owner will confirm the fare.”** Never present straight-line or fabricated kilometres as road distance. Owner quote/revision and customer acceptance, verified advance, suitable vehicle/driver assignment, schedule conflict check, trip and balance states follow. Urgent public path has prominent Call Owner Now, short callback and official emergency guidance; no ambulance guarantee or login barrier for calling.

## Fees, payments, notices

Each approved child has a versioned monthly fee, due date, charge generation, partial/full payments, prior dues, credits/advance, owner adjustments, history and receipt. Configurable reminders before due date go to guardian and optionally student, deduplicate by scheduled occurrence and stop incorrect reminders when settled. Booking quote/advance/final/refund/cancellation accounting is in integer paise. Direct owner UPI/cash/bank only for initial release; customer claim stays pending until owner verifies actual receipt. Payment gateway, compulsory SMS and fabricated delivery states are excluded.

## Public experience and local accessibility

Premium original blue/navy/white design with restrained green; preserve effective `#125fd4`, `#142544`, `#f5f8fd`, `#0c9866` tokens. Homepage order: navigation with Book a Ride; Eeco-led hero with Book a Ride, School Transport and Call; quick destination-first booking; school safety/tracking preview; services; real vehicle; separate school/other how-it-works; truthful trust; contact/footer. Owner-provided Eeco photographs take priority; otherwise label sourced illustration/placeholder accurately. No invented reviews, fleet size, specs, permits or GPS guarantees. Every CTA has a working destination; forms expose loading/error/success and reduced-motion behavior.

Hindi-first with English option, readable Devanagari type, common-language labels, large touch controls, 1–3 tap daily actions, minimal scroll, clear call buttons, manual village/landmark input, visible stale/offline states and appropriate keyboard types. Test widths 320, 360, 390, 768, 1024, 1366, 1440px. No clipped action under bottom navigation or horizontal overflow.

## Technical and release contract

Retain React/TypeScript/Vite, React Router, Redux Toolkit with one RTK Query cache, Tailwind, Express/TypeScript, MongoDB/Mongoose, shared Zod contracts, Leaflet for authorized genuine map points, Playwright/Vitest/API tests. No Redis, Docker, SQL/Prisma SQL, TanStack Query/SWR/Apollo cache, Zustand/MobX/BullMQ or mandatory paid integration. Indexed scoped queries, pagination, validation, CSRF/session/rate-limit/security headers, idempotency, transactional finance/scheduling, retention, production config and honest readiness required. Release needs current browser + API/database + real-device operational evidence; build pass alone is insufficient.

## Explicit conflicts with earlier material

1. Older prompt pack and current code have **owner-first school quotation**; updated rule is **customer-first proposed fee** with owner approve/reject/counter and customer acceptance where countered.
2. Current README/React removed booking, vehicle and urgent UI; updated product requires all three now. Retain existing API/data and restore reviewed access.
3. Older blueprint shows full Driver Mobile UI; updated initial scope calls for minimal secure Trip Mode, while keeping school event/GPS controls and separate-driver access.
4. Older blueprint calls student view optional; updated requirement makes restricted student login/home, leave, notice and fee reminder in scope.
5. Existing public site is school-only and branded SafeRide; updated brand is **SafeRide Kids**, combining school tracking with local booking.
6. Existing terms and school content say owner supplies initial fee; update after workflow change.
7. HTML's seeded people, vehicles, amounts, reviews, locations and demo interactions are never operational proof; new requirements prohibit fabricated live status/fare/location and unsupported trust claims.
8. Existing static illustration and sample fleet screenshots are not evidence of owner Eeco photo, seats or legal suitability; publish only verified business assets/details.
