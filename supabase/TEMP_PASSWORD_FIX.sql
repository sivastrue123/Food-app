-- TEMPORARY FIX: Use plain text password for testing
-- This will help us verify the login flow works
-- We'll fix the hash after login is working

UPDATE users 
SET password_hash = 'Admin@123',
    is_temp_password = true,
    updated_at = NOW()
WHERE username = 'admin';

-- Verify
SELECT id, username, email, role, password_hash, is_temp_password
FROM users
WHERE username = 'admin';
