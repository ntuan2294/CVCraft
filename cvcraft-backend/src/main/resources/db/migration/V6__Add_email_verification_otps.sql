-- Email Verification OTPs
CREATE TABLE email_verification_otps (
    id BIGSERIAL PRIMARY KEY,
    otp_code VARCHAR(6) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verification_otps_user ON email_verification_otps(user_id);
