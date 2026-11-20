# Audit-based Phase 01 — customer school fee proposal

Implemented on 16 November 2026 in the existing workspace. The root HTML simulation remained read only. `git status` is unavailable because this directory has no `.git` metadata.

## Agreement and activation

Customer requests now store service (`MORNING`, `AFTERNOON`, `BOTH`), positive integer paise per child per month, source, proposal timestamp, version and history. For multiple requested places, one price applies to each child. Owner-assisted requests require a written consent/source context and keep the owner as the actor. The owner can approve the customer amount, counter with a versioned amount/effective date/expiry/reason, or reject. Customer acceptance or decline compares the exact live version and expiry. Owner price approval produces `ACCEPTED` (price agreed, pending final authorization); the existing vehicle/driver/seat reservation produces `APPROVED`; child review and route/stop assignment remain prerequisites for `ACTIVE`. Morning and afternoon run rosters now honor the chosen service. All new school writes use business-scoped session transactions and audit/notice records.

`FeeAgreement` records the subscription, proposal version and service for new child charges, with the existing due policy. Charge generation still inserts once per child/month; no existing charge, receipt or verified payment is repriced. A fee read bug uncovered during the test was fixed by selecting the subscription `updatedAt` needed for cancelled/paused charge handling.

## Legacy handling and rollback risk

No bulk migration or backfill runs. Reads interpret missing proposal/service/source fields as a legacy owner-first record, without changing the Mongo document or historical amount. The older `/quote` endpoint remains available only when `proposedMonthlyFeePaise` is absent; current requests use `/counter`. A legacy quote can still be accepted with its exact version. This read-only strategy is idempotent. Restoring older application code would ignore the new fields and could incorrectly apply its owner-first flow to new pending proposals, so rollback requires a compatible reader and an operational decision for pending proposal/counter states. Never roll back by deleting or rewriting charges or receipts.

## Verification

17 November follow-up: the customer and owner-assisted forms now show ₹1,500 as an example placeholder and require an entered amount. Rupee input converts at most two decimal places to safe integer paise; blank, zero, excess precision and overflow fail validation. Counteroffer reason is optional for new proposals. The focused school suite passed 12/12, including a counter without a reason, and the fresh authenticated browser/Mongo run passed at all seven widths.

- `npm run build` passed. Vite reported a pre-existing large initial chunk warning.
- `npm run typecheck` and `npm run lint` passed.
- `npx vitest run --no-file-parallelism --maxWorkers=1 --reporter=dot` passed 20 files and 97 tests after fixing a pre-existing time-dependent leave test fixture. Focused school tests passed 12/12; isolated leave tests passed 3/3. Full output is in `full-vitest.log`.
- `node scripts/phase01-e2e.mjs` passed with fresh Chrome contexts and an isolated MongoDB replica set: authenticated customer proposal, owner approval, counteroffer, customer acceptance and Mongo assertions. Both customer and owner status/review screenshots and overflow checks cover 320, 360, 390, 768, 1024, 1366 and 1440px. At every width, status history and owner review controls were clicked. The run also aborted one customer POST and confirmed an error message and no saved request.
- School API tests cover the direct ₹1,500 path through child/route assignment, activation and charge; the ₹1,800 counter path; wrong relationship, stale/expired version, duplicate action, decline, assisted source, capacity, and legacy reads.

## Remaining Phase 01 evidence limits

The fresh browser run clicks proposal, approval, counter and acceptance. Child/route activation and billing are verified through authenticated API/Mongo tests, not fresh browser clicks. The mobile form uses short labeled sections, but it is not a step-gated progressive form. Concurrency is protected by status/version conditional updates in Mongo transactions, and one simultaneous two-request race was tested (one 200, one 409). This is not a production load test. No real operator, child or payment data was used.
