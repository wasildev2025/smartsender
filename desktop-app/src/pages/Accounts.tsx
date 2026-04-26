import { useEffect, useState } from 'react';
import { Smartphone, LogOut, RefreshCw, QrCode, ShieldCheck } from 'lucide-react';

interface WAStatus {
  status: 'INITIALIZING' | 'DISCONNECTED' | 'QR_READY' | 'AUTHENTICATED' | 'READY';
  qr?: string;
  info?: any;
  error?: string;
}

export default function Accounts() {
  const [waStatus, setWaStatus] = useState<WAStatus>({ status: 'DISCONNECTED' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.smartsender.wa.getStatus().then(status => {
      if (status) setWaStatus(status as WAStatus);
      setLoading(false);
    });

    const unsubscribe = window.smartsender.wa.onStatus(payload => {
      setWaStatus(prev => ({ ...prev, ...(payload as WAStatus) }));
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await window.smartsender.wa.logout();
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="text-green-500" />
              WhatsApp Accounts
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Manage your connected WhatsApp devices</p>
          </div>
          {waStatus.status === 'READY' && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400"
            >
              <LogOut size={16} />
              Logout Device
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <RefreshCw className="animate-spin text-green-500 mb-4" size={32} />
              <p className="text-zinc-500 font-medium">Connecting to WhatsApp Engine...</p>
            </div>
          ) : waStatus.status === 'QR_READY' && waStatus.qr ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-zinc-200">
                <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-zinc-500 max-w-sm">
                Open WhatsApp on your phone, tap Menu or Settings and select Linked Devices. Tap on Link a Device and point your phone to this screen.
              </p>
            </div>
          ) : waStatus.status === 'READY' || waStatus.status === 'AUTHENTICATED' ? (
            <div className="flex flex-col items-center text-center py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Device Connected</h3>
              <p className="text-zinc-500 mb-6">Your WhatsApp account is active and ready to send messages.</p>
              
              {waStatus.info && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-6 py-4 flex items-center gap-4 text-left shadow-sm">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Smartphone size={24} className="text-zinc-500" />
                  </div>
                  <div>
                    <div className="font-semibold">{waStatus.info.pushname || 'WhatsApp User'}</div>
                    <div className="text-sm text-zinc-500">+{waStatus.info.me?.user}</div>
                  </div>
                </div>
              )}
            </div>
          ) : waStatus.status === 'INITIALIZING' ? (
            <div className="flex flex-col items-center py-12">
              <RefreshCw className="animate-spin text-green-500 mb-4" size={32} />
              <h3 className="text-lg font-medium mb-2">Engine Starting</h3>
              <p className="text-zinc-500 text-center max-w-sm">
                Please wait while the WhatsApp engine initializes. This can take 30-60 seconds on the first run.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-4">
                <QrCode size={32} />
              </div>
              <h3 className="text-lg font-medium mb-2">Disconnected</h3>
              <p className="text-zinc-500 text-center max-w-sm">
                {waStatus.error || 'WhatsApp engine is not running. Restart the app to retry.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
