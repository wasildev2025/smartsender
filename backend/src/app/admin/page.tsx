import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Key, Users, Clock, ShieldCheck, LogOut, Trash2, Ban, RefreshCcw, Copy } from 'lucide-react'
import { signOut, deleteLicense, updateLicenseStatus, resetMachineIdAction } from './actions'
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

  // Fetch licenses using Admin Client to bypass RLS and see revoked/expired ones
  const { data: licenses, error } = await adminSupabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })

  const stats = {
    total: licenses?.length || 0,
    active: licenses?.filter(l => l.status === 'active').length || 0,
    expired: licenses?.filter(l => l.status === 'expired').length || 0,
    revoked: licenses?.filter(l => l.status === 'revoked').length || 0,
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
