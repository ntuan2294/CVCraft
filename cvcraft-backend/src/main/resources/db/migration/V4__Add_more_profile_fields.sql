-- ============================================================
-- Add more profile fields to candidate_profiles
-- ============================================================

ALTER TABLE candidate_profiles ADD COLUMN languages JSONB;
ALTER TABLE candidate_profiles ADD COLUMN projects JSONB;
ALTER TABLE candidate_profiles ADD COLUMN references_info TEXT;
