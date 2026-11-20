# SafeRide Kids — Immediate Codex Prompt: Audit-Based Phase 01

Paste the instructions below as ONE Codex task in the existing project root.

You are in my EXISTING SafeRide Kids MERN project repository. This is a continuation/fix of the actual project, NOT a new app or a static simulation.

Read, in this order when present:
1) AGENTS.md and the actual repository tree (including root npm workspaces and README).
2) docs/FINAL_UPDATED_REQUIREMENTS.md, docs/CURRENT_SOFTWARE_AUDIT.md,
   docs/FUNCTIONAL_GAP_MATRIX.md, docs/REVISED_IMPLEMENTATION_ROADMAP.md,
   docs/UI_UX_AUDIT.md and docs/PUBLIC_WEBSITE_REDESIGN_PLAN.md.
   Discover and use their actual locations if they are in the root instead of docs/.
3) The older SafeRide_Final_Simulation_To_Working_MERN_Codex_Prompts.md,
   SafeRide_Complete_Premium_UI_UX_Blueprint.md and
   SafeRide_Complete_Interactive_UI_Simulation.html if available.
4) Actual source files, API routes, DB schemas, tests and current browser-rendered pages.

PRECEDENCE: privacy/security/child safety and truthful money/GPS > FINAL_UPDATED_REQUIREMENTS.md > current tested operational rules > PUBLIC_WEBSITE_REDESIGN_PLAN.md > older blueprint and HTML visual inspiration > older prompt pack. Do not copy HTML demo auth, fake location, fake fares or localStorage business state into production.

BUSINESS: SafeRide Kids = ONE independent Maruti Eeco operator serving villages, small towns and cities, with school child safety/tracking as the core, plus normal/private/tourism/wedding/outstation/urgent (non-ambulance) ride bookings and eligible goods only if a permitted vehicle exists. OWNER may also be DRIVER. Unified CUSTOMER/PARENT account plus restricted STUDENT account; separate driver full dashboard is not needed, but secure minimal Trip Mode is required. Customer proposes the school monthly fee; owner approves/rejects/counters, customer accepts a counter, and only authorized agreement/assignment activates subscription.

STRICT STACK: React + TypeScript + Vite + React Router; Redux Toolkit + one RTK Query server cache; Express + TypeScript; MongoDB/Mongoose; shared Zod validation; Tailwind/theme; Leaflet only with genuine authorized coordinates. No Redis, Docker, SQL/Prisma, TanStack Query, Zustand, extra API caches, compulsory gateway/SMS/paid map provider. Money is integer paise on server. Direct cash/UPI/bank claims require owner verification. Prior charges, receipts, audit and child safety events must not be rewritten.

PRESERVE existing work and data. Check git status, but the audit copy reportedly had no .git metadata: never assume a safe rollback, never git reset/clean or delete source. Prefer minimal changes and selective backup of touched files if necessary. Test ONLY with isolated development data, never production/real children's data. Avoid creating another nested project.

FOR EACH PHASE:
- Reread relevant files, verify the reported defect still exists, and state exact planned files/actions.
- Implement ONE complete vertical slice: UI action -> RTK Query -> authenticated validated Express API -> MongoDB -> refetch -> cross-role display.
- Preserve good existing design, security and working flows; do not add dead buttons or invent demo data as actual results.
- Test positive, negative, wrong-relationship/IDOR, duplicate/idempotent, failed network and at least 360/390px + 1440px visual behavior. Capture honest evidence; for major UI changes inspect 320/360/390/768/1024/1366/1440px.
- Run applicable build, typecheck, lint, Vitest/API and current browser/Playwright E2E with test MongoDB. Do NOT claim a browser pass if only source/unit tests ran. No fake screenshots or green reports.
- Update docs/FEATURE_ACCEPTANCE_MATRIX.md and docs/UI_PARITY_MATRIX.md if present; add concise evidence and remaining issues. Keep the original audit reports as dated history, not retroactively rewritten proof.
- At end report: FILES CHANGED, IMPLEMENTED, API+DB PROOF, BROWSER/UI PROOF, TESTS (actual commands+results), OPEN ISSUES, NEXT PHASE. STOP; do not implement the following phase autonomously.

I will provide a specific Phase prompt next. Follow that prompt only.

NOW EXECUTE THIS SPECIFIC PHASE ONLY:

Continue the EXISTING SafeRide Kids project. Apply MASTER KICKOFF and all FINAL updated requirements. Execute ONLY Phase 01, then STOP.

CONFIRMED AUDIT GAP:
Existing school subscription flow is owner-first quotation. The customer request contract/model/UI omit a customer-proposed monthly fee and morning/afternoon/both choice. The existing owner quote/approve and child enrollment logic must be reused, not removed.

INSPECT FIRST: packages/shared/src/index.ts (audit noted request contract ~line 73), apps/api/src/customer-models.ts, apps/api/src/school.ts, apps/api/src/fee-models.ts, apps/api/src/fees.ts, apps/web/src/school-pages.tsx, apps/web/src/store.ts and related tests. Read existing states and old-record shapes before deciding a migration.

IMPLEMENT END TO END:
1. On /app/school/apply, customer selects Morning Pickup, Afternoon Drop or Both; school, village/landmark/pickup point, preferred start, child slot count, optional note, and PROPOSED MONTHLY FEE (default example ₹1,500, no forced amount in actual form). Use numeric rupee keyboard, inline validation and clear monthly unit. For multiple child slots, make per-child fee agreement unambiguous without forcing full child creation before approval.
2. Store customer-proposed amount in INTEGER PAISE, chosen service, proposer, request timestamp, version and history. No client-chosen role/business/user IDs. Existing owner-assisted requests must record source and customer-consent context; do not impersonate a customer.
3. OWNER on /owner/school/subscriptions sees customer proposal, service, school, pickup point and capacity hints; choose APPROVE proposed fee, SEND COUNTEROFFER with amount/optional reason/expiry, or REJECT with reason. Owner direct approval is enough price agreement because customer proposed the same amount, but normal enrollment/assignment checks still apply.
4. If counteroffer (example ₹1,800), CUSTOMER can explicitly ACCEPT or DECLINE the exact currently valid version; stale or expired offers cannot be accepted. Owner's required final authorization follows the project's secure workflow, without auto-activating students or bypassing seat/route/driver assignment.
5. Show a clear status history: requested -> approved pending enrollment OR counter offered -> accepted/declined -> owner authorized -> enrolled/assigned -> active; rejection/cancellation branches. Resolve statuses consistently with existing models. Send correct scoped notifications and audit events.
6. Version accepted monthly agreement with effective date/due policy. Do not re-price prior fee charges, receipt records or legacy accepted subscriptions. Implement safe read/migration handling of legacy owner-first records without rewriting amounts. Document exact migration/backfill strategy, idempotence and rollback risk.
7. Mobile UI: short progressive form, proposed-vs-counter cards, strong Accept/Decline buttons, owner review drawer/cards, loading/validation/409 conflict/error/empty states. Keep existing premium blue/navy design. Do not add a separate Parent login.

SERVER/SECURITY:
Enforce session + CUSTOMER/OWNER relationship, business boundary, version conflict/atomic transition, legitimate child slots and capacity. Use existing RTK Query injected endpoints, tags and invalidation. Avoid duplicate submissions, empty/zero/negative prices, overflow, invalid service and retroactive changes.

TEST REQUIRED:
A) ₹1,500 customer proposal -> owner approves -> add student only after approval -> vehicle/route/driver assignment -> active -> fee ₹1,500.
B) ₹1,500 -> owner ₹1,800 counter -> customer accepts exact version -> owner final authorization -> activation fee ₹1,800.
C) Same counter declined/rejected/expired, wrong customer IDOR, concurrent/stale version, duplicate API retry, owner-assisted record, multi-child slot rules.
D) Existing approved subscriptions/verified receipts/paid months remain unchanged.
E) Fresh authenticated browser clicks for customer + owner at 320, 360, 390, 768 and 1440px; corresponding Mongo assertions; no UI-only success.

DONE WHEN all new states are genuinely functional across DB/API/UI and tested, OR gaps are explicitly marked. Report evidence, stop; DO NOT begin Phase 02.
