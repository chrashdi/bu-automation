const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('Please add it from: https://supabase.com/dashboard/project/gkbabipghxukunqossvb/settings/api')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  const email = 'crashdi@example.com'
  const password = 'trilogy26'

  console.log(`Creating user with email: ${email}`)

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm email so user can login immediately
  })

  if (error) {
    console.error('Error creating user:', error.message)
    process.exit(1)
  }

  console.log('✅ User created successfully!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
  console.log('\nYou can now login with:')
  console.log('Email: crashdi@example.com')
  console.log('Password: trilogy26')
}

createUser()

