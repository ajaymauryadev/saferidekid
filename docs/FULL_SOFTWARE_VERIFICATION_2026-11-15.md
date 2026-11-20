# SafeRide full software verification — 15 November 2026

**Decision: NOT VERIFIED AS COMPLETE OR READY FOR LIVE TRANSPORT OPERATIONS.** This is a local code and browser verification run. The build, serial API suite, scripted cross-role lifecycle, and fixture-based responsive/interaction scans passed. The remaining acceptance gates below were not exercised or cannot be established locally.

## Commands and results

| Command | Result | Scope |
|---|---|---|
| `npm run build` | PASS | Shared, Express and Vite production builds. Vite reports a large initial chunk warning. |
| `npm run typecheck` | PASS | Shared, API and web TypeScript. |
| `npm run lint` | PASS | API, web and shared source. |
| `npx vitest run --no-file-parallelism --maxWorkers=1 --reporter=dot` | PASS: 20 files, 93 tests | Real `mongodb-memory-server` API integration and browser-free logic. [Output](full-test-2026-11-15.log). The initial parallel run had Mongo startup/test timeouts under contention; default Vitest configuration now runs test files serially. |
| `node scripts/prompt23-e2e.mjs` | PASS: 11 scripted groups | Real Vite, Express, Chromium, ephemeral MongoDB replica set; separate role sessions and database before/after checks. Customer school request, owner fee quote and approval, customer acceptance, child add and parent leave; driver morning start and boarding; four-step wedding request through quote, claim, verification and dispatch; and anonymous urgent request use live browser controls. A separate live booking retry remained idempotent. Final cash plus verified advance reconciled with the owner dashboard. [Latest output](full-e2e-ui-finance-2026-11-15.log), [machine results](e2e-evidence/results.json). |
| `node scripts/phase21-interactions.mjs` | PASS | Keyboard, menu, login validation, nested route reload, booking wizard step, offline banner and reduced motion with API layout fixtures. |
| `node scripts/phase21-visual.mjs` | PASS: 126 screenshots, 0 script failures | 18 routes/states at 320, 360, 390, 768, 1024, 1366 and 1440px, with API layout fixtures. [Measurements](phase21/results.json). |
| `npm run verify:readiness` | PASS | Readiness returns 503 disconnected, 200 connected, then 503 disconnected. |
| `node scripts/verify-prompt24-indexes.mjs` | PASS | Index migration for 32 models; session and GPS TTL indexes present. |

The live cross-role script covers customer signup; school request, quote, child, route and activation; leave; driver events and corrections; authorized GPS freshness/scope; wedding booking, quote, pending and verified advance, driver completion and receipt; goods eligibility and checkpoints; public urgent callback; owner phone booking and cash; session, CSRF and IDOR checks. Customer school request, owner fee quote and approval, customer acceptance, child add and parent leave, driver morning start and boarding, the four-step wedding request through dispatch, and anonymous urgent callback are clicked in Chromium and checked against MongoDB. [Owner school approval](e2e-evidence/owner-school-approved-390.png), [driver active duty](e2e-evidence/driver-morning-started-390.png), [pending customer payment](e2e-evidence/booking-payment-pending-390.png), [owner verification queue](e2e-evidence/owner-verification-pending-390.png), [confirmed owner booking](e2e-evidence/owner-booking-confirmed-390.png) and [urgent request confirmation](e2e-evidence/urgent-request-received-390.png) show live UI states. Other post-signup actions are HTTP requests using the browser contexts' actual cookie and CSRF token. They do **not** establish that every corresponding UI form control works end to end.

## Fixes during this verification

- Booking cancellation now permits only pre-trip states. An `IN_PROGRESS` trip cannot be cancelled and have its schedule assignment released. Regression test in `apps/api/src/bookings.test.ts` checks both the 409 response and retained block.
- Default Vitest file execution is serial to avoid concurrent MongoDB memory-server startup timeouts on this workstation.
- Customer booking detail no longer says payment claim and receipt verification are a future phase.
- The school child form now keeps its success message visible when the last approved slot is filled.
- The public urgent success notice stacks its content legibly at phone widths.

## Open acceptance gates

1. **Full UI click-through:** School request, owner fee quote and approval, customer acceptance, child add and parent leave; driver morning start and boarding; four-step wedding request through dispatch; and anonymous urgent request now pass through live browser controls. The script still uses direct authenticated HTTP for owner route management and activation, student guardian confirmation, goods, later driver milestones, other owner actions and corrections. Those forms, dialogs, buttons and error/retry states still need a live browser and database pass. Fixture screenshots cannot close this gate.
2. **Real device tracking:** Foreground test points and fresh/stale access rules passed. Actual driver consent, mobile browser suspension, network loss and background delivery reliability need device and operational tests; tracking remains best effort.
3. **Business configuration:** Real operator phone, UPI/bank details, vehicle permits, consent/terms, commercial hosting and backup/restore plan have not been provided or verified. Do not expose sample details as production data.
4. **Finance and retention breadth:** The live script reconciles a verified advance plus final cash payment with the booking due and owner dashboard collections. Refunds, report exports after account deletion, child/address/receipt retention and restore under an operational policy remain unverified.
5. **Visual parity:** The 126 capture scan checks overflow, image loading, headings, menu/history behavior and page errors with fixtures. It does not certify exact reference fidelity or all live data states and touch/keyboard combinations.

See [Prompt 23 report](E2E_RELEASE_REPORT.md) and [production checklist](PRODUCTION_READINESS_CHECKLIST.md) for the detailed release blockers. No production deployment or real payment/GPS claim was made.
