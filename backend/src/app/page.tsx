import { Activity, ShieldCheck, Cpu, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 opacity-80">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono tracking-widest uppercase">System Core Online</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
          Smart Sender <br />
          <span className="text-zinc-500">Cloud API.</span>
        </h1>

        <p className="max-w-xl text-zinc-400 text-lg md:text-xl leading-relaxed mb-12">
          The central nervous system for Smart Sender. Providing secure licensing,
          intelligent AI routing, and campaign synchronization.
        </p>

        {/* Action / Docs */}
        <div className="flex flex-wrap gap-4 mb-24">
          <div className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors cursor-default">
            v1.0.4 - Production
          </div>
          <a
            href="https://github.com/wasildev2025/smartsender"
            target="_blank"
            className="px-6 py-3 border border-zinc-800 rounded-full font-medium hover:bg-zinc-900 transition-colors"
          >
            Documentation
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            icon={<ShieldCheck size={20} className="text-green-500" />}
            title="Licensing"
            status="Active"
            desc="Supabase-backed key validation"
          />
          <StatusCard
            icon={<Cpu size={20} className="text-blue-500" />}
            title="AI Gateway"
            status="Ready"
            desc="Gemini Pro 1.5 Integration"
          />
          <StatusCard
            icon={<Zap size={20} className="text-yellow-500" />}
            title="Performance"
            status="Low Latency"
            desc="Optimized Next.js 16 Edge"
          />
          <StatusCard
            icon={<Activity size={20} className="text-zinc-500" />}
            title="Uptime"
            status="99.9%"
            desc="Monitored via Cloud Health"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-10 left-0 w-full px-10 flex justify-between items-center text-zinc-600 text-xs">
        <div>© 2026 WASILDEV. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-6">
          <span className="hover:text-zinc-400 cursor-pointer">PRIVACY</span>
          <span className="hover:text-zinc-400 cursor-pointer">TERMS</span>
        </div>
      </footer>
    </div>
  );
}

function StatusCard({ icon, title, status, desc }: { icon: React.ReactNode, title: string, status: string, desc: string }) {
  return (
    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-sm group hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 rounded-full tracking-wider uppercase">{status}</span>
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 leading-normal">{desc}</p>
    </div>
  );
}

