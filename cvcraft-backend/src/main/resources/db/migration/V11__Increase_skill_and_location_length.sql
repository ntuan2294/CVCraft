-- Increase skill column in candidate_skills from VARCHAR(100) to VARCHAR(255)
-- AI-generated skill names can exceed 100 characters
ALTER TABLE candidate_skills ALTER COLUMN skill TYPE VARCHAR(255);

-- Increase location in candidate_profiles from VARCHAR(100) to VARCHAR(200)
ALTER TABLE candidate_profiles ALTER COLUMN location TYPE VARCHAR(200);
