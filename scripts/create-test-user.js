// Script to create a test admin user in Supabase
// Run this AFTER you've executed all SQL schema files in Supabase

import bcrypt from 'bcryptjs'

const testUser = {
  email: 'admin@hotel.com',
  username: 'admin',
  password: 'Admin@123',
  role: 'admin'
}

async function generateHash() {
  const hash = await bcrypt.hash(testUser.password, 10)
  
  console.log('\n=== Test User Credentials ===')
  console.log('Username:', testUser.username)
  console.log('Password:', testUser.password)
  console.log('\n=== SQL to Insert User ===')
  console.log(`
INSERT INTO users (email, username, password_hash, role, is_temp_password)
VALUES (
  '${testUser.email}',
  '${testUser.username}',
  '${hash}',
  '${testUser.role}',
  false
);
  `)
  console.log('\n=== Instructions ===')
  console.log('1. Go to your Supabase project')
  console.log('2. Open SQL Editor')
  console.log('3. Copy and paste the SQL above')
  console.log('4. Click "Run"')
  console.log('5. Login with username: admin, password: Admin@123')
}

generateHash()
