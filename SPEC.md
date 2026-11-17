Build a standalone app "coy-discover": a mobile-first swipe "Discover" tab. Stack: Next.js (App Router, TypeScript), Tailwind, framer-motion, Prisma + Postgres (Neon), Zod, Vitest. No external auth: assume a single logged-in user with fixed id "me".

APP SHELL
- Bottom tab bar with two tabs: "Home" (completely blank placeholder) and "Discover".
- Inside Discover, a top toggle: "Swipe" | "Matches".

DATA (Prisma)
- User: id, name, age, photoUrl, bio, city (or college), interests String[].
- Swipe: id, swiperId, targetId, direction (LIKE|PASS), createdAt, @@unique([swiperId, targetId]).
- Match: id, userAId, userBId (always stored sorted), createdAt, @@unique([userAId, userBId]).
- Seed: user "me" plus 32 mock profiles (varied names, ages 19-28, bios, cities/colleges, 3-5 interests each, placeholder photos via picsum.photos/seed/<id>/600/800). 7 of them have a LIKE swipe pointing to "me" (this is stored in Swipe, never exposed through any API).

APIS (route handlers; logic in a lib/ service layer so it is unit-testable)
- GET /api/feed: profiles "me" has not swiped on. Return ONLY public fields (id, name, age, photoUrl, bio, city, interests). Order is a deterministic shuffle derived from (profile id + fixed seed), NEVER from whether they liked "me".
- POST /api/swipe {targetId, direction}: validate with Zod; 404 for unknown target. Idempotent: if already swiped, return the original result without creating anything. Inside one DB transaction: insert the swipe; if direction is LIKE and the target has already LIKED "me", create the Match. Response shape is ALWAYS {matched: boolean, match?: PublicProfile}. A one-way like must be indistinguishable from a pass in the response.
- GET /api/matches: only mutual matches, newest first.
- POST /api/reset (demo only): reseed the database.

PRIVACY RULES (core promise; Coy never reveals who liked you unless mutual)
- No API field, header, count, badge, or ordering may reveal that someone liked "me".
- No "X people liked you", no undo of swipes (Coy says "adding is final"), no profile ever reappears after a swipe.

UI
- One card at a time with a visible next card behind it. Drag with framer-motion: rotate with x, LIKE/NOPE stamp opacity tied to drag distance, swipe past a threshold (~110px or high velocity) to fly out, otherwise spring back.
- Buttons (pass/like) for desktop, with aria-labels; ArrowLeft/ArrowRight keyboard support.
- Optimistic update with rollback and toast on API error; skeleton while loading; preload next 2 images.
- "It's a match!" full-screen overlay when matched, with a "Keep swiping" button and a link to Matches.
- Matches view: list/grid of mutual matches. Empty states for both the feed ("You're all caught up") and matches.
- Tested at 390px width first.

TESTS (Vitest, against the service layer with a test DB)
1. Feed never contains a profile already swiped (like or pass).
2. Re-posting the same swipe is idempotent (one row, same response).
3. Match is created only when both liked; a pass never creates a match; a one-way like does not.
4. Feed payload key set is identical for profiles who liked "me" and profiles who did not.
5. Feed order does not depend on like status (same order if the like rows are changed).
6. /matches excludes one-way likes.
7. Concurrent duplicate swipes create exactly one swipe and at most one match.

DELIVERABLES
- Deploy to Vercel with Neon Postgres (env: DATABASE_URL only). Public GitHub repo with clean commits.
- README: live link, 5-line demo script, run locally, API contract, how privacy is enforced, a link to the tests, and a "Part A" section (the two feature suggestions).