const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

async function createUser() {
  const email = 'crashdi@trilogyhq.com'
  const password = 'trilogy26'

  console.log(`Creating user with email: ${email}`)

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  })

  if (error) {
    console.error('Error creating user:', error.message)
    
    // If user already exists, try to sign in
    if (error.message.includes('already registered')) {
      console.log('\nUser already exists. Attempting to sign in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      
      if (signInError) {
        console.error('Sign in error:', signInError.message)
        console.log('\nPlease check the password or reset it in Supabase Dashboard')
      } else {
        console.log('✅ User exists and password is correct!')
        console.log('User ID:', signInData.user.id)
      }
    }
    process.exit(1)
  }

  if (data.user) {
    console.log('✅ User created successfully!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
    console.log('\n⚠️  Note: Email confirmation may be required.')
    console.log('You can disable email confirmation in Supabase Dashboard:')
    console.log('Auth > Settings > Email Auth > Enable email confirmations (disable this)')
    console.log('\nLogin credentials:')
    console.log('Email: crashdi@trilogyhq.com')
    console.log('Password: trilogy26')
  }
}

createUser()

