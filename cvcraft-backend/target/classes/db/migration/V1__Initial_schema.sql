-- ============================================================
-- CVCraft Initial Schema
-- ============================================================

-- Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('CANDIDATE', 'RECRUITER', 'ADMIN')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(200),
    location VARCHAR(200),
    logo_url VARCHAR(500),
    cover_url VARCHAR(500),
    founded_year INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Job Posts
CREATE TABLE job_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    location VARCHAR(100),
    job_type VARCHAR(20) CHECK (job_type IN ('FULL_TIME','PART_TIME','CONTRACT','FREELANCE','INTERNSHIP')),
    experience_level VARCHAR(20) CHECK (experience_level IN ('INTERN','JUNIOR','MID','SENIOR','LEAD','MANAGER','DIRECTOR')),
    work_mode VARCHAR(10) CHECK (work_mode IN ('ONSITE','REMOTE','HYBRID')),
    salary_min BIGINT,
    salary_max BIGINT,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    is_salary_visible BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),
    deadline DATE,
    vacancy_count INTEGER DEFAULT 1,
    status VARCHAR(10) DEFAULT 'OPEN' CHECK (status IN ('OPEN','PAUSED','CLOSED','DRAFT')),
    view_count BIGINT DEFAULT 0,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Job Skills (collection table)
CREATE TABLE job_skills (
    job_id BIGINT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL
);

-- Candidate Profiles
CREATE TABLE candidate_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200),
    bio TEXT,
    location VARCHAR(100),
    experience_years INTEGER,
    experience_level VARCHAR(20),
    desired_salary_min BIGINT,
    desired_salary_max BIGINT,
    desired_job_types VARCHAR(100),
    desired_work_mode VARCHAR(10),
    cv_url VARCHAR(500),
    linkedin_url VARCHAR(200),
    github_url VARCHAR(200),
    portfolio_url VARCHAR(200),
    is_open_to_work BOOLEAN DEFAULT TRUE,
    is_profile_visible BOOLEAN DEFAULT TRUE,
    profile_views BIGINT DEFAULT 0,
    work_experiences JSONB,
    educations JSONB,
    certifications JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Candidate Skills (collection table)
CREATE TABLE candidate_skills (
    profile_id BIGINT NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL
);

-- Applications
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id BIGINT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    cv_url VARCHAR(500),
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','REVIEWING','SHORTLISTED','INTERVIEW','OFFERED','HIRED','REJECTED','WITHDRAWN')),
    recruiter_note TEXT,
    rejection_reason TEXT,
    interview_date TIMESTAMP,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id BIGINT REFERENCES job_posts(id) ON DELETE CASCADE,
    candidate_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('JOB','CANDIDATE')),
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_company ON job_posts(company_id);
CREATE INDEX idx_job_posts_category ON job_posts(category);
CREATE INDEX idx_job_posts_location ON job_posts(location);
CREATE INDEX idx_job_posts_experience ON job_posts(experience_level);
CREATE INDEX idx_job_posts_created ON job_posts(created_at DESC);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_candidate_profile_user ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profile_visible ON candidate_profiles(is_profile_visible);
CREATE INDEX idx_candidate_profile_open ON candidate_profiles(is_open_to_work);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ============================================================
-- Seed data
-- ============================================================
-- Admin user (password: Admin@123)
INSERT INTO users (email, password, full_name, role, is_active, is_email_verified)
VALUES ('admin@cvcraft.com', '$2a$10$xf3bOIJlLIkwz7/A0yzOFuYjBVyOFrVYnT8pFgR0JaezS3cBf26s6', 'CVCraft Admin', 'ADMIN', true, true);
