# Phase 05 verification — road estimates and owner fares

## Provider and operation

The server uses HeiGIT openrouteservice directions with the `driving-car` profile for road distance. Typed pickup and destination text is sent to HeiGIT Pelias geocoding; a selected map point is used directly. A geocode result must have confidence at least 0.8. The API key is private in `ORS_API_KEY`. No key is required to submit a booking. `ORS_API_BASE_URL` can point to loopback only in test mode for mocked provider checks; production always uses `https://api.heigit.org`.

The provider documents its [current endpoints](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912/), [directions distance in metres](https://giscience.github.io/openrouteservice/v9.10.0/api-reference/endpoints/directions/requests-and-return-types), and [Pelias geocoder](https://giscience.github.io/openrouteservice/v9.10.0/api-reference/endpoints/geocoder/). A provider [API key](https://api.openrouteservice.org/) is required, and its [terms](https://staging.openrouteservice.org/terms-of-service/) require attribution. Estimate responses and saved route observations show `© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors`. The application does not use public OSM tile servers as a routing service and does not use the OSRM demonstration server. There is no route response cache; estimate requests are debounced in the browser and limited to 30 per customer per 15 minutes on the server. Check the provider's current quota and terms before enabling a key for a live deployment.

Provider failure, timeout, missing key or uncertain geocoding produces exactly **“Distance unavailable — owner will confirm the fare.”** No kilometres or ETA are generated. The customer can still send the request. A successful route without an eligible vehicle rate shows road distance and says the owner will confirm the fare, with no automatic amount.

## Fare rules

Owners set rates per vehicle and service in the owner fleet controls, with rupee inputs saved as integer paise. The server applies configured base and road-kilometre charges, one-way or disclosed return factor, hourly or day package, minimum, night charge for any reserved interval touching 22:00–06:00 India time, planned waiting rounded to whole hours, configured toll and parking allowances, and discount. The estimate shows the component amounts and assumptions. Tolls, parking and unplanned waiting may differ in the final owner quote. A booking stores the road-route observation, calculation time, versioned rate snapshot, breakdown and estimate. Later owner rate changes do not rewrite it. A quote remains separately versioned and requires customer acceptance and advance verification or audited waiver before assignment. An owner may state a **MANUAL** distance with a reason on a manual quote; this never changes the stored provider distance source.

## Verification

- `npm run build` — passed.
- `npm run typecheck` — passed during implementation.
- `npm run lint` — passed after removing an unused lint directive.
- `npm test` — 22 test files and 105 tests passed. The new manual-distance quote assertion was added afterward and its focused booking suite passed (9 tests).
- `node scripts/phase05-e2e.mjs` — isolated MongoDB plus mocked 12 km HeiGIT response, estimate and exact fallback at 320, 390 and 1440 px, no horizontal overflow or browser page errors. Submitted a booking with provider unavailable and confirmed the detail retains the fallback.
- Focused API tests: 12 km, minimum, return factor, night boundary, planned waiting, hourly/day package, integer paise, provider absent/timeout, uncertain village, invalid coordinates, tampered client price, rate authorization, immutable booking rate snapshot, school parent booking and school duty conflict. Existing quote, advance and booking authorization tests also ran.

Remaining production requirement: configure an operator-owned provider key and verify its actual quota, coverage and billing terms for the intended operating area. The optional integration was tested against mocked provider responses, so no real provider availability claim is made here.
