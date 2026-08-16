-- Run this in Supabase SQL Editor to add auth columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_salt TEXT;
