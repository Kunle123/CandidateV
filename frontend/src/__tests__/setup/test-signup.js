import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  const testUser = {
    email: `test.${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'Test User'
  }

  console.log('Testing signup with:', testUser.email)

  try {
    // Attempt signup
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.name,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      console.error('Signup failed:', error.message)
      return false
    }

    console.log('Signup successful:', {
      userId: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata
    })

    // Try to sign in with the new account
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (signInError) {
      console.error('Sign in failed:', signInError.message)
      return false
    }

    console.log('Sign in successful:', {
      userId: signInData.user.id,
      session: !!signInData.session
    })

    return true
  } catch (error) {
    console.error('Test failed:', error)
    return false
  }
}

testSignup().then(success => {
  console.log('Test completed:', success ? 'PASSED' : 'FAILED')
  process.exit(success ? 0 : 1)
}) 