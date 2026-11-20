# SafeRide implementation rules

Read the final master prompt pack, final HTML simulation and Premium UI/UX Blueprint before each phase. Preserve working code and the root folder identity. The final HTML is a read-only visual reference, never a source of live identities, payments, locations or fares.

Use React TypeScript Vite, React Router, Redux Toolkit with one RTK Query cache, Tailwind, Express TypeScript, MongoDB Mongoose and shared Zod contracts. No Redis, Docker, SQL, Prisma SQL, TanStack Query, SWR, Apollo cache, Zustand, MobX, BullMQ or mandatory paid service.

Customer and parent are one role. One sign-in form derives role from server session. Every future protected API read and write must enforce server session, role, business scope and record relationship. Store money as integer paise. Payment claims remain pending until owner verification. GPS requires authorized driver consent and freshness. Never replace real status with demo state. Finish and verify only the requested phase.
