# Phase 06 fee and reminder operation

School charges use each accepted child agreement's version, effective month, fixed monthly paise amount and due day. The unique child/month index prevents repeat charges. A later accepted rate applies only to eligible future periods; existing charges and receipts retain their original values. School leave does not alter the fee. Owner waivers, discounts and charges are separate reasoned audit records. Customer claims stay pending until owner verification; refunds and reversals are separate entries against verified payments.

Fixed-fee revisions must name a future billing month. For a change to the current billed month, the owner records a reasoned waiver, discount or charge instead of silently replacing the agreed charge.

## Schedule the fee job

Set a long random `FEE_JOB_TOKEN` in the API environment. Configure an external scheduler that can make an HTTPS POST daily after midnight Asia/Kolkata to `/api/jobs/fees/run`, with header `x-job-token: <FEE_JOB_TOKEN>`. Keep the token out of URLs and logs. This endpoint does not require a user session, but rejects missing or wrong tokens. It is safe to retry: reminder notice keys include child, billing period, configured offset, recipient and remaining balance. Run it every day so changed settings and partial verified payments are reflected; a late call selects the most recent missed offset. The parent fee page also starts a best-effort scoped catch-up when opened. In-app notification is the required delivery; the API makes no SMS, WhatsApp or browser-push delivery claim.

The business setting `schoolReminderDays` holds days **before** the fee due date, such as `7, 3, 1, 0`. The fee notice shows the current remaining due including previous dues and verified credit. A settled balance produces no reminder. Optional student accounts receive only a gentle guardian prompt, without money amounts or transaction details. If the scheduler is not called while hosting sleeps, delivery can be delayed until the next call or customer access.

For a fee due on the first days of a month, the job previews the next accepted agreement while still in the preceding month. It sends the configured lead-time notice without creating the next month's charge early. The notice amount combines that agreement with the verified balance through the current month. A paused or cancelled subscription is excluded from this preview. Once the service month starts, normal idempotent charge generation and the final ledger are authoritative.

## Verification

`npx vitest run apps/api/src/fees.test.ts apps/api/src/payments.test.ts apps/api/src/finance.test.ts apps/api/src/school.test.ts --maxWorkers=1 --fileParallelism=false` passed 30 tests. Coverage includes charge idempotency, sibling fees, accepted ₹1,500 proposal and ₹1,800 counter, previous dues, verified versus pending claims, future agreement version, mid-month revision rejection, adjustments, refund/booking finance, repeated jobs and first-day next-month reminders. `node scripts/phase06-money-visual.mjs` uses isolated MongoDB and three real sessions to capture customer payments, owner fee register and student notices at 320, 390 and 1440px. The student screenshot contains the private in-app reminder. This fixture is not a real bank or external message delivery test.
