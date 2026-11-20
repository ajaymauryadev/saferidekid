# Owner dashboard KPI definitions

All queries are restricted to the signed-in owner's `businessId`. Dates use Asia/Kolkata. Money is stored and calculated as integer paise; the UI formats it as rupees.

| KPI | Definition |
| --- | --- |
| Active students | Children with `ACTIVE` status and an `ACTIVE` school subscription. |
| Today's runs | School runs started for the current India date, including completed runs. |
| Upcoming confirmed bookings | `CONFIRMED` bookings with a future start time. |
| Bookings needing action | `REQUESTED` or `REVISION_REQUESTED` bookings. A quote awaiting the customer is excluded. |
| Verified collections | Payments verified in the selected date range, less refunds and reversals recorded in that range. Pending claims never enter this total. |
| Pending claims | Number and face value of `PENDING_VERIFICATION` payments. These are unverified claims, not receipts. |
| School outstanding | Sum of current ledger statements through the current month for active child records. Charges, fee adjustments, verified school allocations, prior balances and credits follow the fee statement calculation. Pending claims do not reduce dues. |
| Verified booking advances | Verified `BOOKING_ADVANCE` allocations, less recorded refunds and reversals on those payments. |
| Unallocated verified receipts | The unallocated part of verified payments, reduced conservatively by refunds and reversals on those payments. |
| Active fleet vehicles | Fleet records marked active. This is fleet availability status, not current utilization. |
| Active trips | Active school runs plus private bookings with a confirmed trip start and no end. Urgent assignments are excluded until a trip is started. |
| Urgent callbacks | New or contact-attempted urgent requests awaiting owner decision. |

The calendar expands each configured route's real weekdays and time windows and adds active booking, urgent, maintenance and driver-unavailable blocks. An overlap alert compares shared vehicle and driver IDs with intersecting intervals. Assignment is still governed by the server availability checks; the calendar warning does not authorize an override.

The live board displays only driver-shared locations associated with active assignments. Freshness is recalculated from observation time. A stale marker is labelled as a last known position and is not presented as moving.
