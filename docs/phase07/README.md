# Phase 07 — public website verification

The public site now leads with school journey clarity and local ride booking. The header, hero, destination form, school journey preview, six service cards, vehicle section, two request flows, trust details, contact and footer share the new responsive layout. `/vehicles` and `/urgent` retain their existing live API workflows with updated presentation. The booking form saves only pickup, destination and service in session storage; after customer sign-in or signup it opens the real booking wizard. A submitted booking remains subject to owner quotation and confirmation.

The existing `saferide-van.webp` is an illustration, labeled as such. No owner Eeco photograph or verified exterior/interior set was available in this workspace. Add consented business photos through the existing vehicle publishing controls before presenting a real vehicle image. No public route, child, driver, registration or GPS data was added. No fare is shown without a valid routed road estimate; the quick form says the owner will confirm it.

The public vehicle API excludes goods vehicles whose legal suitability has not been confirmed or whose recorded document expiry has passed. Goods is shown as a public service only when an eligible published vehicle is returned.

## Evidence

- `baseline/home-{320,360,390,768,1024,1366,1440}.png` and `final/home-{...}.png` show the before and after homepage at all required widths.
- `live/{home,services,vehicles,urgent,contact}-{...}.png` show MongoDB-backed pages at all seven widths. The fixture phone is removed before these captures, so the fallback contact state is visible. `live/home-hindi-390.png` shows the Hindi option.
- `node scripts/phase07-e2e.mjs` passed guest booking draft continuity through login, clicked the Book, School, Vehicle and Urgent CTAs, persisted a contact enquiry, verified configured and absent phone states, visited the service, vehicle and urgent routes, checked mobile menu Escape, Hindi, delayed public API, reduced motion, offline banner and document overflow for five public pages at seven widths.
- `npx vitest run --maxWorkers=1 --fileParallelism=false`: 22 files, 109 tests passed. `npm run typecheck`, `npm run lint` and `npm run build` passed.
- After the goods publication gate, `npx vitest run apps/api/src/public.test.ts --maxWorkers=1 --fileParallelism=false` passed its four public API tests.

The Hindi switch covers the main public journey headings, booking labels and service choices. Some explanatory and policy copy remains in English. Browser tests use a Chrome desktop viewport and network simulation; they do not prove behavior on a physical low-end Android handset. The full photo and Hindi copy pass requires owner-supplied assets and reviewed wording.
