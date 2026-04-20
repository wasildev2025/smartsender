import { Settings as SettingsIcon, LogOut, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const handleLogout = () => {
    localStorage.removeItem('smartsender_license');
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
          <SettingsIcon className="text-green-500" />
          Settings
        </h2>

        <div className="space-y-8">
          {/* License Info */}
          <div>
            <h3 className="text-lg font-medium mb-4">License Information</h3>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium">Active Subscription</p>
                <p className="text-sm text-zinc-500">Your license is valid and active.</p>
              </div>
              <div className="flex items-center gap-2 text-green-500 font-medium">
                <CheckCircle2 size={18} /> Valid
              </div>
            </div>
          </div>

          {/* Preferences (Placeholders for future) */}
          <div>
            <h3 className="text-lg font-medium mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-500 rounded border-zinc-300 focus:ring-green-500" />
                <span className="text-sm">Enable desktop notifications for finished tasks</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-green-500 rounded border-zinc-300 focus:ring-green-500" />
                <span className="text-sm">Start minimized to system tray</span>
              </label>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium text-red-500 mb-4">Danger Zone</h3>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Revoke License & Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
