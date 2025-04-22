const axios = require('axios');

const SUPABASE_URL = 'https://aqmybjkzxfwiizorveco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXliamt6eGZ3aWl6b3J2ZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MjA5NzAsImV4cCI6MjAyNTQ5Njk3MH0.Ry-vK5oJ_0QQp-iFVjBY_vhYPHyHxZeQZOBggg5tD8M';

async function testSupabaseHealth() {
  console.log('\n🔍 Testing Supabase health...');
  try {
    const response = await axios.get(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    console.log('✅ Supabase health check:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

async function testAccountCreation() {
  console.log('\n👤 Testing Account Creation...');
  const email = `test${Date.now()}@example.com`;
  const userData = {
    email,
    password: 'Test123!@#',
    data: {
      name: 'Test User'
    }
  };

  try {
    console.log(`📧 Creating account with email: ${email}`);
    const response = await axios.post(
      `${SUPABASE_URL}/auth/v1/signup`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );
    console.log('✅ Account created successfully:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error creating account:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting tests...\n');
    
    // Test Supabase health
    await testSupabaseHealth();
    
    // Test account creation
    await testAccountCreation();
    
    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed');
    process.exit(1);
  }
}

runTests(); 