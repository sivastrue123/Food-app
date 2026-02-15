import bcrypt from 'bcryptjs'

// Test password hashing
async function testPassword() {
  const password = 'Admin@123'
  const storedHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  
  console.log('Testing password:', password)
  console.log('Stored hash:', storedHash)
  
  // Test if stored hash matches
  const isValid = await bcrypt.compare(password, storedHash)
  console.log('Password matches stored hash:', isValid)
  
  // Generate a new hash
  const newHash = await bcrypt.hash(password, 10)
  console.log('\nNew hash generated:', newHash)
  
  // Test new hash
  const newHashValid = await bcrypt.compare(password, newHash)
  console.log('Password matches new hash:', newHashValid)
  
  console.log('\n=== SQL TO UPDATE DATABASE ===')
  console.log(`UPDATE users SET password_hash = '${newHash}' WHERE username = 'admin';`)
}

testPassword()
