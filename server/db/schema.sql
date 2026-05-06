CREATE TABLE players (
  id TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  language_code TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  selected_avatar_race TEXT NOT NULL DEFAULT 'orcs',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  energy_current INTEGER NOT NULL DEFAULT 25,
  energy_max INTEGER NOT NULL DEFAULT 25,
  energy_next_regen_at TIMESTAMPTZ,
  invited_count INTEGER NOT NULL DEFAULT 0,
  active_invited_count INTEGER NOT NULL DEFAULT 0,
  referral_level INTEGER NOT NULL DEFAULT 1,
  stats_created INTEGER NOT NULL DEFAULT 0,
  stats_merged INTEGER NOT NULL DEFAULT 0,
  stats_deleted INTEGER NOT NULL DEFAULT 0,
  stats_trophies INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  race TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  stars INTEGER NOT NULL,
  state TEXT NOT NULL,
  image_url TEXT NOT NULL,
  board_index INTEGER,
  source TEXT NOT NULL,
  merged_from JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cards_board_slot_unique UNIQUE (player_id, board_index)
);

CREATE TABLE reward_claims (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  amount INTEGER,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reward_claim_once UNIQUE (player_id, reward_id)
);

CREATE TABLE action_ledger (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  client_action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT action_once UNIQUE (player_id, client_action_id)
);

CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  inviter_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  invited_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL CHECK (depth IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'pending',
  xp_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT referral_once UNIQUE (inviter_player_id, invited_player_id, depth)
);

CREATE INDEX cards_player_state_idx ON cards (player_id, state);
CREATE INDEX action_ledger_player_created_idx ON action_ledger (player_id, created_at DESC);
CREATE INDEX referrals_inviter_idx ON referrals (inviter_player_id, depth, status);
CREATE INDEX leaderboard_level_xp_idx ON players (level DESC, xp DESC);
