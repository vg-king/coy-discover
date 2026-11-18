# coy-discover

A swipe-based **Discover** tab for Coy, built as a standalone app for the Coy SDE Intern assignment.
Mobile-first, privacy-first: you only ever learn that someone likes you when you like them back.

- **Live demo:** `<add Vercel URL here>`
- **Repo:** `<add GitHub URL here>`
- **Part A (feature suggestions):** see the [last section](#part-a-two-feature-suggestions)

## Demo in 60 seconds

1. Open the live link on your phone (or a 390px-wide browser window). The **Home** tab is intentionally blank; go to **Discover**.
2. Swipe right (like) or left (pass) by dragging the card, using the Pass / Like buttons, or the left / right arrow keys.
3. Some of the 32 seeded profiles have already liked you. Keep liking profiles: when one of them had liked you, you get the **It's a match!** screen.
4. Open the **Matches** tab to see all mutual matches; tap a card for the full profile. Reload the page: swipes and matches persist.
5. Swipe through everyone to see the empty state, then use **Reset demo** (below the deck) to start over.

## What is built

| Requirement | Where |
|---|---|
| 30+ seeded profiles (name, age, photo, bio, city/college, interests) | 32 profiles + the logged-in user, see `src/lib/seed-data.ts` |
| Some profiles already liked the user | Seeded as stored likes; never exposed by any API |
| One card at a time, drag on mobile, buttons on desktop | `src/app/components/discover-deck.tsx` |
| Smooth animations and clear feedback | Tilt, LIKE / NOPE stamps, fly-out, spring-back, match overlay with confetti |
| A swiped profile never appears again | Enforced by the feed query and a unique constraint on swipes |
| Empty state | "You're all caught up" |
| Match only when both liked, "It's a match!" screen | Created in one database transaction |
| Matches view | Grid plus profile bottom sheet |
| Persistence across reloads | Postgres (Neon) via Prisma |

Home is an empty placeholder tab, as requested.

## API

All routes are Next.js route handlers under `/api`. Responses are JSON.

| Method | Path | Description |
|---|---|---|
| GET | `/api/feed` | Profiles the user has not swiped on yet. Public fields only: `id, name, age, photoUrl, bio, city, interests`. |
| POST | `/api/swipe` | Body `{ "targetId": string, "direction": "LIKE" \| "PASS" }`. Returns `{ "matched": boolean, "match"?: {...} }`. |
| GET | `/api/matches` | Mutual matches only, newest first. |
| POST | `/api/reset` | Demo only: re-seeds the database. Can be disabled with `ENABLE_DEMO_RESET=false`. |

The assignment lists `/feed`, `/swipe` and `/matches`; they live under the `/api` prefix because they are Next.js API routes.

## How privacy is enforced

Coy's core promise is that nobody learns who liked them unless it is mutual. Coy's public site also says that nobody can work it out through counts, and that adding is final. This project follows the same rules:

- **No leak through the response shape.** A one-way like and a pass return exactly the same response (`{ matched: false }`). Only a mutual like returns `matched: true`.
- **No leak through the feed.** The feed payload has the same keys for every profile; there is no "liked you" field anywhere.
- **No leak through ordering.** The feed order is a deterministic shuffle based on the profile id, never on whether that profile liked the user. Putting likers first would be a leak.
- **No leak through counts or badges.** The UI never shows "N people liked you". The only indicator is a dot on Matches after a real new match.
- **Swipes are final.** There is no undo, and a swiped profile is never shown again.
- **`/api/matches` only returns mutual matches.**
- **Safe under retries and races.** Swipes are idempotent (`UNIQUE(swiperId, targetId)`), and the swipe plus match creation run in one transaction, so double taps or retries cannot create duplicates.

These rules are covered by automated tests (see below).

## Tech stack

- Next.js (App Router) and TypeScript
- Tailwind CSS and framer-motion for the UI and gestures
- Prisma 7 with PostgreSQL on Neon (driver adapter `@prisma/adapter-pg`)
- Zod for request validation
- Vitest and Testing Library for tests

Single logged-in user (id `me`) and no external auth, as per the assignment.

## Run locally

Requirements: Node 20+ and a PostgreSQL database (a free Neon project works).

```bash
npm install --legacy-peer-deps
cp .env.example .env        # then set DATABASE_URL
npm run db:push             # create tables
npm run db:seed             # seed the profiles
npm run dev                 # http://localhost:3000/discover
```

Environment variables:

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for the app |
| `TEST_DATABASE_URL` | A separate, disposable Postgres database used only by the tests |
| `ENABLE_DEMO_RESET` | Optional. Set to `false` to disable `POST /api/reset` |

## Tests

```bash
npm run test
```

The tests refuse to run against `DATABASE_URL` and need `TEST_DATABASE_URL`, because they wipe and reseed the database.

Service-layer tests cover:

1. The feed never contains an already swiped profile.
2. Re-posting the same swipe is idempotent.
3. A match is created only when both users liked; a pass or a one-way like never creates one.
4. The feed payload keys are identical for profiles who liked the user and those who did not.
5. The feed order does not depend on like status.
6. `/matches` excludes one-way likes.
7. Concurrent duplicate swipes create exactly one swipe and at most one match.
8. A one-way like and a pass return the same response shape.
9. Reset restores the seed state and can run repeatedly.

UI tests cover the swipe order for button and keyboard input (including a slow network response), the match overlay, the Matches view and the empty state.

## Part A: two feature suggestions

I signed up, added a crush using a second email and my own phone number, and went through the heads-up, the invite link and the extra-slots screen.

### Feature 1: Heads-up channel fallback (WhatsApp first, then SMS, then email)

**What I observed.** The heads-up reached me by SMS, and the email landed in the Promotions tab. Coy's landing page lists WhatsApp, SMS and email as channels, but in my test I did not receive a WhatsApp message.

**Suggestion.** Send the heads-up on WhatsApp first. If there is no click or open within 24 to 48 hours, retry on the next channel (SMS, then email), within Coy's existing limit of one message a week and three in total. Send the email as a short, plain, transactional-style message so it is not filed under Promotions. Show the sender only a neutral status such as "Heads-up delivered", never whether the crush opened it.

**Why it matters.** The whole product depends on the crush actually seeing the heads-up. If it is missed, the crush never joins and a match can never happen. Many people in India rarely read SMS and ignore emails that are not work-related, while WhatsApp is checked daily. A fallback chain increases activation and match rate without sending more messages than the current limits allow.

### Feature 2: Tiered referral rewards with visible progress

**What I observed.** "Get a slot free" needs 3 friends to join and each of them to add a crush. My progress was 0/3, and recruiting three friends who also add a crush is a high bar, so most users will probably stay at 0.

**Suggestion.** Break the reward into tiers: for example 1 friend who joins and adds a crush gives a discount coupon on a paid slot, and 3 friends give the free slot. Show the partial progress and the next reward on the progress bar.

**Why it matters.** Smaller early rewards keep people inviting, and Coy's real problem is getting crushes onto the app, so more invites means more heads-ups and more matches. The coupon also moves users towards the paid slots (from INR 49), so growth and revenue both benefit. The trade-off is slightly lower revenue per referred user, which I think is worth it for the extra users.

I deliberately did not suggest telling a sender when their crush joins, because that would leak information and go against Coy's "never who, not even through counts" rule.