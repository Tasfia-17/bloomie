-- Run in Supabase SQL Editor: adds garden_items table for interactive garden
CREATE TABLE IF NOT EXISTS garden_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🌸',
  color TEXT NOT NULL DEFAULT '#A8C5A0',
  source_metric TEXT NOT NULL,
  source_value TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_z FLOAT NOT NULL DEFAULT 0,
  planted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garden_items_user ON garden_items(user_id, planted_at DESC);
