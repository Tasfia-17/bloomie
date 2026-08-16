-- Bloomie Database Schema
-- Run this in Supabase SQL Editor
-- Covers: users, wellness data, baselines, assessments, quests, nest contacts, insights

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'bloomie_default',
  timezone TEXT DEFAULT 'America/Toronto',
  garden_level INT DEFAULT 1,
  total_quests_completed INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- WELLNESS DATA (normalized health hub - all sources feed into this)
-- ============================================================================

-- Categories: body, habits, self_report, environment, life_context, social
CREATE TABLE IF NOT EXISTS wellness_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('body', 'habits', 'self_report', 'environment', 'life_context', 'social')),
  metric TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT DEFAULT 'manual',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Metric examples per category:
-- body: heart_rate, resting_hr, hrv, blood_pressure, respiratory_rate, steps, weight, activity_minutes, sleep, spo2
-- habits: hydration, medication, exercise, stretching, mindfulness, meals, caffeine, screen_breaks
-- self_report: mood, energy, stress, pain, journal, daily_checkin
-- environment: temperature, humidity, weather, air_quality
-- life_context: calendar_load, meetings_count, workload, travel, sleep_schedule
-- social: calls, messages, social_checkins

-- ============================================================================
-- PERSONAL BASELINES (learned from user's own data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  baseline_mean FLOAT,
  baseline_stdev FLOAT,
  baseline_min FLOAT,
  baseline_max FLOAT,
  sample_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric)
);

-- ============================================================================
-- ASSESSMENTS (AI-generated wellness assessments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score FLOAT NOT NULL DEFAULT 0.8 CHECK (overall_score >= 0 AND overall_score <= 1),
  deviation_level TEXT DEFAULT 'none' CHECK (deviation_level IN ('none', 'mild', 'moderate', 'significant')),
  narrative TEXT,
  insights JSONB DEFAULT '[]',
  garden_state JSONB DEFAULT '{"sky": "clear", "pond_level": 0.8, "tree_growth": 0.5, "butterfly_count": 5, "bird_count": 3, "firefly_count": 0}',
  deviations JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- QUESTS (gamification - daily/weekly wellness challenges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hydration', 'movement', 'connection', 'sleep', 'recovery', 'kindness', 'mindfulness', 'nutrition')),
  title TEXT NOT NULL,
  description TEXT,
  target_value FLOAT DEFAULT 1,
  current_value FLOAT DEFAULT 0,
  reward TEXT DEFAULT 'flower',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- NEST CONTACTS (social wellness - important people)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nest_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  emoji TEXT DEFAULT '❤️',
  phone TEXT,
  email TEXT,
  last_contact_at TIMESTAMPTZ,
  contact_frequency_days INT DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INSIGHTS (AI-generated weekly/pattern insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pattern', 'correlation', 'trend', 'suggestion', 'celebration')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_metrics TEXT[] DEFAULT '{}',
  confidence FLOAT DEFAULT 0.5,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- GARDEN UNLOCKS (ecosystem progression)
-- ============================================================================

CREATE TABLE IF NOT EXISTS garden_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('flower', 'butterfly', 'animal', 'tree', 'structure', 'feature')),
  item_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_name)
);

-- ============================================================================
-- CAREGIVER ACCESS (family dashboard permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS caregiver_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  permissions JSONB DEFAULT '{"mood": false, "sleep": true, "steps": true, "vitals": true, "journal": false, "medication": true}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, caregiver_id)
);

-- ============================================================================
-- CHAT HISTORY (Bloomie companion conversations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'bloomie')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE wellness_data;
ALTER PUBLICATION supabase_realtime ADD TABLE quests;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wellness_user_category ON wellness_data(user_id, category, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_user_metric ON wellness_data(user_id, metric, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quests_user_status ON quests(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baselines_user ON baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_nest_contacts_user ON nest_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id, created_at DESC);
