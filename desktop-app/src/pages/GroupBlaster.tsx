import { useState, useRef } from 'react';
import { Users, Play, Square, MessageSquare, AlertTriangle, Trash2, LogOut, Loader2, Lock } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function GroupBlaster() {
  const { isLicensed } = useLicense();
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('Welcome to our community, {Name}!');
  const [participantNumbers, setParticipantNumbers] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  // Settings
  const [delayAfterCreate, setDelayAfterCreate] = useState(5);
  const [delayBetweenAdds, setDelayBetweenAdds] = useState(3);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [leaveAfterBlast, setLeaveAfterBlast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    };
    setLogs(prev => [entry, ...prev].slice(0, 100));
  };

  const sleep = (s: number) => new Promise(r => setTimeout(r, s * 1000));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const numbers = results.data.map((row: any) => row[0]).join('\n');
        setParticipantNumbers(numbers);
        addLog(`Imported ${results.data.length} numbers from CSV.`, 'success');
      }
    });
  };

  const startAutomation = async () => {
    const numbers = participantNumbers.split('\n').map(n => n.trim()).filter(n => n);
    if (numbers.length === 0) {
      addLog('Please add at least one participant number.', 'error');
      return;
    }
    if (!groupName.trim()) {
      addLog('Please enter a shared group name.', 'error');
      return;
    }

    setIsRunning(true);
    runningRef.current = true;
    setLogs([]);
    setTotal(numbers.length);
    setProgress(0);

    addLog(`🚀 Starting Group Blaster for "${groupName}"...`, 'info');

    try {
      // Step 1: Create Group with first few participants (WhatsApp requires at least 1)
      addLog('Phase 1: Creating new WhatsApp group...', 'info');
      const initialBatch = numbers.slice(0, 3);
      const createRes = await window.smartsender.wa.createGroup(groupName, initialBatch);
      
      if (!createRes.success) {
        throw new Error(`Failed to create group: ${createRes.error}`);
      }

      const groupId = createRes.gid;
      addLog(`Group created successfully (ID: ${groupId})`, 'success');
      
      addLog(`Waiting ${delayAfterCreate}s for group initialization...`, 'info');
      await sleep(delayAfterCreate);

      // Step 2: Add remaining participants in batches
      const remaining = numbers.slice(3);
      if (remaining.length > 0) {
        addLog(`Phase 2: Adding remaining ${remaining.length} participants...`, 'info');
        
        // Split into batches of 5 to avoid quick bans
        for (let i = 0; i < remaining.length; i += 5) {
          if (!runningRef.current) break;
          
          const batch = remaining.slice(i, i + 5);
          addLog(`Adding batch of ${batch.length} numbers...`);
          
          const addRes = await window.smartsender.wa.addParticipants(groupId, batch);
          if (addRes.success) {
            setProgress(prev => Math.min(prev + batch.length + 3, numbers.length));
          } else {
            addLog(`Warning: Some numbers in batch failed to add: ${addRes.error}`, 'warning');
          }
          
          await sleep(delayBetweenAdds);
        }
      }

      if (!runningRef.current) return;

      // Step 3: Send Marketing Message
      addLog('Phase 3: Sending marketing message to group...', 'info');
      const sendRes = await window.smartsender.wa.sendMessage(groupId, message);
      if (sendRes.success) {
        addLog('Message delivered successfully to the group!', 'success');
      } else {
        addLog(`Error sending group message: ${sendRes.error}`, 'error');
      }

      // Step 4: Cleanup
      if (autoCleanup && runningRef.current) {
        addLog('Phase 4: Auto-Cleanup (Removing participants)...', 'info');
        await sleep(3);
        const cleanupRes = await window.smartsender.wa.removeParticipants(groupId, numbers);
        if (cleanupRes.success) {
          addLog('All participants removed from group.', 'success');
        } else {
          addLog(`Cleanup error: ${cleanupRes.error}`, 'warning');
        }
      }

      if (leaveAfterBlast && runningRef.current) {
        addLog('Final Phase: Leaving and deleting group...', 'info');
        await sleep(2);
        await window.smartsender.wa.leaveGroup(groupId);
        addLog('Smart Sender has left the group.', 'info');
      }

      addLog('✅ Group Blaster automation finished!', 'success');

    } catch (err: any) {
      addLog(err.message, 'error');
    } finally {
      setIsRunning(false);
      runningRef.current = false;
    }
  };

  const stopAutomation = () => {
    runningRef.current = false;
    setIsRunning(false);
    addLog('Automation stopped by user.', 'warning');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4 overflow-y-auto">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <MessageSquare className="text-green-500" size={20} />
            Campaign Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Group Name</label>
              <input 
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Exclusive Weekend Sale"
                disabled={isRunning}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Marketing Message</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your group message here..."
                disabled={isRunning}
                className="w-full h-32 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="text-blue-500" size={20} />
              Target Participants
            </h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Import CSV
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
          </div>
          
          <textarea 
            value={participantNumbers}
            onChange={e => setParticipantNumbers(e.target.value)}
            placeholder="Enter numbers (one per line, with country code)..."
            disabled={isRunning}
            className="w-full h-48 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
          />
          <p className="text-[10px] text-zinc-500 mt-2 italic flex items-center gap-1">
            <AlertTriangle size={10} /> Adding members to groups can lead to temporary bans if done too fast.
          </p>
        </div>
      </div>

      {/* Right Column: Execution & Logs */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Automation Logic</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Auto-Remove Members</label>
              <input 
                type="checkbox" 
                checked={autoCleanup} 
                onChange={e => setAutoCleanup(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Leave Group After Send</label>
              <input 
                type="checkbox" 
                checked={leaveAfterBlast} 
                onChange={e => setLeaveAfterBlast(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
               <label className="text-[10px] text-zinc-500 uppercase font-bold">Safety Delays (Seconds)</label>
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <span className="text-[10px]">After Create</span>
                    <input type="number" value={delayAfterCreate} onChange={e => setDelayAfterCreate(Number(e.target.value))} className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs outline-none" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px]">Between Adds</span>
                    <input type="number" value={delayBetweenAdds} onChange={e => setDelayBetweenAdds(Number(e.target.value))} className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs outline-none" />
                  </div>
               </div>
            </div>

            <div className="pt-6 space-y-4">
              {!isLicensed && (
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                   <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                     <Lock size={14} /> Group Blaster is a Pro Feature
                   </p>
                   <Link to="/settings" className="text-[10px] text-amber-600 underline font-bold mt-1 inline-block">
                     Activate License to Unlock Automation
                   </Link>
                 </div>
              )}

              {!isRunning ? (
                <button 
                  onClick={startAutomation}
                  disabled={!isLicensed}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  {isLicensed ? 'Start Group Blaster' : 'License Required'}
                </button>
              ) : (
                <button 
                  onClick={stopAutomation}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <Square size={18} fill="currentColor" />
                  Stop Automation
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-semibold mb-4">Live Progress Log</h2>
          
          <div className="flex-1 bg-zinc-950 text-zinc-300 rounded-lg p-4 font-mono text-[10px] overflow-y-auto space-y-1.5 border border-zinc-800">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center py-8 italic">Ready to blast...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'success' ? 'text-green-400' : ''}
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'warning' ? 'text-yellow-400' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
