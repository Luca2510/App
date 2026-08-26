# The World's Hardest Decision

A mobile decision-based life simulator. The player is repeatedly confronted
with morally loaded, high-stakes dilemmas (swipe left / swipe right, in the
spirit of *Reigns*) and must live with the consequences until one of their
core life stats collapses — at which point their "life" ends and can be
shared.

This repository currently contains the **MVP technical design** — no
implementation yet, by design (see `docs/06-mvp-plan.md` for why architecture
comes before code).

## Documents

| Doc | Contents |
|---|---|
| [`docs/01-product-vision.md`](docs/01-product-vision.md) | Concept, core loop, target player, MVP scope (in/out), success metrics |
| [`docs/02-architecture.md`](docs/02-architecture.md) | System architecture, tech stack + rationale, client module breakdown, offline-first strategy |
| [`docs/03-database-schema.md`](docs/03-database-schema.md) | Local device schema + Postgres backend schema (Phase 2), ER relationships |
| [`docs/04-decision-engine.md`](docs/04-decision-engine.md) | Card data model, state machine, card-selection algorithm, ending resolution, content authoring rules |
| [`docs/05-ui-ux.md`](docs/05-ui-ux.md) | Screen inventory, navigation flow, screen-by-screen UX spec, motion/juice design |
| [`docs/06-mvp-plan.md`](docs/06-mvp-plan.md) | Phased build plan, exit criteria per phase, explicit out-of-scope list, risks |

## TL;DR stack decision

- **Client:** React Native (Expo, TypeScript) — one codebase, `Reanimated` +
  `Gesture Handler` for swipe-card physics, EAS for builds and OTA patches.
- **Local persistence (MVP v1, no backend required to play):** `MMKV` for
  save state, content shipped as a versioned JSON bundle.
- **Backend (introduced Phase 2):** Supabase (Postgres + Auth + Edge
  Functions) — cloud save sync, remote content updates, leaderboard-ready
  relational schema.
- **Analytics:** PostHog. **Crash reporting:** Sentry.

See `docs/02-architecture.md` for the reasoning behind each choice.
