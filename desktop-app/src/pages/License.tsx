import { useState } from 'react';
import { MessageSquare, Key, ShieldCheck } from 'lucide-react';

export default function License({ onVerify }: { onVerify: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await window.smartsender.license.activate(key);
      if (res.valid) {
        onVerify(key);
      } else {
        setError(res.error || 'Invalid license key');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not reach the licensing service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-green-500/30">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Smart Sender</h1>
          <p className="text-zinc-500 mt-2">Activate your license to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">License Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Key size={18} />
              </div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all dark:text-white placeholder-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={20} />
                Verify License
              </>
            )}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have a license?{' '}
            <a href="#" className="text-green-500 hover:text-green-600 font-medium">
              Purchase one
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
