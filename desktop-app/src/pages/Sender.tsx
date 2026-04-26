import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Settings, Users, Upload, Tag, Trash2, MessageCircle, Lock } from 'lucide-react';
import { useLicense } from '../context/licenseShared';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface ContactData {
  [key: string]: string;
}

export default function Sender() {
  const { isLicensed } = useLicense();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [numberColumn, setNumberColumn] = useState<string>('');
  const [contactsRaw, setContactsRaw] = useState('');
  const [message, setMessage] = useState('Hello {Name}, this is a test message!');

  // Delay Settings (in seconds)
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);

  // Campaign Settings
  const [campaignName, setCampaignName] = useState('');
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('Would you like to learn more?');
  const [pollOptions, setPollOptions] = useState(['Yes!', 'Maybe later']);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const executionState = useRef({ running: false, paused: false });

  useEffect(() => {
    executionState.current = { running: isRunning, paused: isPaused };
  }, [isRunning, isPaused]);

  // Sync contactsRaw with structured contacts if manually edited
  useEffect(() => {
    if (!isRunning && !headers.length) {
      const lines = contactsRaw.split('\n').filter(l => l.trim());
      const newContacts = lines.map(line => {
        const parts = line.split(/[,|\t]/); // Split by comma, pipe, or tab
        const number = parts[0]?.trim() || '';
        const name = parts[1]?.trim() || '';
        return {
          Number: number,
          Name: name || 'Friend'
        };
      });
      setContacts(newContacts);
    }
  }, [contactsRaw, isRunning, headers.length]);

  const addLog = (type: 'info' | 'success' | 'error', msg: string) => {
    setLogs(prev => [{ id: Math.random().toString(), timestamp: new Date(), type, message: msg }, ...prev].slice(0, 100));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields || [];
        setHeaders(parsedHeaders);
        setContacts(results.data as ContactData[]);

        // Try to guess the number column
        const numCol = parsedHeaders.find(h =>
          h.toLowerCase().includes('number') ||
          h.toLowerCase().includes('phone') ||
          h.toLowerCase().includes('mobile')
        ) || parsedHeaders[0];

        setNumberColumn(numCol);
        setTotal(results.data.length);
        addLog('info', `Imported ${results.data.length} contacts from CSV.`);
      },
      error: (error) => {
        addLog('error', `CSV Parse Error: ${error.message}`);
      }
    });
  };

  const startCampaign = async () => {
    if (contacts.length === 0) {
      addLog('error', 'No contacts found. Please add contacts or upload a CSV.');
      return;
    }
    if (!message.trim()) {
      addLog('error', 'Message cannot be empty.');
      return;
    }

    setTotal(contacts.length);
    setProgress(0);
    setIsRunning(true);
    setIsPaused(false);
    executionState.current = { running: true, paused: false };
    setLogs([]);
    addLog('info', `Starting campaign with ${contacts.length} contacts...`);

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      while (executionState.current.paused && executionState.current.running) {
        await sleep(500);
      }

      if (!executionState.current.running) {
        addLog('info', 'Campaign stopped.');
        break;
      }

      const contact = contacts[i];
      const number = contact[numberColumn || 'Number'] || Object.values(contact)[0];

      // Dynamic Variable Replacement
      let finalMessage = message;
      Object.entries(contact).forEach(([key, value]) => {
        // Escape key for use in regex
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`{${escapedKey}}`, 'gi');
        finalMessage = finalMessage.replace(regex, value || '');
      });

      addLog('info', `Sending to ${number}...`);

      try {
        let result;
        if (isPollMode) {
          result = await window.smartsender.wa.sendPoll(number, pollQuestion, pollOptions, false);
        } else {
          result = await window.smartsender.wa.sendMessage(number, finalMessage);
        }

        if (result.success) {
          sentCount += 1;
          addLog('success', `Sent successfully to ${result.number}`);
          await window.smartsender.db.incrementSent(1);
        } else {
          failedCount += 1;
          addLog('error', `Failed to send to ${number}: ${result.error}`);
        }
      } catch (err: any) {
        failedCount += 1;
        addLog('error', `Error sending to ${number}: ${err.message}`);
      }

      setProgress(i + 1);

      if (i < contacts.length - 1 && executionState.current.running) {
        const delaySec = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        addLog('info', `Waiting ${delaySec} seconds...`);
        for (let w = 0; w < delaySec * 10; w++) {
          if (!executionState.current.running) break;
          await sleep(100);
        }
      }
    }

    if (executionState.current.running) {
      const allFailed = sentCount === 0 && failedCount > 0;
      const someFailed = sentCount > 0 && failedCount > 0;

      if (allFailed) {
        addLog('error', `Campaign finished with errors. 0 sent, ${failedCount} failed.`);
      } else if (someFailed) {
        addLog('info', `Campaign finished. ${sentCount} sent, ${failedCount} failed.`);
      } else {
        addLog('success', `Campaign finished successfully! ${sentCount} sent.`);
      }

      setIsRunning(false);

      // Record campaign with the correct status based on actual outcomes.
      await window.smartsender.db.recordCampaign({
        id: crypto.randomUUID(),
        name: campaignName.trim() || `Campaign ${new Date().toLocaleDateString()}`,
        status: allFailed ? 'Failed' : 'Completed',
        sent: sentCount,
        total: contacts.length,
        date: new Date().toLocaleDateString()
      });
    }
  };

  const stopCampaign = async () => {
    setIsRunning(false);
    setIsPaused(false);
    executionState.current = { running: false, paused: false };

    // Record partial progress to database if we had any progress
    if (progress > 0) {
      await window.smartsender.db.recordCampaign({
        id: crypto.randomUUID(),
        name: (campaignName.trim() || `Campaign ${new Date().toLocaleDateString()}`) + ' (Stopped)',
        status: 'Failed',
        sent: progress,
        total: total,
        date: new Date().toLocaleDateString()
      });
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    executionState.current.paused = newPausedState;
  };

  const insertVariable = (variable: string) => {
    if (isRunning) return;
    setMessage(prev => prev + ` {${variable}}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-4 overflow-y-auto">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
        {/* Message Configuration */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="text-green-500" size={20} />
              Message Template
            </h2>
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setIsPollMode(false)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${!isPollMode ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
              >
                Standard
              </button>
              <button
                onClick={() => setIsPollMode(true)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${isPollMode ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
              >
                Interactive
              </button>
            </div>
          </div>

          {!isPollMode ? (
            <div className="space-y-4">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full h-32 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none text-sm"
                placeholder="Type your message here... Use tags like {Name}"
                disabled={isRunning}
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-zinc-500 w-full mb-1 flex items-center gap-1">
                  <Tag size={12} /> Click to insert tags:
                </span>
                {(headers.length > 0 ? headers : ['Number', 'Name']).map(header => (
                  <button
                    key={header}
                    onClick={() => insertVariable(header)}
                    disabled={isRunning}
                    className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition text-sm font-medium"
                  >
                    {`{${header}}`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Question (Poll Name)</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  disabled={isRunning}
                  placeholder="e.g. Would you like a free sample?"
                  className="w-full mt-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Options (Clickable Menus)</label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      disabled={isRunning}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded outline-none text-xs"
                    />
                    <button
                      onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                      disabled={isRunning}
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <button
                    onClick={() => setPollOptions(prev => [...prev, ''])}
                    disabled={isRunning}
                    className="text-xs text-green-600 hover:underline"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="text-blue-500" size={20} />
              Contacts List
            </h2>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRunning}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-sm font-medium"
              >
                <Upload size={16} />
                Import CSV
              </button>
            </div>
          </div>

          {headers.length > 0 && (
            <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between">
              <div className="text-sm">
                <span className="text-zinc-500">Phone Number Column: </span>
                <select
                  value={numberColumn}
                  onChange={(e) => setNumberColumn(e.target.value)}
                  className="bg-transparent font-semibold text-green-600 outline-none"
                  disabled={isRunning}
                >
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <button
                onClick={() => { setHeaders([]); setContacts([]); setContactsRaw(''); }}
                className="text-xs text-red-500 hover:underline"
                disabled={isRunning}
              >
                Clear All
              </button>
            </div>
          )}

          {headers.length === 0 ? (
            <textarea
              value={contactsRaw}
              onChange={e => setContactsRaw(e.target.value)}
              className="w-full flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none font-mono text-sm"
              placeholder={"1234567890, John Doe\n9876543210, Jane Smith"}
              disabled={isRunning}
            />
          ) : (
            <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-2 text-xs font-bold flex gap-4 uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                {headers.slice(0, 4).map(h => <div key={h} className="w-24 truncate">{h}</div>)}
                {headers.length > 4 && <div>...</div>}
              </div>
              <div className="max-h-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                {contacts.slice(0, 50).map((c, i) => (
                  <div key={i} className="p-2 text-xs flex gap-4 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                    {headers.slice(0, 4).map(h => <div key={h} className="w-24 truncate text-zinc-600 dark:text-zinc-400">{c[h]}</div>)}
                  </div>
                ))}
                {contacts.length > 50 && <div className="p-2 text-[10px] text-zinc-500 text-center italic">Showing first 50 contacts</div>}
              </div>
            </div>
          )}
          <p className="text-[10px] text-zinc-500 mt-2 italic">
            {headers.length === 0 ? 'Format: Number, Name (One per line)' : `Total: ${contacts.length} contacts loaded from CSV`}
          </p>
        </div>
      </div>

      {/* Right Column: Settings & Execution */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Anti-Ban Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Settings className="text-zinc-500" size={20} />
            Anti-Ban Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Wait between messages (sec)</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="number"
                  value={minDelay}
                  onChange={e => setMinDelay(Number(e.target.value))}
                  className="w-full p-2 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                  min={1}
                  disabled={isRunning}
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="number"
                  value={maxDelay}
                  onChange={e => setMaxDelay(Number(e.target.value))}
                  className="w-full p-2 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                  min={1}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Execution Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-semibold mb-4">Execution</h2>

          <div className="mb-4">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Campaign Name (Optional)</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Summer Sale 2026"
              disabled={isRunning}
              className="w-full mt-1.5 p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            />
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {!isLicensed && (
               <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl mb-4">
                 <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
                   <Lock size={14} /> Bulk Sending is a Pro Feature
                 </p>
                 <Link to="/settings" className="text-[10px] text-amber-600 underline font-bold mt-1 inline-block">
                   Activate License to Unlock
                 </Link>
               </div>
            )}

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  onClick={startCampaign}
                  disabled={contacts.length === 0 || !isLicensed}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  <Play size={18} />
                  {isLicensed ? 'Start Campaign' : 'License Required'}
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    <Pause size={18} fill="currentColor" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopCampaign}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    <Square size={18} fill="currentColor" />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          {total > 0 && (
            <div className="mt-6 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-zinc-500 font-mono">{progress} / {total}</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Realtime Logs */}
          <div className="flex-1 min-h-0 bg-zinc-950 text-zinc-300 rounded-xl p-4 font-mono text-[10px] overflow-y-auto border border-zinc-800">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center mt-4">Campaign status logs...</div>
            ) : (
              <div className="space-y-1.5">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0">[{log.timestamp.toLocaleTimeString([], { hour12: false })}]</span>
                    <span className={`
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'error' ? 'text-red-400' : ''}
                      ${log.type === 'info' ? 'text-blue-400 font-medium' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

