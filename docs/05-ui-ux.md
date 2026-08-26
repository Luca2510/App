# 5. UI Structure & UX Design

## Visual direction

Dark, high-contrast, cinematic — the UI should get out of the way of the
card's text and art. Stat bars are the only persistent chrome; everything
else is the card. Mood: tense, literary, a little cold (closer to a film
title card than a typical mobile game HUD).

## Screen inventory

```
Splash
  └─► Onboarding (first run only, 3 screens, skippable)
        └─► Home
              ├─► Game Screen  ──(stat breaks)──► Ending Screen
              │        ▲                                │
              │        └──────── Play Again ─────────────┘
              ├─► Legacy / History
              └─► Settings
```

Navigation is a shallow stack — the player should be at most one tap from
the Game Screen at all times. There is no tab bar; this is not a
multi-section app, it's one loop with light framing around it.

## Screen-by-screen spec

### Splash
App logo on black, ~1s, transitions straight to Onboarding (first run) or
Home (returning player). No network call gates this.

### Onboarding (first run only)
3 short screens, swipeable, skippable from screen 1:
1. "Every choice costs you something." — establishes tone.
2. A visual of the 4 stat bars with a one-line explanation each.
3. A single practice swipe on a low-stakes sample card, so the gesture is
   learned by doing, not reading.

`settings.onboardingSeen` flag gates this permanently after completion or
skip.

### Home
Minimal: game title/logo, **Play** (primary button, large, centered — this
is the only action that matters), and two secondary entries to Legacy and
Settings. If a run is already in progress (app was killed mid-life), Play
resumes it directly and is labeled "Continue Your Life" instead of "Play."

### Game Screen (the core loop — most design effort goes here)

Layout, top to bottom:
- **4 stat bars** across the top, thin, color-coded, each with a subtle
  glow/pulse when within ~10 points of breaking (the game's primary tension
  signal — the player should *feel* an ending approaching before it
  happens).
- **Turn counter**, small, unobtrusive (top corner) — quietly reinforces
  "how far did I get" without competing with the card.
- **The decision card**, centered, dominant. Card shows the prompt text and
  optional mood art. Two edge labels (left choice / right choice) fade in
  as the card is dragged toward that side, so the player previews the
  framing of their choice before committing — but never the numeric stat
  deltas; the game must never feel like a spreadsheet.
- Swipe left/right (`Gesture Handler` pan + `Reanimated` spring physics:
  rotation proportional to drag distance, snap-back if released below
  commit threshold, fling-off animation if committed). Tap-to-choose
  buttons are the accessibility-equivalent fallback (see Accessibility
  below) and must trigger the identical animation and state path.
- On commit: stat bars animate to their new values (eased, ~400ms, with a
  brief color flash on any bar that moved), the **consequence line**
  (`choice.consequenceText`) appears for ~1.5s over the vacated card space,
  then the next card slides in from the deck.
- If the choice broke a stat: skip the consequence-line beat and cut
  straight to the Ending Screen — the transition itself should feel like
  the floor dropping out, not a normal turn.

### Ending Screen
- Ending title + description (from the matched `Ending`), full-bleed mood
  art.
- Cause of death, phrased as the specific stat/direction ("Your sanity
  broke first.").
- Life summary: turns survived, final 4 stats as a small radar/bar
  snapshot, 1–2 "defining choices" pulled from `history` (earliest
  high-magnitude-delta choices made).
- **Share** (primary): renders the ending as a single shareable image
  (ending art + title + turns survived + stat snapshot) via the native
  share sheet.
- **Play Again** (primary): immediately starts a new `GameSave`, no
  intermediate screen — friction here directly costs "one more run."

### Legacy / History
List of past runs (from local `run_history`, capped at 50) — ending icon,
turns survived, date. Tapping one re-opens that run's Ending Screen view
(read-only). Personal best (most turns survived) is pinned at the top.
This screen exists in the MVP purely to support replayability/comparison
against yourself — no cross-player leaderboard yet (Phase 2+).

### Settings
Sound toggle, haptics toggle, "Reset Progress" (destructive — confirm
dialog, clears `active_run` + `run_history`), app version, links (privacy
policy, credits).

## Motion & "juice" principles

These are what separate a spreadsheet with a story from a game that feels
addictive — treat this list as load-bearing, not decoration:

1. **Every state change animates.** No stat bar, screen transition, or
   card change ever jump-cuts.
2. **Haptics on every commit**, distinct patterns for a normal choice vs. a
   stat-breaking choice (a heavier, longer buzz for the latter).
3. **Escalating tension via the stat-bar glow**, not extra UI — the player
   should never need a tutorial popup to know they're close to an ending;
   the bars communicate it ambiently.
4. **The card is the star.** No modal dialogs, no popups interrupting the
   loop; even settings/legacy are one tap away and one tap back.
5. **Zero loading spinners inside the core loop.** Everything needed for a
   turn is already local; if this is ever violated by a future feature, that
   feature is wrong for this screen.

## Accessibility

- Every swipe interaction has a tap-button equivalent (two large buttons
  below the card, or a long-press-to-reveal choice pair) — required for
  motor-accessibility and for QA/automated testing, not optional.
- Stat bars communicate via color **and** position/fill (not color alone)
  for color-blind support.
- All text sized to respect system font-scaling; card prompt text has a
  minimum/maximum bound so long dilemma text degrades to smaller type
  rather than truncating.
- Haptics and sound are independently toggleable (Settings), and the game
  must be fully legible with both off.
