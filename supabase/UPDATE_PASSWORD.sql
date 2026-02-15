-- UPDATE ADMIN PASSWORD
-- This updates the admin user with a fresh password hash for "Admin@123"

UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    updated_at = NOW()
WHERE username = 'admin';

-- Verify the update
SELECT id, username, email, role, is_temp_password, updated_at
FROM users
WHERE username = 'admin';
