# Prompt 05 school subscription evidence

`scripts/school-e2e.mjs` ran the React form and owner screen in Chrome against a live Express API and an isolated MongoDB replica set. It persisted request → quote → customer acceptance → owner approval with a seat reservation → two child profiles → activation. The live captures are `live-customer-pending-390.png`, `live-customer-quoted-390.png` and `live-customer-active-390.png`.

`scripts/school-visual.mjs` captured customer and owner layouts at 390 and 1440px. Its temporary response fixtures contain all eight states: Pending, Quoted, Accepted, Approved, Active, Paused, Rejected and Cancelled. These fixtures are only for layout coverage. The screenshots are `customer-statuses-390.png`, `customer-statuses-1440.png`, `owner-statuses-390.png`, `owner-statuses-1440.png`, `customer-apply-390.png` and `owner-quote-1440.png`.

`apps/api/src/school.test.ts` exercises the lifecycle against MongoDB transactions, including expired quotes, duplicate requests, wrong-customer access, capacity overflow, owner-assisted entry, child place limits, pause/resume/cancel and cross-business denial.
