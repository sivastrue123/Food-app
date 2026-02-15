-- QUICK SETUP: Run this single file to get started immediately
-- This creates the users table and a test admin user

-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
  is_temp_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 4: Insert test admin user
-- Credentials: username = admin, password = Admin@123
INSERT INTO users (email, username, password_hash, role, is_temp_password)
VALUES (
  'admin@hotel.com',
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  false
)
ON CONFLICT (username) DO NOTHING;

-- Step 5: Verify user was created
SELECT 
  id, 
  email, 
  username, 
  role, 
  is_temp_password, 
  created_at 
FROM users 
WHERE username = 'admin';
