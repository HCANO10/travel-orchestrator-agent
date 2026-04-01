-- Migration 001: Create missions table
-- Run this in your Supabase SQL editor before enabling persistence.

CREATE TABLE IF NOT EXISTS missions (
  id              TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'init',
  destination     TEXT,
  state_json      TEXT NOT NULL DEFAULT '{}',
  nodes_completed TEXT[] DEFAULT '{}',
  total_budget    NUMERIC,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS missions_updated_at ON missions;
CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for listing missions by prefix (user_id pattern)
CREATE INDEX IF NOT EXISTS idx_missions_id_prefix ON missions (id text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON missions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions (status);

-- Enable Row Level Security (optional - enable if using auth)
-- ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
