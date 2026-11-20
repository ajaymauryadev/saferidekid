# SafeRide Kids — public website redesign plan

**Specification only. Do not implement in this audit.** Aim for an original premium local mobility brand that leads with the school-safety promise and immediately supports ordinary ride booking.

## Preserve and correct

Preserve blue `#125fd4`, navy `#142544`, background `#f5f8fd`, green `#0c9866`, existing buttons/status language, real API business/vehicle/enquiry reads, responsive menu focus handling, truthful GPS/payment caveats, and local illustrated van as a clearly labeled temporary illustration. Correct displayed name to **SafeRide Kids** and present a real owner-provided Eeco photograph when supplied. The current illustration must never imply it is an actual business vehicle. Do not publish seats, permits, testimonials, certifications, statistics, phone numbers or fare examples until verified by the owner.

## Information architecture and section order

1. **Header:** logo; Home, Services, Our Vehicle(s), Contact, Login; visually dominant Book a Ride. On 360px: brand, call icon if configured, menu; menu includes booking and language. Sticky only if it does not cover content. Preserve keyboard focus trap/Escape behavior.
2. **Hero:** split composition at 1440px, concise headline “School rides you can follow. Local journeys you can book.” Short proof-based copy. Left Book a Ride, School Transport, Call Owner; right actual Eeco image in a calm street/school context with a small illustrated parent status preview. At 360px, headline and Book CTA above image; avoid long empty vertical space. No fake live tracking screenshot.
3. **Quick booking:** prominent destination-first card asking “Where are you going?” Pickup current-location consent or typed village/landmark, destination search/manual, service selector, date/time; disclose calculated road fare only if backend routing succeeds, otherwise “Distance unavailable — owner will confirm the fare.” Signed-in submit goes to booking; guest can start and preserve draft through sign-in or use call/enquiry. Validate and handle slow/offline states.
4. **School safety:** simple four-event timeline (boarded, school reached, return boarded, home dropped) alongside a **sample UI clearly labeled preview**, GPS freshness/time chip, direct driver contact and leave. Explain that driver confirms child events and GPS may become stale. Primary CTA Request School Transport.
5. **Services:** original icon/photo cards for School Transport, Local Trips, Tourism, Wedding & Events, Outstation, Urgent Transport. Each card has a meaningful destination and relevant service information; goods only after eligible vehicle is configured. Urgent card opens call-first page with 112 medical guidance and no ambulance promise.
6. **Our Vehicle:** one strong owner-supplied Eeco photo, verified model/capacity/services, availability as “request” rather than live promise. If missing image, show a branded illustration labeled as such and a business-photo acquisition task. Add secondary photos only when real.
7. **How it works:** two compact three-step tracks: school (propose fee → owner agrees/assigns → follow confirmed journey) and other rides (enter destination → view estimate/owner quote → confirm ride). Keep payment claims pending until verified.
8. **Trust and safety:** factual operating practices only: assigned driver identity, explicit boarding/drop, authorized time-stamped GPS, direct contact, verified receipts. No badges, ratings, response-time promises or safety certifications without proof.
9. **Contact/footer:** configured Call Owner and WhatsApp, concise enquiry with backend success/error, service area, real business details, terms/privacy and language control. With no phone configured, show an honest “Call unavailable” state and enquiry option.

## Visual system

- Typography: strong navy headlines, readable humanist body; add a tested Devanagari font with comparable weight and line height. Avoid condensed tiny uppercase labels for primary Hindi actions. Desktop hero heading around 48–56px; mobile around 32–38px with short line lengths.
- Composition: generous but purposeful whitespace, restrained gradients, subtle depth, warm vehicle photography, crisp iconography. Keep prominent action contrast and consistent 8px spacing increments. Mobile cards mostly single column; quick booking form visible near first fold without crowding the hero.
- Components: branded header/footer, hero media, destination combobox with manual fallback, pickup permission control, service pills, fare breakdown/fallback, safety event timeline, freshness badge, service cards, vehicle gallery, FAQ disclosure, call/WhatsApp actions, forms, skeleton/empty/error/success states. Reuse current RTK Query API and form validation; no second cache.
- Motion: short entrance/focus transitions, reduced-motion support, no autoplay movement that obscures status or blocks low-end phones. Image dimensions and lazy loading below fold to prevent layout shift. Lazy map only after authorized trip data exists.

## Interaction and responsive acceptance

At 1440 and 1366px: balanced hero, clear booking card, no giant vacant bands. At 1024/768px: wrap nav and card grids without cramped text. At 390/360/320px: first visible Book a Ride and School Transport, accessible menu, minimum 44px targets, visible form keyboard actions, no horizontal scroll or bottom-nav overlap. Test English and Hindi copy at every width, keyboard and screen reader labels, slow network, offline, validation, login continuation, configured/unconfigured phone and vehicle/photo empty state. Route destination, submission and saved Mongo state must be verified; a visual CTA alone is not acceptance.

## Asset and content dependencies

Request real exterior/interior Eeco photographs with usage consent, verified vehicle model/seats, legitimate service area, owner phone/WhatsApp, business name, any permit/legal wording and approved Hindi copy. Until then use sourced, labeled illustration/placeholder and neutral copy. Do not substitute luxury vehicles or fictional families as business proof. Existing `apps/web/public/assets/saferide-van.webp` is a temporary illustration, not an actual operator photo.

## Likely files for future phase

`apps/web/src/public-pages.tsx`, `components.tsx`, `styles.css`, `design-system.css`, `routes.tsx`, new localized content/modules and public/booking entry components; `apps/api/src/public.ts` and `models.ts` only for verified content; shared Zod contracts for destination/fare data. Coordinate with the booking/urgent restoration and backend pricing phase first, so every published CTA leads to a working flow.
