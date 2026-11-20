# Phase 02 — secure Trip Mode and genuine GPS

## Implemented

- The assigned owner signs in as OWNER with `DRIVER_DUTY` and uses `/owner/driver/run/:id`. A separate driver continues to use the invited, revocable DRIVER account and `/driver/run/:id`. Trip Mode presents the run, vehicle, roster, manual child confirmations, safety guidance, GPS, reports, contact, and End Run. The owner Trip Mode menu contains only the driving duty link.
- Tracking writes require the current session, driving ability, exact run or booking driver, active route or schedule assignment, matching vehicle, explicit sharing, valid coordinates and observation time, and a ten second minimum interval. Repeated identical uploads return the existing point. Assignment changes and run end remove tracking access; stopped sharing hides coordinates.
- Parent tracking uses each linked child's run, confirmed events, assigned driver contact, vehicle and route. A Leaflet marker appears only for a server GPS point. Fresh, stale, stopped, offline and unavailable states carry an observation time and accuracy when available. Browser background and lock limitations are explained.

## Verification

- `npm test`: 20 files, 99 tests passed before the final assignment scoping addition. Focused run and tracking suites were rerun afterward; see `../phase02-focused.log`.
- `npm run build`, `npm run lint`, and `npm run typecheck` passed; see `../phase02-build.log` and `../phase02-lint.log`.
- `node scripts/phase02-visual.mjs`: real Express, MongoDB replica set, Vite and Chromium. Separate driver and owner duty each uploaded a browser geolocation point; parent saw the authorized fresh marker. Both confirmed morning and return milestones and ended both runs. Parent views then showed Run ended with no marker. The flow exercised browser offline/resume and denied permission. Screenshots at 320, 390 and 1440 pixels had no horizontal overflow. See `../phase02-browser.log`, `../phase02-flow.log`, and PNGs in this directory.

**UNVERIFIED:** Physical phone background and screen lock behavior. No authorized test device was available. Chromium geolocation in the browser flow was a test fixture, not a phone GPS measurement.
