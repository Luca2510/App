# 3. Database & State Schema

Two schemas: the **local on-device store** (used from day one, MVP v1) and
the **Postgres backend** (introduced Phase 2 for optional cloud sync). They
share the same shape deliberately, so syncing is a direct mapping, not a
translation layer.

## 3.1 Local device store (MMKV key-value)

MMKV is key-value, not relational — these are the keys and the JSON shape
stored under each.

| Key | Shape | Notes |
|---|---|---|
| `active_run` | `GameSave` (below) or `null` | The in-progress life. Overwritten on every choice. |
| `run_history` | `RunSummary[]` | Capped at **50 entries**, FIFO eviction of oldest. Enough for a "best run" / recent-history screen without unbounded growth. |
| `settings` | `{ soundOn: bool, hapticsOn: bool, onboardingSeen: bool }` | |
| `content_version` | `string` | Which bundled content version is active; used later to detect when a remote update is available. |

```ts
type GameSave = {
  id: string;              // uuid, generated client-side
  turnCount: number;
  stats: {
    morality: number;       // 0-100, start 50
    wealth: number;
    relationships: number;
    sanity: number;
  };
  flags: Record<string, true>;   // sparse set, e.g. { "betrayed_partner": true }
  currentCardId: string;
  forcedNextCardId?: string;      // set when a choice explicitly chains to a card
  history: Array<{ cardId: string; choice: "left" | "right"; turn: number }>;
  contentVersion: string;
  startedAt: string;  // ISO
  updatedAt: string;
};

type RunSummary = {
  id: string;              // == GameSave.id
  endingId: string;
  finalStats: GameSave["stats"];
  turnsSurvived: number;
  startedAt: string;
  endedAt: string;
};
```

`history` on the active run stores card id + choice only (not full stat
deltas — those are re-derivable from content) to keep the local blob small.

## 3.2 Postgres backend schema (Phase 2)

Introduced only when cloud sync ships. Mirrors the local shapes above so
sync is a straight upsert, not a remodel.

```sql
-- Identity. Anonymous by default (device-bound), upgradeable to a real
-- account without changing the id.
create table users (
  id                uuid primary key default gen_random_uuid(),
  device_id         text unique,             -- set for anonymous users
  auth_user_id       uuid unique references auth.users(id), -- set once linked
  display_name        text,
  created_at            timestamptz not null default now(),
  last_active_at         timestamptz not null default now()
);

-- One row per life ever played (append-only, not just the active one).
create table game_saves (
  id                uuid primary key,        -- == client GameSave.id
  user_id            uuid not null references users(id) on delete cascade,
  status              text not null check (status in ('active','ended')),
  turn_count           int not null default 0,
  stat_morality         int not null check (stat_morality between 0 and 100),
  stat_wealth            int not null check (stat_wealth between 0 and 100),
  stat_relationships       int not null check (stat_relationships between 0 and 100),
  stat_sanity                int not null check (stat_sanity between 0 and 100),
  flags                        jsonb not null default '{}',
  current_card_id               text not null,
  content_version                 text not null,
  ending_id                        text references endings(id),
  started_at                        timestamptz not null,
  updated_at                          timestamptz not null default now(),
  ended_at                             timestamptz
);
create index on game_saves (user_id, status);

-- Per-turn log, mainly for analytics (content balancing) and the
-- end-of-run "defining choices" summary. Not required for gameplay itself.
create table decision_history (
  id            bigint generated always as identity primary key,
  save_id        uuid not null references game_saves(id) on delete cascade,
  turn_number     int not null,
  card_id          text not null,
  choice            text not null check (choice in ('left','right')),
  created_at         timestamptz not null default now()
);
create index on decision_history (save_id);

-- Content lives in Postgres once Phase 2's remote-content pipeline exists;
-- exported to the static JSON bundle shape consumed by the client.
create table decision_cards (
  id               text primary key,          -- slug, e.g. "betray_partner_01"
  version           int not null default 1,
  prompt             text not null,
  image_key           text,
  category             text not null,          -- moral | financial | relational | power
  weight                int not null default 10,
  min_turn               int,
  max_turn                 int,
  required_flags            text[] not null default '{}',
  forbidden_flags             text[] not null default '{}',
  choice_left                  jsonb not null,  -- { label, deltas, setsFlags, nextCardId? }
  choice_right                   jsonb not null,
  is_ending                        boolean not null default false,
  active                             boolean not null default true
);

create table endings (
  id                 text primary key,
  trigger_stat         text not null check (trigger_stat in ('morality','wealth','relationships','sanity')),
  trigger_direction      text not null check (trigger_direction in ('floor','ceiling')),
  title                    text not null,
  description                text not null,
  image_key                    text,
  rarity                          text not null default 'common'
);

-- Row-Level Security: each user only ever sees their own saves/history.
alter table game_saves enable row level security;
alter table decision_history enable row level security;
create policy "own saves" on game_saves
  using (user_id = auth.uid());
create policy "own history" on decision_history
  using (save_id in (select id from game_saves where user_id = auth.uid()));
```

## ER relationships

```
users (1) ──< (many) game_saves (1) ──< (many) decision_history
                    │
                    └── ending_id ──> endings

decision_cards  (standalone content catalog, referenced by id from
                 client-side history/current_card_id — not FK'd, since
                 content is versioned and may be edited/retired independently)
```

`decision_cards`/`endings` are intentionally **not** foreign-keyed from
`game_saves`/`decision_history` — content is versioned and mutable (cards
get rebalanced, retired, added), while a save's `current_card_id` is a
point-in-time reference. Enforcing a live FK would break old saves the
moment a card is deleted.

## Why append-only `game_saves` instead of one row per user

Keeping every life (not just the current one) as its own row is what makes
leaderboards, "your best run," and content-performance analytics ("which
card kills the most people") possible later with a `select`, not a
migration. It costs nothing at MVP scale and avoids a schema change to add
history in Phase 2+.
