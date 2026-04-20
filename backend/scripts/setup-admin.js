const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log('\nUsage: node scripts/setup-admin.js <email> <password>')
    console.log('Example: node scripts/setup-admin.js admin@example.com mysecurepassword\n')
    process.exit(1)
  }

  console.log(`\nAttempting to create admin user: ${email}...`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    console.error('Error creating user:', error.message)
    process.exit(1)
  }

  console.log('--------------------------------------------------')
  console.log('SUCCESS: Admin user created successfully!')
  console.log(`Email: ${email}`)
  console.log('You can now log in at http://localhost:3000/admin')
  console.log('--------------------------------------------------\n')
}

setupAdmin()
