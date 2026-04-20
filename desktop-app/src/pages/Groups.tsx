import { useState, useEffect } from 'react';
import { Link, UserPlus, RefreshCw, Play } from 'lucide-react';

export default function Groups() {
  const [activeTab, setActiveTab] = useState<'join' | 'add'>('join');
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Join State
  const [inviteLinks, setInviteLinks] = useState('');
  const [joinRunning, setJoinRunning] = useState(false);
  const [joinLogs, setJoinLogs] = useState<{msg: string, isError: boolean}[]>([]);

  // Add State
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [participantNumbers, setParticipantNumbers] = useState('');
  const [addRunning, setAddRunning] = useState(false);
  const [addLogs, setAddLogs] = useState<{msg: string, isError: boolean}[]>([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke('wa-get-chats');
      setChats(data.filter((c: any) => c.isGroup));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAutoJoin = async () => {
    const links = inviteLinks.split('\\n').map(l => l.trim()).filter(l => l);
    if (links.length === 0) return;

    setJoinRunning(true);
    setJoinLogs([]);

    for (const link of links) {
      setJoinLogs(prev => [...prev, { msg: `Attempting to join: ${link}`, isError: false }]);
      
      try {
        const res = await window.ipcRenderer.invoke('wa-join-group', link);
        if (res.success) {
          setJoinLogs(prev => [...prev, { msg: `Successfully joined group!`, isError: false }]);
        } else {
          setJoinLogs(prev => [...prev, { msg: `Failed: ${res.error}`, isError: true }]);
        }
      } catch (err: any) {
        setJoinLogs(prev => [...prev, { msg: `Error: ${err.message}`, isError: true }]);
      }

      await sleep(2000); // Small delay between joins
    }

    setJoinRunning(false);
    setJoinLogs(prev => [...prev, { msg: 'Finished joining process.', isError: false }]);
  };

  const handleAddParticipants = async () => {
    const numbers = participantNumbers.split('\\n').map(n => n.trim()).filter(n => n);
    if (!selectedGroupId || numbers.length === 0) return;

    setAddRunning(true);
    setAddLogs([{ msg: `Adding ${numbers.length} participants...`, isError: false }]);

    try {
      const res = await window.ipcRenderer.invoke('wa-add-participants', selectedGroupId, numbers);
      if (res.success) {
        setAddLogs(prev => [...prev, { msg: `Successfully added participants!`, isError: false }]);
      } else {
        setAddLogs(prev => [...prev, { msg: `Failed: ${res.error}`, isError: true }]);
      }
    } catch (err: any) {
      setAddLogs(prev => [...prev, { msg: `Error: ${err.message}`, isError: true }]);
    }

    setAddRunning(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'join' 
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Link size={18} />
            Auto-Join Groups
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'add' 
                ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
            }`}
          >
            <UserPlus size={18} />
            Add to Group
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'join' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Auto-Join via Invite Links</h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Paste WhatsApp group invite links (one per line) to automatically join them.
                </p>
                <textarea
                  value={inviteLinks}
                  onChange={e => setInviteLinks(e.target.value)}
                  disabled={joinRunning}
                  className="w-full h-40 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                  placeholder="https://chat.whatsapp.com/ABC123XYZ\nhttps://chat.whatsapp.com/DEF456UVW"
                />
              </div>

              <button
                onClick={handleAutoJoin}
                disabled={joinRunning || !inviteLinks.trim()}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {joinRunning ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                {joinRunning ? 'Joining...' : 'Start Auto-Join'}
              </button>

              {joinLogs.length > 0 && (
                <div className="mt-6 bg-zinc-950 text-zinc-300 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-40 border border-zinc-800 space-y-1">
                  {joinLogs.map((log, i) => (
                    <div key={i} className={log.isError ? 'text-red-400' : 'text-green-400'}>
                      &gt; {log.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Add Participants to Group</h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Select a group you are an admin of, and add phone numbers (one per line). Note: WhatsApp may restrict adding too many users at once.
                </p>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-zinc-500 text-sm flex items-center gap-2">
                      <RefreshCw className="animate-spin" size={16} /> Loading groups...
                    </div>
                  ) : (
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      disabled={addRunning}
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select a Group --</option>
                      {chats.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  )}

                  <textarea
                    value={participantNumbers}
                    onChange={e => setParticipantNumbers(e.target.value)}
                    disabled={addRunning}
                    className="w-full h-40 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                    placeholder="1234567890\n9876543210"
                  />
                </div>
              </div>

              <button
                onClick={handleAddParticipants}
                disabled={addRunning || !selectedGroupId || !participantNumbers.trim()}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {addRunning ? <RefreshCw className="animate-spin" size={18} /> : <UserPlus size={18} />}
                {addRunning ? 'Adding Participants...' : 'Add to Group'}
              </button>

              {addLogs.length > 0 && (
                <div className="mt-6 bg-zinc-950 text-zinc-300 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-40 border border-zinc-800 space-y-1">
                  {addLogs.map((log, i) => (
                    <div key={i} className={log.isError ? 'text-red-400' : 'text-green-400'}>
                      &gt; {log.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
