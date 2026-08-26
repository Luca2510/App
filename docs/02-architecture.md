# 2. Technical Architecture

## Guiding principle: offline-first, backend-optional

The core loop must be **fully playable with zero network calls**. This is
not just a resilience nicety — it's what makes the MVP shippable in weeks
instead of months: no auth flow, no server to stand up, no sync-conflict
logic, before the game itself is proven fun. The backend is layered in at
Phase 2 as a strict addition, not a rewrite (see `06-mvp-plan.md`).

## System diagram

```
┌───────────────────────────────────────────────────────────┐
│                     Mobile Client (RN/Expo)                │
│                                                              │
│  ┌────────────┐   ┌────────────────┐   ┌─────────────────┐ │
│  │  UI Layer   │   │  Decision       │   │  Local Storage  │ │
│  │  (screens,  │◄─►│  Engine         │◄─►│  (MMKV)         │ │
│  │  swipe card,│   │  (pure TS,      │   │  - save state   │ │
│  │  animations)│   │  no I/O)        │   │  - run history  │ │
│  └────────────┘   └────────┬────────┘   │  - settings     │ │
│                             │             └─────────────────┘ │
│                    ┌────────▼────────┐                       │
│                    │ Content Bundle   │  (v1: shipped in app;│
│                    │ (decision cards, │   Phase 2: fetched   │
│                    │  endings, JSON)  │   + cached from CDN) │
│                    └──────────────────┘                       │
└──────────────────────────────┬────────────────────────────────┘
                                 │  (Phase 2 only — optional)
                     ┌───────────▼────────────┐
                     │   Supabase Backend      │
                     │  - Postgres (schema in  │
                     │    03-database-schema)  │
                     │  - Auth (anonymous +    │
                     │    optional sign-in)    │
                     │  - Edge Functions       │
                     │  - Storage (card art)   │
                     └──────────────────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │  PostHog (analytics)    │
                     │  Sentry (crash reports) │
                     └──────────────────────────┘
```

## Tech stack + rationale

| Layer | Choice | Why |
|---|---|---|
| Client framework | **React Native + Expo, TypeScript** | One codebase for iOS/Android, fast iterate loop, EAS handles builds/signing/OTA updates so content and bugfixes can ship without a full store review cycle. |
| Animation/gesture | **React Native Reanimated + Gesture Handler** | The swipe-card mechanic *is* the product — it needs to run on the UI thread at 60fps, not JS-thread `PanResponder`. Non-negotiable for "polished, addictive" feel. |
| App state | **Zustand** | Small, no-boilerplate store for the active run's in-memory state (stats, turn, flags, current card). Avoids Redux ceremony for a state shape this simple. |
| Local persistence | **react-native-mmkv** | Synchronous, fast key-value storage. The entire persisted state (one active run + capped run history + settings) is small — no relational queries needed on-device, so SQLite would be unjustified complexity for MVP. |
| Content format | **Versioned JSON bundle**, typed via shared TS types | Cards ship inside the app binary for v1 (zero network dependency to play). Schema is designed so Phase 2 can fetch/cache the same shape from a CDN without touching the engine. |
| Backend (Phase 2) | **Supabase** (Postgres + Auth + Edge Functions + Storage) | Our data is genuinely relational (users → saves → runs → decision history); Postgres gives real query flexibility for future leaderboards/analytics without a NoSQL remodel later. Built-in anonymous auth matches "no forced account" requirement. Row-Level Security gives per-user data isolation for free. |
| Analytics | **PostHog** | Event + funnel + retention analysis, self-hostable if data residency matters later. Needed to evaluate the MVP success metrics in `01-product-vision.md`. |
| Crash reporting | **Sentry** | Standard, RN SDK is mature. |
| CI | **GitHub Actions** (lint, typecheck, unit tests on PR) + **EAS Build** | Keeps the decision engine (pure logic, heavily unit-testable) honest on every PR. |

## Client module breakdown

```
/app
  /screens        — one component per screen (see 05-ui-ux.md)
  /components      — DecisionCard, StatBar, ShareCard, etc.
  /navigation       — stack/navigator config
/engine
  /types.ts         — DecisionCard, Choice, GameState, Ending (shared with content)
  /gameState.ts      — pure reducer: applyChoice(state, card, choiceId) -> state
  /cardSelector.ts    — pure fn: selectNextCard(state, pool) -> card
  /endingResolver.ts   — pure fn: resolveEnding(state) -> Ending | null
  /engine.test.ts       — unit tests (this package has the highest bar for coverage)
/content
  /cards.json        — decision card pool
  /endings.json        — ending catalog
  /schema.ts           — zod schema validating the above at build time
/storage
  /localStore.ts      — MMKV read/write wrappers, run history cap logic
/services (Phase 2 only)
  /supabaseClient.ts
  /syncSave.ts
  /remoteContent.ts
```

The `/engine` package is deliberately **pure** (no I/O, no React) so it's
trivially unit-testable and, if we ever want a web version or a server-side
"replay validator," it's portable as-is.

## Offline-first data flow

1. On first launch, content bundle (`cards.json`, `endings.json`) loads from
   the app binary — validated against the zod schema once at startup (fail
   loud in dev, fail safe in prod by dropping invalid cards).
2. `gameState` lives in Zustand; every `applyChoice` call is followed by a
   synchronous MMKV write of the active-run snapshot. If the app is killed
   mid-run, relaunch reads that snapshot and resumes exactly where the
   player left off.
3. On run end, the snapshot is cleared from "active run" and appended to the
   capped local run-history list (see schema doc for the cap/eviction rule).
4. **Phase 2 only:** a background sync task pushes the same snapshot/history
   shape to Supabase when a network is available and the player has opted
   into an account. This is additive — the local path keeps working
   identically whether or not sync is enabled.

## Scalability notes (why this holds up past MVP)

- Content is data, not code: adding/rebalancing decision cards never
  requires an app store release once Phase 2's remote content fetch lands —
  only a CDN/DB update.
- The engine's purity means new modes (a seeded "Daily Decision," a
  "Challenge" mode with a fixed card sequence) are new callers of
  `selectNextCard`/`applyChoice`, not new engines.
- Postgres schema (next doc) is normalized around `users → saves → runs →
  decision_history`, which supports leaderboards, cohort analytics, and
  content-performance analysis (which cards cause the most deaths, which
  get skipped) without restructuring.
- Anonymous-auth-first means the accountless MVP and the later "sign in to
  sync across devices" feature are the same identity system, not a bolt-on
  migration.
