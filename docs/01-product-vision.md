# 1. Product Vision

## Concept

**The World's Hardest Decision** is a mobile life-simulator built entirely
around one mechanic: an unbroken sequence of hard, morally ambiguous
decisions, each with irreversible consequences. There is no "correct" path —
every choice trades one part of your life for another. The player's "life"
ends when they push one part of themselves too far, and the resulting
life-summary is the thing they want to share and beat next time.

Reference points: *Reigns* (swipe-card decision loop, stat-balancing tension),
*BitLife* (life-simulation framing, shareable outcomes), *Papers, Please*
(moral weight, no clean answers).

## Core Loop (single session)

1. Player is shown a **decision card**: a short, weighty prompt
   ("Your daughter is sick. The only doctor who can help demands you betray
   your business partner. Do you tell him where to find her?").
2. Player **swipes left or right** (or taps a choice button) — each direction
   is a distinct choice with its own consequences.
3. The choice **shifts 1–3 of the player's 4 life stats**, a brief
   consequence line confirms what happened, and the game **advances one
   turn**.
4. Repeat. As turns accumulate, stakes escalate and previously made choices
   start recurring as consequences (via flags — see
   `04-decision-engine.md`).
5. The run ends the moment a stat hits its floor (0) or ceiling (100). An
   **ending card** is shown, tailored to which stat broke and how the player
   got there.
6. Player sees a **life summary** (turns survived, final stats, defining
   choices) and can share it or start a new life immediately.

A single run is designed to take **2–4 minutes**. The loop's whole point is
"one more life" — short enough to replay immediately, weighty enough that
each ending feels earned.

## Target player

Mobile players who enjoy short, replayable, narrative-flavored decision
games with social/shareable payoffs — the *Reigns* / *BitLife* / *Would You
Rather* audience. Sessions happen in spare moments (commute, queue,
bathroom break), which is why runs must stay short and resumable.

## Why this is winnable as an MVP

The entire game is one mechanic, repeated. There is no combat system, no
economy, no multiplayer — the production cost is almost entirely **content**
(writing decision cards) plus a small, polishable core loop. That is the
correct shape for an MVP: a tiny, deep, replayable core rather than a wide,
shallow feature set.

## MVP scope — IN

- Single-player "Life" mode: endless run of decision cards until a stat
  breaks.
- 4 core life stats (Morality, Wealth, Relationships, Sanity).
- A hand-authored content set: **~100–150 decision cards**, **~12–16 distinct
  endings**, enough recurring-character flag chains to make the game feel
  written rather than randomized.
- Local save of the in-progress run (close the app mid-life, resume where
  you left off).
- Local run history (last N runs + personal best, on-device only).
- End-of-run summary screen with native share (image + text).
- Onboarding (first-run only, 2–3 screens).
- Settings: sound, haptics, reset progress.
- Fully playable offline, no account required.

## MVP scope — OUT (explicitly deferred, see `06-mvp-plan.md`)

- Accounts / cloud sync / cross-device save.
- Leaderboards or any cross-player comparison.
- Daily seeded "Decision of the Day" challenge mode.
- Monetization (IAP, ads, cosmetics store).
- Push notifications / re-engagement messaging.
- Achievements/trophy system.
- Procedural or AI-generated decision content.
- Deep branching narrative tree (we use flags + a card pool, not a
  hand-authored tree — see decision engine doc for why).
- Localization beyond English.
- Multiplayer or social feed of other players' endings.

These are not rejected ideas — they're a deliberate Phase 2+ backlog so the
MVP ships fast and the core loop gets validated before we spend effort on
retention/monetization layers built on top of it.

## Success metrics for the MVP

These are what we'd actually look at before investing in Phase 2:

- **D1 retention** of the core loop (do people come back the next day
  without any push notification to prompt them?).
- **Runs per session** (is "one more life" actually happening?).
- **Median turns survived** and **ending distribution** (is the stat balance
  producing varied, interesting deaths, or does everyone die the same way?).
- **Share rate** on the end-of-run screen.
