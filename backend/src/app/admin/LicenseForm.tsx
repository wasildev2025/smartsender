'use client'

import { useState } from 'react'
import { Plus, Copy, Check } from 'lucide-react'
import { createLicense } from './actions'

export default function LicenseForm() {
  const [key, setKey] = useState('')
  const [days, setDays] = useState(365)
  const [copied, setCopied] = useState(false)

  const generateRandomKey = (prefix = 'VIP') => {
    const randomChars = () => Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${randomChars()}-${randomChars()}`
  }

  const applyPreset = (d: number, prefix = 'VIP') => {
    setDays(d)
    setKey(generateRandomKey(prefix))
  }

  const handleCopy = () => {
    if (!key) return
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 border-b border-zinc-800">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-xl font-bold">New License / Management</h2>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => applyPreset(3, 'TRIAL')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Trial (3 Days)
            </button>
            <button 
              onClick={() => applyPreset(7, 'TRIAL')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Trial (7 Days)
            </button>
            <button 
              onClick={() => applyPreset(365, 'VIP')}
              className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Pro (1 Year)
            </button>
          </div>
        </div>

        <form action={createLicense} className="flex flex-wrap items-center gap-4">
          <div className="relative flex items-center">
            <input
              name="key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Custom Key (Optional)"
              className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none w-64 placeholder:text-zinc-700 pr-10"
            />
            {key && (
              <button 
                type="button"
                onClick={handleCopy}
                className="absolute right-3 text-zinc-500 hover:text-white transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              name="days"
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              placeholder="365"
              className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-green-500 outline-none w-20 text-center placeholder:text-zinc-700"
            />
            <span className="text-xs text-zinc-600 font-bold uppercase tracking-tighter">Days</span>
          </div>

          <button 
            type="submit"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-black px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20"
          >
            <Plus size={16} strokeWidth={3} />
            Create License
          </button>
        </form>
      </div>
    </div>
  )
}
