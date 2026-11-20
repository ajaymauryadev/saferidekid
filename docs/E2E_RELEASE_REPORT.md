# SafeRide Prompt 23 E2E release report

## 15 November 2026 continuation — live booking and payment controls

`node scripts/prompt23-e2e.mjs` passed again with more real Chromium controls. A customer submitted the school request, the owner quoted and approved it, and the customer accepted the fee quote and added the approved child through the UI. The wedding flow used the four-step customer booking wizard → owner quotation → customer acceptance → customer payment claim → owner verification → owner dispatch forms and buttons. A separate live API retry check confirmed that a repeated booking request key returned the same record. An anonymous visitor submitted the public urgent callback form. The script checked persisted MongoDB records, relationship access, pending funds excluded from verified paid, duplicate verification rejected, driver completion and receipt. The payment card showed **₹1,000.00 under review** after RTK Query refreshed, while verified remained ₹0.00. Dispatch produced a `CONFIRMED` booking with an assigned vehicle and driver. After an owner-recorded ₹200.00 cash final payment, booking verified paid was ₹1,200.00, due was ₹3,800.00, and owner dashboard verified collections were ₹1,200.00; these values were asserted in the live run. Screenshots: [owner school approval](e2e-evidence/owner-school-approved-390.png), [customer pending claim](e2e-evidence/booking-payment-pending-390.png), [owner verification queue](e2e-evidence/owner-verification-pending-390.png), [owner confirmed booking](e2e-evidence/owner-booking-confirmed-390.png), [urgent request received](e2e-evidence/urgent-request-received-390.png). [Latest run log](full-e2e-ui-finance-2026-11-15.log) and [machine results](e2e-evidence/results.json) retain the latest pass. The original 12 November A, E and G “partial UI” labels below are superseded by this continuation. Other UI click-through and real device gates remain open.

The parent submitted leave through the UI; the student request still required guardian confirmation and the fixed fee remained unchanged. The driver started the morning school run from My Day and confirmed boarding on the run page in Chromium. MongoDB and the parent timeline reflected the confirmed event; later milestones and owner correction remain HTTP-driven in this test. [Driver active duty screenshot](e2e-evidence/driver-morning-started-390.png) and [latest run log](full-e2e-ui-driver-2026-11-15.log) show the continuation. The browser run also found two UI defects and they were fixed: the last approved child slot could hide the enrollment success message, and the urgent success notice squeezed its text and action into columns on a narrow phone. The final run passed after both changes.

**Date:** 12 November 2026 (Asia/Kolkata)  
**Decision:** **NOT VERIFIED FOR RELEASE.** The live test passed its assertions, but the full cross-role browser and visual acceptance requested in Prompt 23 remains incomplete. Browser GPS is best effort and no background reliability guarantee was established.

## Commands and environment

From `C:\Users\ajaym\Desktop\saferidekids`:

```text
npm run build                              PASS
npm test -- --reporter=dot                 PASS: 20 files, 89 tests
node scripts/school-e2e.mjs                FAIL: legacy script timed out after owner quote (obsolete fixture lacks qualified driver/legal vehicle)
node scripts/prompt23-e2e.mjs              PASS: final run, exit 0
```

The final script started **real Vite, Express, Chromium and a clean `mongodb-memory-server` replica set**. Vite was `http://127.0.0.1:5183`, Express `http://127.0.0.1:4183`; both were stopped afterward. No server or data request was intercepted or mocked. Test identities used `Fictitious` names and `+9191000900xx` development-only numbers. The test database was ephemeral and contained no secrets or production data. Source: [script](../scripts/prompt23-e2e.mjs), machine-readable [results](e2e-evidence/results.json).

Chromium performed customer signup through the UI and captured authenticated pages. Subsequent transitions used Playwright's HTTP client **with the separate browser contexts' real session cookies and CSRF tokens**. Thus the backend lifecycle was verified end to end, while most forms/buttons were not clicked through the UI. The prior Vitest suite uses a real memory MongoDB but calls Express in process; it is supplementary evidence, not a substitute for the live server run.

## Acceptance results

| Workflow | Result | Live evidence and limit |
|---|---|---|
| A. Signup, school, child, assignment, privacy | **Pass at API; partial UI** | Chromium signup and empty home; request → quote → acceptance → approval → child within one slot → review → route and stop → activation; unrelated customer denied child/subscription access. Owner/customer form controls after signup were exercised through HTTP. |
| B. School milestones and corrections | **Pass at API; partial UI** | Separate driver session created morning/afternoon runs; boarded, school reached, return boarded and home dropped reached parent dashboard. Owner correction carried a reason; original event remained. Driver/customer screen button paths were not clicked. |
| C. Leave | **Pass at API; partial UI** | Parent request; student request stayed `PARENT_CONFIRMATION` until guardian confirmation, then owner approval. Same-day request after boarding rejected. Monthly fee remained 380000 paise. UI form path not completed. |
| D. GPS | **Pass at API; reliability open** | Assigned driver enabled sharing and uploaded a real HTTP test point. Parent saw `FRESH`, then `STALE` after aging observation, then disabled; unrelated customer and wrong role denied; completed run returned 404. Browser permission-denied and offline UI, and background/location delivery reliability, were not established. |
| E. Wedding booking and finance | **Pass at API; reconciliation open** | Same customer requested typed-city wedding trip; API returned `distanceSource: UNAVAILABLE` and no invented fare. Quote/acceptance, pending UPI claim, verified once, confirmation, driver trip stages, completed status and receipt passed. Owner dashboard total reconciliation and final-balance payment through UI were not independently checked. |
| F. Goods | **Pass at API; partial UI** | Goods vehicle required; passenger van rejected for dispatch; manifest, pickup then delivery checkpoints persisted. Driver goods UI not clicked; receiver proof was an owner-recorded confirmation reason, not an uploaded document. |
| G. Urgent | **Pass at API; partial UI** | Anonymous request reached owner queue; response gave no dispatch guarantee. Chromium urgent page showed 112, ordinary transport/ambulance disclaimer, call-first CTA and no price or advance wizard. Operator phone was deliberately unconfigured, so call link showed unavailable. |
| H. Owner controls | **Partial** | Owner phone booking and cash record passed; active-assignment driver deactivation rejected; eligible disposable user deletion audited. Full manual edits, a successful driver revocation after reassignment, and deletion retaining that user's financial evidence were not covered in this live run. Related API unit tests passed. |
| I. Security/regression | **Partial** | Separate sessions, cross-user 404, owner-only 403, missing CSRF 403, logout 401, repeated route assignment idempotency, booking request idempotency, duplicate payment verification 409, public urgent phone limit 429. Payment-claim idempotency was covered by the API unit suite, not this live run. An overlapping distinct route/booking conflict and every IDOR endpoint were not exhaustively tested live. |
| J. Visual and interaction | **Partial** | Captured owner dashboard, driver today and public urgent at 320/360/390/768/1024/1440; no page errors, broken images or horizontal overflow in those screens. Customer empty/active home captured at 390. Urgent reference compared at 390 and 1440. Remaining main pages, keyboard/touch/button audit and full HTML parity matrix were not completed live. |

## Database state proof

The final script queried MongoDB directly, then wrote the following to [results.json](e2e-evidence/results.json):

| State | Before | After |
|---|---:|---:|
| School subscription | `PENDING`; 0 children | `ACTIVE`; 1 child; 1 vehicle seat reserved |
| Morning run events | 0 | 3, including one correction; original `BOARDED` count still 1 |
| UPI advance claim | `PENDING_VERIFICATION`; verified paid 0 paise | `VERIFIED`; verified paid 100000 paise; booking completed |

The script additionally checked fixed school fee at 380000 paise after leave, a completed trip receipt endpoint, ordered goods checkpoints, a phone-booking audit event, and a deleted-user audit event. Because MongoDB was ephemeral, the JSON evidence is the retained before/after record; no database credentials are included.

## Endpoints exercised

`/api/ready`; `/api/auth/{signup,login,me,logout}`; `/api/customer/dashboard`; `/api/customer/school/subscriptions` and `/:id/{accept,children}`; `/api/owner/school/subscriptions/:id/{quote,approve,activate}`; `/api/owner/students/:id/review`; `/api/owner/ops/routes` and `/:id/students/:childId`; `/api/leaves` and `/:id/{confirm,approve}`; `/api/runs` and `/:id/{events,corrections,complete}`; `/api/tracking/{sharing,point,run/:id}`; `/api/customer/bookings` and `/:id/accept-quote`; `/api/owner/bookings/{phone,:id/quote,:id/confirm,:id/goods,:id/goods/checkpoint}`; `/api/driver/trips/:id/progress`; `/api/customer/payments` and `/:id/receipt`; `/api/owner/payments/{:id/verify,record}`; `/api/public/urgent`; `/api/owner/urgent`; `/api/owner/users/:id/deactivate`; `/api/owner/control/users/:id/delete`.

## Screenshots

- [Customer empty home](e2e-evidence/customer-empty-390.png), [active home](e2e-evidence/customer-active-390.png)
- [Owner dashboard at 320](e2e-evidence/owner-dashboard-320.png), [390](e2e-evidence/owner-dashboard-390.png), [1440](e2e-evidence/owner-dashboard-1440.png)
- [Driver today at 320](e2e-evidence/driver-today-320.png), [390](e2e-evidence/driver-today-390.png), [1440](e2e-evidence/driver-today-1440.png)
- [Public urgent at 390](e2e-evidence/urgent-390.png), [1440](e2e-evidence/urgent-1440.png); [HTML reference at 390](e2e-evidence/reference-urgent-390.png), [1440](e2e-evidence/reference-urgent-1440.png)

The evidence folder also contains the 360/768/1024 captures. The urgent implementation has the reference's red emergency emphasis and call-first hierarchy but uses a taller disclaimer and different field spacing; exact visual parity is not claimed. Reference text about local-demo storage was correctly excluded from the live app.

## Defects, reruns and release blockers

The old `school-e2e.mjs` fixture no longer met current capacity rules and timed out waiting for a success message. A new Prompt 23 harness seeded a legally suitable vehicle and qualified driver, then completed the current workflow. Its first goods attempt targeted the customer endpoint; the actual manifest route is owner scoped. The harness was corrected and the entire run passed. A repeated assignment expected 409 but returned the same route successfully; this was recognized as idempotent behavior and the assertion was corrected. **No product-code defect was fixed in this phase.**

| Severity | Outstanding item |
|---|---|
| **High / release block** | Full UI click-through for all mandatory role workflows and all main-page visual/interaction checks at required widths is incomplete. |
| **High / release block** | Real device/browser GPS permission, offline recovery and background reliability are unverified; browser tracking must remain described as best effort. |
| **Medium** | Owner dashboard totals, final payment settlement, retained financial history after deleting a user with payments, successful driver revocation, and separate overlapping assignment conflicts need one live cross-role acceptance run. |
| **Medium** | Full reference parity, all buttons, console/network errors on every main page, and mobile keyboard/touch checks need review. |

**Release decision: NOT VERIFIED.** Do not label this build production ready from this report.
