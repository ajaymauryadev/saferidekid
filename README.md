# SafeRide

Deployment preparation and release status: [deployment guide](docs/DEPLOYMENT_GUIDE.md), [operations runbook](docs/OPERATIONS_RUNBOOK.md), and [production readiness checklist](docs/PRODUCTION_READINESS_CHECKLIST.md). The release decision is **NOT VERIFIED**.

SafeRide is a React/Express/MongoDB app for one transport operator. The root HTML simulation is a **read-only design reference**; its demo users, GPS, fees and payments are not used by the React app. Customer accounts, school enrollment, fleet and route scheduling are implemented.

School transport includes student tracking and driver-confirmed events, enrollment, routes and seats, monthly fees with owner verification, daily driver duties, owner operations, and reports. Private booking, eligible goods requests and urgent assistance are also available. Use the readiness checklist before live operations.

## Start

1. Install Node.js 22+, npm 11+ and MongoDB with replica-set transactions enabled; run `npm install`.
2. Copy `.env.example` to the **project root** as `.env`, set `MONGODB_URI` and keep `WEB_ORIGIN` equal to the browser origin you will open. The API workspace commands load this root file. Do not commit `.env`.
3. Set verified `BUSINESS_NAME`, `PUBLIC_PHONE`, `PUBLIC_WHATSAPP`, `PUBLIC_AREA` and `PUBLIC_HOURS` as appropriate. Phone numbers use E.164 format. Leave unknown values blank.
4. Run `npm run seed:dev` to save the public business configuration. This creates no demo accounts, vehicles or financial records.
5. Run `npm run dev`; open `http://127.0.0.1:5173`. The API is at `http://127.0.0.1:4000`.

Contact enquiries are always stored for the owner under **Notices & Enquiries**. To also receive them by Gmail, set `ENQUIRY_EMAIL_TO`, `SMTP_USER`, and `SMTP_APP_PASSWORD` in the private root `.env`, then restart the API. `SMTP_USER` is the sending Gmail address; `SMTP_APP_PASSWORD` is a Google App Password, never the regular account password. If email delivery fails, the enquiry remains saved for owner review. Set `PUBLIC_WHATSAPP` to the verified E.164 number to show a WhatsApp link on the contact page.

`GET /api/health` confirms process liveness. `GET /api/ready` returns 200 only while Mongoose is connected. The web development server proxies `/api` to the API.

If public pages show “Unable to load,” check `http://127.0.0.1:4000/api/ready` before using “Try again.” A missing or unreachable database keeps readiness at 503. An empty Atlas database needs `npm run seed:dev` once to create the public business record; this command creates no users or vehicles. The fleet page then shows the honest unpublished state until the owner adds and publishes vehicles. Creating an owner requires the separate one-time bootstrap described below.

### Seed and reset commands

- `npm run seed:dev` creates or updates only the public business settings from `.env`. It creates no accounts, vehicles, journeys or payments.
- `npm run seed:sample` creates three clearly fictitious role accounts and two demo vehicles **only** in an empty loopback MongoDB database whose name ends in `_dev` or `_test`. Set `SEED_SAMPLE_PASSWORD` (12+ characters) in the process environment first. It refuses Atlas and production, and it does not send messages or create financial records.
- `npm run db:reset -- --confirm=DELETE-<database-name>` drops every collection in the connected database, including users, sessions, audit and financial records. Stop all running API processes first; Mongoose development auto-indexing can recreate empty collections after a drop. The exact name must match the active URI; the command refuses `NODE_ENV=production`. Run it only after checking the URI and preserving any records you need. An empty database requires `seed:dev` and owner bootstrap again before public business details or owner login work.

On `/urgent`, “Use my current location” requests browser permission and opens a map pin picker. A configured reverse geocoder may offer a map address as a hint; the customer enters the actual village or landmark before sending. The coordinates and reported GPS accuracy accompany the request. Address lookup and map tiles are best effort.

Reverse lookup is disabled until `REVERSE_GEOCODER_URL` points to a production-suitable HTTPS reverse endpoint that accepts `lat`, `lon`, `format`, `addressdetails` and `zoom` and returns `display_name`. Set `REVERSE_GEOCODER_API_KEY` if it accepts a bearer token. The API limits lookups to one request per second with a 24-hour in-memory cache. Do not point public traffic at the shared public Nominatim service. If lookup is unavailable, the customer can type a village or landmark and confirm a GPS pin.

Trip Mode needs explicit location permission on the assigned driver’s or authorized owner’s phone. Keep the trip page open in the foreground. Locking the phone, backgrounding the browser or losing connectivity can interrupt GPS updates. Families can check the last observation time and call the operator. The driver records boarding and drop-off separately.

## Accounts

Customers sign up at `/signup` with a mobile number including country code, optional email, a password of at least 12 characters, and explicit `/terms` and `/privacy` acknowledgements. Contact verification is shown honestly as incomplete. One customer account serves later school and private booking workflows.

To create the first owner, set `BOOTSTRAP_OWNER_NAME`, `BOOTSTRAP_OWNER_MOBILE` and `BOOTSTRAP_OWNER_PASSWORD` in a private process environment, then run `npm run bootstrap:owner`. The business must already exist from `seed:dev`. The command works only once per business. Remove the bootstrap variables afterward. There is no public owner signup or default password.

The owner uses the same `/login` form, then `/owner/users` to invite a driver or issue an assisted password reset. The API returns a one-time token for the owner to share through a trusted private channel; it sends no email or SMS. Drivers activate at `/accept-invite`; reset tokens are used at `/reset-password`. `/forgot-password` explains the owner-assisted process without claiming that a message was sent.

At `/owner/fleet`, the owner records vehicle suitability, allowed services, document expiry, private vehicle photos and driver qualifications. `/owner/school/routes` holds dated morning and return schedules with ordered stops, holidays and student seat assignments. `/owner/calendar` shows real school, booking and unavailable intervals. Route and booking assignments are checked against the same business-scoped availability model, including travel buffers; `docs/phase07/README.md` describes its verification.

Private bookings use an optional server-side HeiGIT openrouteservice road route. Set `ORS_API_KEY` in the private root `.env` to enable it, and configure vehicle and service rates in the owner workspace. Without a key, a route match, or an eligible configured rate, the booking request remains open for an owner quote. The estimate is indicative; owner quotes, customer acceptance and advance verification remain separate. See [Phase 05 verification](docs/phase05/verification.md) for the calculation, provider terms and limitations.

## School transport

A customer requests school transport at `/app/school/apply`. The customer proposes a monthly fee per child and morning, afternoon or both service. The owner reviews it at `/owner/school/subscriptions`, can approve the proposed amount, send a counteroffer or reject it. A counteroffer needs exact-version customer acceptance. The owner then authorizes a vehicle, qualified driver and seats; owner authorization reserves seats atomically; only then can either side add the approved number of child profiles. The owner activates service after every approved profile, assignment and agreed start date is ready. Rejection, pause, resume and cancellation have reasons, history and customer notices. A customer-reported payment remains pending until the owner verifies actual receipt in the payment verification workflow.

School writes use MongoDB multi-document transactions to keep quotes, notices, audit records and seat reservations together. Configure `MONGODB_URI` for a replica set (a single-node replica set is sufficient for local development). A standalone MongoDB server supports public/auth reads but will reject school write transactions. The test suite uses an isolated in-memory replica set.

School fee reminders use a protected daily HTTP job and best-effort customer access catch-up. Configure the job token and an external scheduler as described in [Phase 06 fee operations](docs/phase06-money/README.md); an always-on API process or paid messaging provider is not required.

Sessions use an HttpOnly, SameSite cookie, server-side expiry and revocation, origin and CSRF checks, bcrypt password hashes and login throttling. No auth token is saved in localStorage. Protected routes derive the workspace from the server role. Owner-as-driver duty requires an explicit audited ability grant and a fresh login.

## Checks and scope

- `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`
- `npm run verify:readiness` checks MongoDB connection transitions.
- `npm run verify:public` tests public pages and captures `docs/phase02/` screenshots.
- `npm run verify:auth` tests browser signup, role redirects, logout, owner login and driver activation; it captures `docs/phase03/` login comparisons.
- `node scripts/prompt23-e2e.mjs` tests the cross-role lifecycle in Chrome against a live API and isolated MongoDB replica set. The older `school-e2e.mjs` fixture is obsolete.
- `node scripts/school-visual.mjs` captures customer and owner status layouts in `docs/school-reference/`.

No development account credentials are seeded automatically. Tests create isolated in-memory MongoDB fixtures. Public services, business and vehicle listings expose only safe fields. Enquiries persist under `businessId` and are readable only through the authenticated owner route. School runs, leave requests and best-effort driver GPS are implemented for authorized active school duties, with stale and unavailable states. Customers can submit private booking requests; owner quotation/dispatch, payment verification and driver trip progress are implemented. Road routing requires an optional provider key; otherwise no distance or fare is invented. Full UI acceptance and production tracking reliability remain open; see the [current full verification report](docs/FULL_SOFTWARE_VERIFICATION_2026-11-15.md), [E2E report](docs/E2E_RELEASE_REPORT.md) and [parity matrix](docs/UI_PARITY_MATRIX.md).
