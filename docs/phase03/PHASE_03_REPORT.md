# Phase 03 — Restricted student portal

## Delivered

- Guardian consent request for an active linked child, owner reviewed one-time student invitation, unified login activation, and guardian or owner revocation. The account uses a separate mobile, a strong password, an expiring token, and a server-side `StudentAccess` record. Deactivation revokes student sessions and pending invitations.
- `/student/home` shows only the signed-in student's active school journey, morning and return events, assigned route/vehicle/driver, configured call links, next pickup when available, scoped live tracking, notices, and a fee reminder without a payment control or balance.
- Student leave starts as `PARENT_CONFIRMATION`. Guardian acceptance confirms the driver roster directly; decline rejects it. The student cannot confirm their own leave. Existing owner phone-reported leave, correction history, and after-boarding checks remain in place.
- School-wide and route notices include active student accounts. Notifications remain recipient scoped. Legacy fee notices are sanitized before a student can read them.

## Verification

- `npm test`: **21 files, 100 tests passed** (see `full-tests.log`).
- Final focused fee, notification, and student portal run: **3 files, 12 tests passed** (see `final-focused-tests.log`). Lint also passed.
- `student-portal.test.ts`: guardian consent and age validation, owner invitation, activation, own-child and GPS scope, student write restrictions, leave acceptance and decline, after-boarding rejection, no fee reduction, notification isolation, fee privacy, active and pending-invite revocation.
- `leaves.test.ts`: existing leave and driver-roster cases pass with the guardian acceptance state.
- TypeScript checks passed for API and web; shared, API, and web production builds passed.
- Live MongoDB and browser checks passed at **320, 360, 390, and 1440px** for student home, leave, and notices with no horizontal overflow. Browser leave submission remained pending in MongoDB, and guardian acceptance changed it to confirmed. Morning and return run views were exercised with server records (see `browser.log` and PNGs in this folder).

## Device limit

Physical phone background and lock behavior: **UNVERIFIED**. No authorized test phone was available. The UI warns that browser GPS can pause and offers configured contact numbers; it does not invent a location or ETA.
