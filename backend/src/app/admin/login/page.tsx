import { login } from '../actions'
import { ShieldAlert } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const error = params.error as string | undefined;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Sender</h1>
          <p className="text-zinc-500">Admin Control Panel</p>
        </div>

        <form className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@smartsender.app"
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all placeholder:text-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all placeholder:text-zinc-700"
              />
            </div>

            <button
              formAction={login}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center mt-4"
            >
              Access Dashboard
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-600">
              Only authorized administrators can access this area.<br />
              All login attempts are logged for security.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
