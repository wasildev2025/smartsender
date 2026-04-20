import { useState } from 'react';
import { Settings as SettingsIcon, LogOut, CheckCircle2, ShieldAlert, Key, Clock, ShieldX, MessageCircleOff } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';

export default function Settings() {
  const { isLicensed, expiresAt, licenseKey, verifyLicense, logoutLicense } = useLicense();
  const [newKey, setNewKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setIsActivating(true);
    setError('');
    setSuccess('');

    try {
      const valid = await verifyLicense(newKey);
      if (valid) {
        setSuccess('License activated successfully!');
        setNewKey('');
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed');
    } finally {
      setIsActivating(false);
    }
  };

  const handleWhatsAppLogout = async () => {
    if (confirm('Are you sure you want to log out of WhatsApp? You will need to scan the QR code again.')) {
      await (window as any).ipcRenderer.invoke('wa-logout');
      alert('Logged out successfully');
    }
  };

  const handleRevokeLicense = () => {
    if (confirm('DANGER: This will remove your license from this device. You will need to enter the key again to use premium features. Continue?')) {
      logoutLicense();
    }
  };

  const getTimeLeft = () => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    return `${days} days left`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
          <SettingsIcon className="text-green-500" />
          Settings & Account
        </h2>

        <div className="space-y-8">
          {/* License Status */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ShieldAlert size={20} className="text-blue-500" />
              License Information
            </h3>
            
            {isLicensed ? (
              <div className="space-y-4">
                <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-1">
                      <CheckCircle2 size={18} /> Licensed & Active
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      License Key: <span className="font-mono text-xs">{licenseKey?.substring(0, 4)}••••••••{licenseKey?.slice(-4)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Expiration</p>
                    <p className="flex items-center gap-1 text-sm font-semibold">
                      <Clock size={14} /> {getTimeLeft()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-4">
                  <ShieldX size={20} /> Trial Version (Restricted)
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  You are currently using the trial version. Real marketing actions like bulk sending and group extraction are disabled. Enter your license key to unlock all features.
                </p>
                
                <form onSubmit={handleActivate} className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="text"
                      value={newKey}
                      onChange={e => setNewKey(e.target.value)}
                      placeholder="Enter your license key (XXXX-XXXX-XXXX-XXXX)"
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <button 
                    disabled={isActivating || !newKey.trim()}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {isActivating ? 'Verifying...' : 'Activate Now'}
                  </button>
                </form>
                {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
                {success && <p className="mt-2 text-xs text-green-500 font-medium">{success}</p>}
              </div>
            )}
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium mb-4">Application Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-500 rounded border-zinc-300 focus:ring-green-500" />
                <div>
                  <span className="text-sm font-medium block">Desktop Notifications</span>
                  <span className="text-xs text-zinc-500">Alert me when a campaign completes or receives a message</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-green-500 rounded border-zinc-300 focus:ring-green-500" />
                <div>
                  <span className="text-sm font-medium block">Run in Background</span>
                  <span className="text-xs text-zinc-500">Minimize to system tray instead of closing</span>
                </div>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium text-red-500 mb-4">Danger Zone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                <p className="text-sm font-semibold">WhatsApp Session</p>
                <p className="text-xs text-zinc-500">Log out of the current WhatsApp Web session. You will need to scan the QR code again.</p>
                <button
                  onClick={handleWhatsAppLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium"
                >
                  <MessageCircleOff size={16} />
                  Logout WhatsApp
                </button>
              </div>

              <div className="p-4 border border-red-100 dark:border-red-900/20 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-red-500">Remove License</p>
                <p className="text-xs text-zinc-500">Unbind your license from this device. You will revert to Trial Mode immediately.</p>
                <button
                  onClick={handleRevokeLicense}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Revoke & Untie Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
