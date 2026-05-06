ALTER TABLE players
  ADD COLUMN IF NOT EXISTS display_name_custom BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS players_referred_by_idx ON players (referred_by);
