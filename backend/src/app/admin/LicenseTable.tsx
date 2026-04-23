'use client'

import { useState } from 'react'
import { Clock, Ban, ShieldCheck, Trash2, Copy, Check } from 'lucide-react'
import { updateLicenseStatus, deleteLicense, resetMachineIdAction } from './actions'

type License = {
  id: string
  key: string
  status: string
  machine_id: string | null
  expires_at: string | null
}

export default function LicenseTable({ initialLicenses }: { initialLicenses: License[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/50">
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">License Key</th>
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Plan</th>
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Status</th>
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Machine ID</th>
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest">Expires At</th>
            <th className="px-8 py-5 text-zinc-500 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {initialLicenses.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-12 text-center text-zinc-600 italic">No licenses generated yet.</td>
            </tr>
          )}
          {initialLicenses.map((license) => (
            <tr key={license.id} className="hover:bg-zinc-800/30 transition-colors group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tracking-tight">{license.key}</span>
                  <button 
                    onClick={() => handleCopy(license.key, license.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white"
                  >
                    {copiedId === license.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </td>
              <td className="px-8 py-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {license.key.startsWith('TRIAL') ? 'Trial' : 'Pro'}
                </span>
              </td>
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
                      {license.machine_id.substring(0, 12)}...
                    </span>
                    <form action={async (formData) => {
                      if(confirm('Reset Machine ID for this license?')) {
                        await resetMachineIdAction(license.id)
                      }
                    }}>
                      <button className="text-zinc-600 hover:text-yellow-500 transition-colors" title="Reset Hardware ID" type="submit">
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
                <div className="flex gap-4 justify-end">
                  {license.status === 'active' ? (
                    <form action={() => updateLicenseStatus(license.id, 'revoked')}>
                      <button className="text-zinc-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Revoke License" type="submit">
                        <Ban size={18} />
                      </button>
                    </form>
                  ) : (
                    <form action={() => updateLicenseStatus(license.id, 'active')}>
                      <button className="text-zinc-500 hover:text-green-500 transition-colors p-2 hover:bg-green-500/10 rounded-lg" title="Activate License" type="submit">
                        <ShieldCheck size={18} />
                      </button>
                    </form>
                  )}
                  <form action={async () => {
                    if(confirm('Delete this license permanently?')) {
                      await deleteLicense(license.id)
                    }
                  }}>
                    <button className="text-zinc-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg" title="Delete License" type="submit">
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
  )
}
