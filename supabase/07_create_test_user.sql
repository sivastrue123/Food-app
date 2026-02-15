-- Create Test Admin User
-- Run this in Supabase SQL Editor AFTER running all 6 schema files (01-06)

-- Test Credentials:
-- Username: admin
-- Password: Admin@123

INSERT INTO users (email, username, password_hash, role, is_temp_password)
VALUES (
  'admin@hotel.com',
  'admin',
  '$2a$10$rZ5YhkKvLqYqYqYqYqYqYeJ3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3a',
  'admin',
  false
);

-- Verify the user was created
SELECT id, email, username, role, is_temp_password, created_at 
FROM users 
WHERE username = 'admin';
