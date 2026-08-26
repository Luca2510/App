# 6. MVP Development Plan

## Why architecture before code

This game is one mechanic played thousands of times — if the state model,
card schema, or ending logic needs to change after 100 cards are written
against it, that's 100 cards of rework, not a refactor. The design in
docs 02–05 is the contract that content, UI, and (later) backend work all
build against; that's the entire reason it comes first.

## Phasing

Each phase has a hard exit criterion. Do not start the next phase until the
current one's criterion is met — this is what keeps the MVP from sliding
into scope creep.

### Phase 0 — Foundations (engine + scaffolding, no UI polish)
- RN/Expo project scaffolded per `02-architecture.md`'s module layout.
- `/engine` implemented and unit-tested: `applyChoice`, `selectNextCard`,
  `resolveEnding`, per `04-decision-engine.md`.
- Content schema (zod) + a **placeholder set of ~15 cards** and 4 endings
  (one per stat/floor, enough to exercise every code path) — not final
  content, just enough to prove the engine.
- MMKV read/write wrappers, active-run persistence + resume.
- **Exit criterion:** a run can be played start-to-end from a debug/CLI
  harness (no real UI yet) with correct stat clamping, flag gating, and
  ending resolution, covered by unit tests.

### Phase 1 — Core loop UI
- Game Screen with real swipe-card gesture/animation (Reanimated +
  Gesture Handler), stat bars, consequence-line beat, ending transition.
- Home, Ending, and Settings screens.
- Onboarding.
- **Exit criterion:** a real player can install a dev build, play a full
  life start to ending, and it *feels* like the motion/juice principles in
  `05-ui-ux.md` — this is the point to get the loop in front of a handful
  of external testers, before sinking more time into content volume.

### Phase 2 — Content pass
- Full content set authored: ~100–150 cards, 12–16 endings, per the
  authoring rules in `04-decision-engine.md` (both-direction stat coverage,
  a handful of `oneShot`/chained story arcs).
- Balancing pass using PostHog data from Phase 1 testers (if available) or
  internal playtesting otherwise: check ending distribution isn't
  dominated by one stat, median turns survived is in the target range.
- Legacy/History screen (local-only).
- Share-card image generation + native share sheet.
- **Exit criterion:** internal playtesters produce varied endings across
  multiple runs each, and the share image looks good enough to actually
  post.

### Phase 3 — Ship the MVP (v1.0, fully local, no backend)
- Sentry + PostHog wired for the success metrics in `01-product-vision.md`.
- App Store / Play Store listing, icons, screenshots.
- Store submission.
- **Exit criterion:** live in both stores, fully playable offline, zero
  backend dependency. **This is the MVP.** Everything below is
  post-MVP and gated on what v1.0's data shows.

### Phase 4 — Backend layer (post-MVP, only if Phase 3 metrics justify it)
- Supabase project stood up per `03-database-schema.md`.
- Anonymous auth wired on first launch (silent, no UI friction); optional
  "link an account" added to Settings.
- Cloud sync of `active_run`/`run_history` — additive to local storage, not
  a replacement.
- Remote content pipeline (cards/endings servable from Postgres → CDN
  bundle) so future content updates skip app-store review.
- **Exit criterion:** a player can reinstall the app and, if they'd linked
  an account, resume their history.

## Explicitly out of scope for the MVP (do not build until v1.0 data justifies it)

Repeated here from `01-product-vision.md` because it's the thing most
likely to get scope-crept during development:

- Leaderboards / cross-player comparison
- Daily seeded challenge mode
- Monetization (IAP/ads/cosmetics)
- Push notifications
- Achievements
- Procedural/AI-generated content
- Localization
- Multiplayer/social feed

## Team & skills needed

- 1 RN/TypeScript engineer (client + engine) — can realistically carry
  Phases 0–3 solo given the scope discipline above.
- 1 writer for the ~100–150 decision cards (the actual bottleneck on
  quality — this is a writing-heavy MVP, not an engineering-heavy one).
- Light UI/motion design input for Phase 1 (even a few reference frames for
  the card/stat-bar treatment materially de-risks the "polished" bar).

## Top risks

| Risk | Mitigation |
|---|---|
| Content feels repetitive/random rather than "written" | Authoring rules in `04-decision-engine.md` (both-direction stat coverage, `oneShot` flag chains) exist specifically to counter this — do not skip them under time pressure. |
| Swipe mechanic feels sluggish/cheap on real devices | Reanimated/Gesture Handler runs animation on the UI thread by design; test on a low-end Android device early in Phase 1, not at the end. |
| Stat balance produces one dominant ending | The PostHog ending-distribution metric exists to catch this in Phase 2's balancing pass before launch, not after. |
| Scope creep into Phase 4 items before v1.0 ships | Phase exit criteria above are hard gates — Phase 3's criterion is deliberately "live in stores," not "live in stores with sync." |
