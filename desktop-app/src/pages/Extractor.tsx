import { useState, useEffect } from 'react';
import { Download, Users, MessageSquare, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { Link } from 'react-router-dom';

export default function Extractor() {
  const { isLicensed } = useLicense();
  const [activeTab, setActiveTab] = useState<'groups' | 'chats'>('groups');
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waReady, setWaReady] = useState(false);
  const [waStatus, setWaStatus] = useState<string>('INITIALIZING');

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const tryFetch = async () => {
      const status = await window.smartsender.wa.getStatus();
      if (cancelled || !status) return;
      setWaStatus(status.status);
      if (status.status === 'READY') {
        setWaReady(true);
        fetchChats();
      }
    };
    tryFetch();

    const unsubscribe = window.smartsender.wa.onStatus(payload => {
      if (cancelled) return;
      setWaStatus(payload.status);
      if (payload.status === 'READY') {
        setWaReady(true);
        // Refetch chats whenever WA transitions into READY.
        fetchChats();
      } else if (payload.status === 'DISCONNECTED') {
        setWaReady(false);
        setChats([]);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await window.smartsender.wa.getChats();
      setChats(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load chats. Make sure WhatsApp is connected.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (filename: string, rows: string[][]) => {
    // Escape embedded quotes and wrap any cell that has a comma, quote, or
    // newline. Without this, names with "," or " produce a malformed CSV.
    const escape = (cell: string) => {
      const s = String(cell ?? '');
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = rows.map(r => r.map(escape).join(',')).join('\r\n');
    // Use a Blob URL — `data:` URIs silently truncate at OS-dependent sizes
    // and are not reliable for thousands of rows.
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExtractGroupMembers = async () => {
    if (!selectedGroupId) {
      setError('Please select a group first.');
      return;
    }

    setExtracting(true);
    setError('');
    
    try {
      const members = await window.smartsender.wa.getGroupMembers(selectedGroupId);
      
      const groupInfo = chats.find(c => c.id === selectedGroupId);
      const groupName = groupInfo ? groupInfo.name : 'group';

      // Prepare CSV Data
      const rows = [
        ["Number", "Is Admin", "ID"]
      ];

      members.forEach((m: any) => {
        rows.push([
          m.number,
          m.isAdmin ? 'Yes' : 'No',
          m.id
        ]);
      });

      exportCSV(`${groupName}_members.csv`, rows);
      
    } catch (err: any) {
      setError(err.message || 'Failed to extract group members.');
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractChats = () => {
    if (chats.length === 0) {
      setError('No chats available to extract.');
      return;
    }

    const rows = [
      ["Name", "Is Group", "Unread Count", "ID"]
    ];

    chats.forEach(c => {
      rows.push([
        c.name,                              // exportCSV() handles quoting
        c.isGroup ? 'Yes' : 'No',
        c.unreadCount.toString(),
        c.id,
      ]);
    });

    exportCSV('all_chats.csv', rows);
  };

  const groups = chats.filter(c => c.isGroup);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'groups' 
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Users size={18} />
            Group Extractor
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'chats' 
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
            }`}
          >
            <MessageSquare size={18} />
            Chat Extractor
          </button>
        </div>

        <div className="p-8">
          {!waReady && (waStatus === 'INITIALIZING' || waStatus === 'AUTHENTICATED') && (
            <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl flex flex-col items-center text-center gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <div>
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-1">WhatsApp engine warming up</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 max-w-md mx-auto">
                  Hang tight — we'll load your chats automatically once the engine is ready.
                </p>
              </div>
            </div>
          )}

          {!waReady && (waStatus === 'DISCONNECTED' || waStatus === 'QR_READY') && (
            <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">WhatsApp Not Connected</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                  Please go to the <strong>Accounts</strong> tab and scan the QR code to connect your WhatsApp account before using extraction tools.
                </p>
              </div>
              <Link
                to="/accounts"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20"
              >
                Connect WhatsApp Now
              </Link>
            </div>
          )}

          {waReady && error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {activeTab === 'groups' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Extract Group Members</h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Select a group from your active chats to extract all its participants and save them as a CSV file.
                </p>

                {loading ? (
                  <div className="flex items-center gap-2 text-zinc-500 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <RefreshCw className="animate-spin" size={18} />
                    Loading groups...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select a Group --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>

                    {!isLicensed && (
                       <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                         <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                           <Lock size={14} /> Group Extraction is a Pro Feature
                         </p>
                         <Link to="/settings" className="text-[10px] text-amber-600 underline font-bold mt-1 inline-block">
                           Activate License to Unlock CSV Export
                         </Link>
                       </div>
                    )}

                    <button
                      onClick={handleExtractGroupMembers}
                      disabled={!selectedGroupId || extracting || !isLicensed}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors w-full sm:w-auto justify-center"
                    >
                      {extracting ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                      {isLicensed ? 'Export to CSV' : 'License Required'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Extract All Chats</h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Export a list of all your active chats (both 1-on-1 and groups) to a CSV file.
                </p>

                {loading ? (
                  <div className="flex items-center gap-2 text-zinc-500 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <RefreshCw className="animate-spin" size={18} />
                    Loading chats...
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
                      {chats.length} Chats Found
                    </div>
                    {!isLicensed && (
                       <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex-1">
                         <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                           <Lock size={14} /> Chat Extraction is a Pro Feature
                         </p>
                         <Link to="/settings" className="text-[10px] text-amber-600 underline font-bold mt-1 inline-block">
                           Activate License to Unlock
                         </Link>
                       </div>
                    )}

                    <button
                      onClick={handleExtractChats}
                      disabled={chats.length === 0 || !isLicensed}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg font-medium transition-colors shrink-0"
                    >
                      <Download size={18} />
                      {isLicensed ? 'Export All to CSV' : 'License Required'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
