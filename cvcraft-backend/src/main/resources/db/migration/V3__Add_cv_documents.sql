-- Update role constraint: remove RECRUITER, keep only CANDIDATE and ADMIN
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'CANDIDATE' WHERE role = 'RECRUITER';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('CANDIDATE', 'ADMIN'));

-- CV Documents library - stores metadata for each user's generated CVs
CREATE TABLE cv_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'My CV',
    template_id VARCHAR(50),
    file_name VARCHAR(200),
    download_url VARCHAR(500),
    ats_score INTEGER,
    jd_title VARCHAR(200),
    jd_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cv_documents_user ON cv_documents(user_id);
CREATE INDEX idx_cv_documents_created ON cv_documents(created_at DESC);
