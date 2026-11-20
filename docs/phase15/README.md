# School fee scheduler and accounting

The fee ledger records a fixed full-month charge from each accepted agreement's start month. `NEXT_MONTH` starts billing in the following month when the effective date is after the first. No attendance or leave event prorates a charge. A later accepted agreement applies to future charge generation; an existing charge is never rewritten. Owner waivers, discounts and extra charges are separate audited records.

Configure `FEE_JOB_TOKEN` as a long random secret in the API environment. Configure an external HTTPS scheduler to POST `/api/jobs/fees/run` with the `x-job-token` header. Run daily near the business's local morning. The endpoint is idempotent: charge and reminder indexes prevent repeats. Fee views also catch up charges and reminders when accessed.

If the scheduler is down and nobody opens a fee view, reminders can be late. In-app notices are the only delivery channel here; this does not guarantee SMS or email delivery. A paused or cancelled subscription stops new charges from the month of that decision, while prior charges and payments remain in the ledger.
