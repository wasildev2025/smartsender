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
  
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await window.ipcRenderer.invoke('wa-get-chats');
      setChats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chats. Make sure WhatsApp is connected.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtractGroupMembers = async () => {
    if (!selectedGroupId) {
      setError('Please select a group first.');
      return;
    }

    setExtracting(true);
    setError('');
    
    try {
      const members = await window.ipcRenderer.invoke('wa-get-group-members', selectedGroupId);
      
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
        `"${c.name}"`, // Quote to handle commas in names
        c.isGroup ? 'Yes' : 'No',
        c.unreadCount.toString(),
        c.id
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block font-medium">Extraction Error</strong>
                {error}
              </div>
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
