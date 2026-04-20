import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Key, Users, Clock, ShieldCheck, LogOut, Trash2, Ban } from 'lucide-react'
import { signOut, createLicense, deleteLicense, updateLicenseStatus } from './actions'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch licenses
  const { data: licenses, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })

  const stats = {
    total: licenses?.length || 0,
    active: licenses?.filter(l => l.status === 'active').length || 0,
    expired: licenses?.filter(l => l.status === 'expired').length || 0,
    revoked: licenses?.filter(l => l.status === 'revoked').length || 0,
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {/* Navbar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">Managing Smart Sender Ecosystem</p>
        </div>
        <form action={signOut}>
          <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium border border-zinc-800 px-4 py-2 rounded-xl">
            <LogOut size={16} />
            Sign Out
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Licenses" value={stats.total} icon={<Key className="text-blue-500" />} />
        <StatCard title="Active" value={stats.active} icon={<ShieldCheck className="text-green-500" />} />
        <StatCard title="Expired" value={stats.expired} icon={<Clock className="text-yellow-500" />} />
        <StatCard title="Revoked" value={stats.revoked} icon={<Ban className="text-red-500" />} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-xl font-bold">New License / Management</h2>
            
            <form action={createLicense} className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <input
                  name="key"
                  type="text"
                  placeholder="Custom Key (Optional)"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none w-48 placeholder:text-zinc-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  name="days"
                  type="number"
                  placeholder="365"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none w-20 text-center placeholder:text-zinc-700"
                />
                <span className="text-xs text-zinc-600 font-bold uppercase tracking-tighter">Days</span>
              </div>
              <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-black px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20">
                <Plus size={16} strokeWidth={3} />
                Create License
              </button>
            </form>
          </div>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">License Key</th>
                <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Machine ID</th>
                <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Expires At</th>
                <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {licenses?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-zinc-600 italic">No licenses generated yet.</td>
                </tr>
              )}
              {licenses?.map((license) => (
                <tr key={license.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-8 py-5 font-mono text-sm tracking-tight">{license.key}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${license.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      license.status === 'expired' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {license.machine_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500" title={license.machine_id}>
                          {license.machine_id.substring(0, 8)}...
                        </span>
                        <form action={async () => { 
                          'use server'; 
                          const { resetMachineId } = await import('./actions');
                          await resetMachineId(license.id); 
                        }}>
                          <button className="text-zinc-600 hover:text-yellow-500 transition-colors" title="Reset Hardware ID">
                            <Clock size={14} />
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-700 italic">Unbound</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-sm text-zinc-400">
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Lifetime'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-4">
                      {license.status === 'active' ? (
                        <form action={async () => { 'use server'; await updateLicenseStatus(license.id, 'revoked'); }}>
                          <button className="text-zinc-500 hover:text-red-500 transition-colors" title="Revoke License">
                            <Ban size={18} />
                          </button>
                        </form>
                      ) : (
                        <form action={async () => { 'use server'; await updateLicenseStatus(license.id, 'active'); }}>
                          <button className="text-zinc-500 hover:text-green-500 transition-colors" title="Activate License">
                            <ShieldCheck size={18} />
                          </button>
                        </form>
                      )}
                      <form action={async () => { 'use server'; await deleteLicense(license.id); }}>
                        <button className="text-zinc-500 hover:text-red-500 transition-colors" title="Delete License">
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
