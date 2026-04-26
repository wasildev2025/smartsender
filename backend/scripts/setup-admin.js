const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Bootstrap script — meant to be run ONCE per environment.
//
// Refuses to run on a database that already has admin users or licenses,
// unless the operator passes --force. This prevents a leaked service-role
// key from being used to silently create rogue admins on a live deployment.

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
    persistSession: false,
  },
})

function parseArgs() {
  const args = process.argv.slice(2)
  const positional = []
  let force = false
  for (const a of args) {
    if (a === '--force') force = true
    else positional.push(a)
  }
  return { email: positional[0], password: positional[1], force }
}

async function isLiveEnvironment() {
  // Heuristics: any existing user or any existing license row means this isn't
  // a fresh DB. Either is enough to refuse without --force.
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (usersErr) {
    console.warn('Warning: could not enumerate users —', usersErr.message)
  } else if ((users?.users?.length ?? 0) > 0) {
    return { live: true, reason: `existing admin users (${users.users.length}+)` }
  }

  const { count, error: licErr } = await supabase
    .from('licenses')
    .select('id', { count: 'exact', head: true })
  if (licErr && licErr.code !== '42P01') {
    // 42P01 = relation does not exist → fresh schema, fine.
    console.warn('Warning: could not count licenses —', licErr.message)
  } else if ((count ?? 0) > 0) {
    return { live: true, reason: `existing licenses (${count})` }
  }

  return { live: false }
}

async function setupAdmin() {
  const { email, password, force } = parseArgs()

  if (!email || !password) {
    console.log('\nUsage: node scripts/setup-admin.js <email> <password> [--force]')
    console.log('Example: node scripts/setup-admin.js admin@example.com "$(openssl rand -base64 32)"\n')
    process.exit(1)
  }
  if (password.length < 12) {
    console.error('Refusing: password must be at least 12 characters.')
    process.exit(1)
  }

  const { live, reason } = await isLiveEnvironment()
  if (live && !force) {
    console.error('--------------------------------------------------')
    console.error('Refusing to run: this looks like a live environment.')
    console.error(`Reason: ${reason}`)
    console.error('Re-run with --force if you really intend to add another admin.')
    console.error('You should ALSO rotate SUPABASE_SERVICE_ROLE_KEY immediately')
    console.error('after any --force run.')
    console.error('--------------------------------------------------')
    process.exit(2)
  }

  console.log(`\nAttempting to create admin user: ${email}...`)

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    console.error('Error creating user:', error.message)
    process.exit(1)
  }

  console.log('--------------------------------------------------')
  console.log('SUCCESS: Admin user created.')
  console.log(`Email: ${email}`)
  console.log('Log in at /admin. After this bootstrap, ROTATE')
  console.log('SUPABASE_SERVICE_ROLE_KEY in your Supabase dashboard.')
  console.log('--------------------------------------------------\n')
}

setupAdmin()
