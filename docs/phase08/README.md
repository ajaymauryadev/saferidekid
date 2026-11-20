# Phase 08 verification notes

18 November 2026. Screenshots in this folder use an isolated MongoDB memory replica set with fictitious users, a Pipaliya school route, Bargawan bus stand and Pipaliya railway station. They do not use the HTML simulation as data.

## Workflow and copy inventory

| Area | Daily workflow and copy checked |
| --- | --- |
| Parent | Child status, last confirmed event and timestamp, driver or owner call, vehicle location and stale state, leave, fee and notices, book ride |
| Customer booking | Village and landmark text entry, optional GPS permission, saved pickup, route estimate or explicit owner quote, server confirmed request |
| Owner | Home metrics from API, school roster, booking and urgent queues, payment verification, phone assisted request, More tools |
| Student | Own run and confirmed events, location state, leave requiring guardian confirmation, notice and fee reminder |
| Trip Mode | Assigned school or private journey, safe stop warning, server acknowledged updates, GPS consent, problem report; no payment administration |
| School application and fees | Request and quotation status, monthly billed amount, verified collection, pending claim, balance and reminders |
| Notices and documents | Delivery acknowledgement, authored notice content, printed snapshot labels and document specific footer |

The locale switch persists in local storage and applies to the same user on this device. User authored place names, school names, notice bodies and reason text stay in the language in which they were entered. The interface does not claim to translate those records automatically.

## Verification

- `npm run build`, `npm run typecheck`, `npm run lint`: passed.
- `npm test`: 109 tests in 22 files passed, including session and record scope tests.
- Isolated Chrome captures: 320, 360, 390, 768, 1024, 1366 and 1440 pixels for parent, owner, student and driver in English and Hindi. See `*-hi.png` and paired English captures. The browser script also checks language persistence, touch, keyboard, offline and interrupted leave writes.
- Initial JavaScript: 497.67 kB before these edits and 498.06 kB after; gzip 153.32 to 153.42 kB. Protected workspace chunk: 260.87 to 270.67 kB; gzip 64.14 to 66.34 kB. Leaflet remains separately loaded on map use (149.90 kB, gzip 43.48 kB). Initial JavaScript is below the previously noted 551.86 kB warning.

Browser run log: `../../tmp/phase08-visual-final.log`.

## Remaining Phase 08 gaps

The owner booking detail and several advanced report, fleet and settings forms still contain English labels when Hindi is selected. Notice text entered by an owner remains in its authored language. The screenshot run verifies layout and the specified failure paths, but does not establish complete translation coverage or a real phone keyboard and GPS background test. Phase 08 should remain open until those screens and device checks are finished.
