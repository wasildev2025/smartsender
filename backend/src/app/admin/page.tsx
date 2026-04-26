import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Key, Clock, ShieldCheck, LogOut, Ban, RefreshCcw } from 'lucide-react'
import { signOut } from './actions'
import LicenseForm from './LicenseForm'
import LicenseTable from './LicenseTable'
import { revalidatePath } from 'next/cache'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch licenses using Admin Client to bypass RLS and see revoked/expired ones.
  const { data: licenseRows } = await adminSupabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })

  // Pull active device bindings in one round trip and stitch them onto each
  // license so the table can show a hwid even on fresh DBs (where the legacy
  // licenses.machine_id column doesn't exist).
  const licenseIds = (licenseRows ?? []).map(l => l.id)
  const { data: activeDevices } = licenseIds.length
    ? await adminSupabase
        .from('license_devices')
        .select('id, license_id, hwid, last_seen')
        .in('license_id', licenseIds)
        .is('revoked_at', null)
    : { data: [] as any[] }

  const devicesByLicense = new Map<string, { id: string; hwid: string; last_seen: string }[]>()
  for (const d of activeDevices ?? []) {
    const arr = devicesByLicense.get(d.license_id) ?? []
    arr.push({ id: d.id, hwid: d.hwid, last_seen: d.last_seen })
    devicesByLicense.set(d.license_id, arr)
  }

  const licenses = (licenseRows ?? []).map(l => {
    const devices = devicesByLicense.get(l.id) ?? []
    return {
      ...l,
      // Surface the first active device for the existing UI; full list also
      // available for richer admin views down the road.
      machine_id: devices[0]?.hwid ?? l.machine_id ?? null,
      active_devices: devices,
    }
  })

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
  }

  const handleRefresh = async () => {
    'use server'
    revalidatePath('/admin')
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {/* Navbar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">Managing Smart Sender Ecosystem</p>
        </div>
        <div className="flex items-center gap-4">
          <form action={handleRefresh}>
            <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium border border-zinc-800 px-4 py-2 rounded-xl">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </form>
          <form action={signOut}>
            <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium border border-zinc-800 px-4 py-2 rounded-xl">
              <LogOut size={16} />
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Licenses" value={stats.total} icon={<Key className="text-blue-500" />} />
        <StatCard title="Active" value={stats.active} icon={<ShieldCheck className="text-green-500" />} />
        <StatCard title="Expired" value={stats.expired} icon={<Clock className="text-yellow-500" />} />
        <StatCard title="Revoked" value={stats.revoked} icon={<Ban className="text-red-500" />} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <LicenseForm />
        <LicenseTable initialLicenses={licenses || []} />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
          {icon}
        </div>
        <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-4xl font-bold tracking-tighter">
        {value}
      </div>
    </div>
  )
}
