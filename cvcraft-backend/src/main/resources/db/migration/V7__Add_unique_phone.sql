-- Remove duplicate phone numbers before adding constraint (keep oldest account)
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id) FROM users GROUP BY phone
)
AND phone IS NOT NULL
AND phone != '';

-- Add unique constraint on phone (NULL values are excluded automatically in PostgreSQL)
CREATE UNIQUE INDEX idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL AND phone != '';
