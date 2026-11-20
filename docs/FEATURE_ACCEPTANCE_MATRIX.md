# SafeRide feature acceptance matrix

## Audit-based Phase 01 update — 16 November 2026

17 November follow-up: the fee form now uses an editable ₹1,500 example placeholder and exact rupee-to-paise parsing; a counter reason may be left empty. Focused school tests and live browser/Mongo checks passed. See the Phase 01 evidence notes.

| Workflow | Current evidence | Remaining limit |
|---|---|---|
| Customer school proposal and service choice | Shared Zod, Mongo model and authenticated UI save positive paise per child, morning/afternoon/both, source, version and history. ₹1,500 direct approval through assignment, activation and charge passed isolated API/Mongo tests. | Fresh browser clicks stop after price decision; activation is API-tested. |
| Owner counter / customer decision | ₹1,800 counter, exact-version acceptance, decline, expiry, stale retry, wrong customer and duplicate decisions passed school API tests. Fresh Chrome clicks and Mongo assertions passed for counter/accept. | One simultaneous two-request decision race passed; production load behavior remains unverified. |
| Legacy and financial integrity | Missing proposal fields read as legacy without writeback; legacy test compares stored amount/version before and after. Existing fee charge/receipt tests passed in the full suite. | No production migration run or real-data verification. |

The final full Vitest run passed 20 files and 97 tests. See [Phase 01 evidence and migration notes](phase01-proposal/README.md). Older rows below are historical Prompt 00–23 statuses.

This matrix began as the Prompt 00 plan on 8 November 2026. Most rows retain their 10 November 2026 audit status and are historical; later phase reports and code supersede their “Missing” labels. Prompt 12 was rechecked on 15 November 2026. These checks do not establish release readiness. The final HTML in this root is the read-only visual reference. `Customer` is the single customer/parent identity.

| Workflow / phase | Acceptance test and negative case | Current status |
|---|---|---|
| Foundation and design / 01 | npm workspaces in this root; React/Express start; true Mongo readiness; RTK Query only; 320–1440px shell screenshots; no forbidden dependencies | Implemented; build/typecheck/lint/API tests and phase01 screenshots |
| Public site, service and fleet / 02 | Business-configured public content/vehicles render; no demo phone; booking/school/urgent CTAs resolve; mobile nav works | Implemented for current public scope; public API and browser checks, phase02 screenshots |
| Contact enquiry / 02, 17 | Valid enquiry persists and owner sees it; invalid or repeated spam rejected/rate-limited | Enquiry persistence and owner read implemented; broader notice workflow remains Prompt 17 |
| Identity / 03 | Customer signup and unified login; server-derived customer/owner/driver/student destination; wrong credentials and role selector attempts fail | Implemented for customer/owner/driver; optional student account remains later |
| Sessions and access / 03, 20 | HttpOnly cookie, expiry, CSRF/origin guard, revocation on logout/deactivation; IDOR and cross-business attempts denied | Core session controls implemented and API-tested; full cross-role regression remains Prompt 23 |
| Owner bootstrap and invitations / 03, 20 | Private one-time bootstrap; owner invites driver/student where permitted; public owner signup denied; reset token expires | Owner bootstrap and driver invitations implemented; optional student provisioning remains later |
| Adaptive customer home / 04 | No-school customer sees general bookings; approved active school customer sees linked child, Call/Track/Leave and fees; 390px controls do not clip | School/no-school dashboard and actions implemented; booking and finance summaries await their phases |
| School request and quote / 05 | Customer submits request; owner quotes fixed per-child fee and slots; customer accepts; unapproved request cannot create active service | Implemented; transaction and browser tests passed |
| Student linking / 06 | Approved guardian adds child within approved slots; owner assigns route/seat; unrelated customer and excess slot attempts denied | Implemented; student and fleet API tests, phase06/07 screenshots |
| Fleet, routes, conflicts / 07 | Suitable legal vehicle and driver assigned; school duty/booking overlap rejected; unavailable/maintenance vehicle rejected | Implemented: `apps/api/src/fleet.test.ts`, 320–1440px screenshots in `docs/phase07/` |
| Driver school run / 08, 16 | Assigned driver starts run and records ordered pickup/school/return/home events; duplicate/out-of-order and unassigned driver denied | School run engine implemented; runs API tests and phase08 screenshots; private trips await Prompt 16 |
| Safety correction / 08, 20 | Owner corrects event with required reason; original remains queryable; boarded student cannot silently become absent | Run correction implemented and API-tested; broader owner power actions await Prompt 20 |
| Guardian and student leave / 09 | Guardian submits/cancels under cutoff; student request awaits guardian approval; post-boarding leave cannot rewrite attendance | Implemented and API-tested; optional student login/provisioning remains later |
| GPS / 10 | Consent and active assignment required; accuracy/time stored; fresh location scoped to related guardian/owner; stale/offline/denied shows truthful fallback | School-run GPS implemented and API-tested; phase10 screenshots; private booking integration awaits Prompts 12/16 |
| General booking wizard / 11 | Wedding, party, private, local/outstation, goods contexts; no unrelated fields; routing unavailable gives no fabricated km/fare | Request API and 4-step wizard implemented; API tests and 320/360/390/768/1024/1366/1440px captures; no routing source configured, so estimates remain unavailable |
| Quote and dispatch / 12 | Owner quote versions; customer accept/reject; advance rule and verified receipt gate confirmation; duplicate request/idempotency and vehicle conflict tested | Implemented and API-tested in `apps/api/src/bookings.test.ts`; active-trip cancellation guard corrected on 15 November. Empty-state booking and owner request screens inspected at 320/390px in `docs/phase21/`. Full UI click-through is still a Prompt 23 release gate. |
| Goods suitability / 11–12 | Cargo details and lawful capacity/vehicle checks; ineligible passenger vehicle dispatch denied; delivery evidence recorded | API implementation present; live cross-role goods eligibility and ordered checkpoints passed in `docs/E2E_RELEASE_REPORT.md`. No uploaded proof file is claimed. |
| Public urgent help / 13 | Call action works without login when configured; minimal request persists; medical emergency guidance shown; no promised response before acceptance | Missing |
| Manual payment claim / 14 | Customer reports UPI/cash/bank school or booking payment; claim remains pending and does not increase verified revenue | Missing |
| Owner payment verification / 14 | Owner checks actual receipt then atomically verifies/rejects; duplicate references/retries do not create duplicate receipt or allocation | Missing |
| Monthly school fees / 15 | Effective-date fixed monthly charges, partial payments, credits/carry-forward, future rate change and audited adjustment; leave does not auto-discount | Missing |
| Booking money and invoice / 12, 15, 19 | Quote, advance, balance, refund/cancellation fee reconcile in paise; advance counted once; receipt/invoice only after actual verification | Missing |
| Driver private trip / 16 | Assigned driver sees only assigned booking, starts/ends with safe-stop actions and incident notes; cannot edit money | Missing |
| Notices and reminders / 17 | In-app notices reach scoped recipients/read status; optional external channel not claimed unless configured; WhatsApp requires explicit tap | Missing |
| Owner operations / 18 | Real KPIs, live board, calendar, school and booking queues; zero/sparse/full data; scoped search and pagination | Missing |
| Expenses/reports / 19 | Expense persists with vehicle/date/category; report totals derive from verified ledger and expense records; CSV/print filters match data | Implemented for owner finance routes; finance API tests and Chrome print check passed. See `docs/phase19/README.md` for remaining limits. |
| Audited owner overrides / 20 | Required reason, original/proposed/actor/time stored; deactivation revokes sessions; audit and financial/safety evidence retained | Missing |
| UI parity and accessibility / 21 | Compare HTML and React at 320, 360, 390, 768, 1024, 1366, 1440; keyboard, labels, contrast, reduced motion, no clipped CTA/nav | Missing |
| Performance/resilience / 22 | Indexed Mongo queries, pagination, RTK tag invalidation, scoped low-frequency polling, backend offline/error states; no secondary cache | Missing |
| Cross-role E2E / 23 | Signup→school→student→run; same customer wedding→quote→verified advance; school fee claim→verification; urgent public; owner correction | Missing |
| Release / 24 | Backups/restore, privacy retention, config and same-origin deployment, real business contact; no banned infrastructure or fake readiness | Missing |

## Phase 08 Hindi-first UX check (17 November 2026)

The main parent, owner, student and duty journeys now have a persisted Hindi/English switch, destination-first booking, direct school actions, truthful GPS/fee states and phone booking consent enforcement. The isolated browser run checked seven widths, both languages, real API sessions, an aborted leave write and offline banner; 109 tests passed. See [Phase 08 evidence](phase08/README.md). Detailed booking, finance, school administration, notices, recovery and printed record strings are still partly English, so full bilingual acceptance remains open. This section records the current Phase 08 implementation and does not supersede historical missing entries below.

## Historical Prompt 00 audit (8 November 2026)

- Root contains one final HTML, final blueprint, final master pack, one older prompt pack, and four supplied PNG previews. This audit added only `docs/` and six Chrome reference screenshots. No `AGENTS.md`, `PRODUCT_SPEC`, `ARCHITECTURE`, `PERMISSION_MATRIX`, TODO/phase checklist, `package.json`, lockfile, `apps/web`, `apps/api`, `packages/shared`, assets directory, source code, `.env`, tests, or Git metadata were present. `git status` reports “not a git repository”; there is no uncommitted code to overwrite.
- Existing “working” implementation is the standalone browser simulation only: inline CSS/JS, seeded `localStorage` records, hash navigation, local form mutations and preview roles. It is not a MERN app, cannot establish server permissions or real payment/GPS state, and is retained unchanged as reference. Thus dependency quality, app build/runtime, credentials strategy, and DB connectivity are **not testable yet**. Demo credentials and contacts must not become production credentials/contact details.
- Blueprint header cites an older simulation filename. Resolve that conflict using the final master contract and the actual `SafeRide_Complete_Interactive_UI_Simulation.html`. The older prompt pack remains historical. No other repository documentation exists to reconcile; Prompt 01 should create a README and architecture/permission documentation aligned to the final rules rather than carry obsolete text forward.
- Required architecture: React/TypeScript/Vite, React Router, Redux Toolkit with RTK Query as sole server cache, Express/TypeScript, MongoDB/Mongoose, Zod, Tailwind themed to the HTML, manual payment verification. No Redis, Docker, SQL, TanStack Query, paid payment gateway, or compulsory paid provider.

## Historical Prompt 01 initialization plan (completed)

1. Initialize npm workspaces **in this same root**: `apps/web`, `apps/api`, `packages/shared`; add scripts, `.env.example`, README, `.gitignore`, and Git initialization only if appropriate. Preserve every supplied reference file.
2. Implement minimal runnable React/Express/Mongoose/shared-contract foundation with secure configuration and truthful database readiness; do not seed fake production roles or claim non-existent flows.
3. Build tokenized public/customer/owner/driver/student shells from the HTML, central RTK Query store, and honest unavailable states while auth/data flows await later phases.
4. Run build/typecheck/lint/tests and browser screenshots at required widths; document actual results and stop at Prompt 01.
