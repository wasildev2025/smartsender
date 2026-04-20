import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, FileText, Settings, Users } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error';
  message: string;
}

export default function Sender() {
  const [contactsRaw, setContactsRaw] = useState('');
  const [message, setMessage] = useState('Hello {Name}, this is a test message!');
  
  // Delay Settings (in seconds)
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  
  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // We use refs to keep track of mutable execution state safely within async loops
  const executionState = useRef({ running: false, paused: false });

  useEffect(() => {
    executionState.current = { running: isRunning, paused: isPaused };
  }, [isRunning, isPaused]);

  const addLog = (type: 'info' | 'success' | 'error', msg: string) => {
    setLogs(prev => [{ id: Math.random().toString(), timestamp: new Date(), type, message: msg }, ...prev].slice(0, 100));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startCampaign = async () => {
    const lines = contactsRaw.split('\\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) {
      addLog('error', 'No contacts found. Please add contacts.');
      return;
    }
    if (!message.trim()) {
      addLog('error', 'Message cannot be empty.');
      return;
    }

    setTotal(lines.length);
    setProgress(0);
    setIsRunning(true);
    setIsPaused(false);
    setLogs([]);
    addLog('info', `Starting campaign with ${lines.length} contacts...`);

    for (let i = 0; i < lines.length; i++) {
      // Check execution state every 500ms if paused
      while (executionState.current.paused && executionState.current.running) {
        await sleep(500);
      }

      if (!executionState.current.running) {
        addLog('info', 'Campaign stopped.');
        break;
      }

      const line = lines[i];
      // Basic parse: Number, Name
      const parts = line.split(',');
      const number = parts[0].trim();
      const name = parts[1] ? parts[1].trim() : 'Friend';

      // Parse dynamic variables
      const finalMessage = message.replace(/{Name}/gi, name);

      addLog('info', `Sending to ${number}...`);

      try {
        const result = await window.ipcRenderer.invoke('wa-send-message', number, finalMessage);
        if (result.success) {
          addLog('success', `Sent successfully to ${result.number}`);
        } else {
          addLog('error', `Failed to send to ${number}: ${result.error}`);
        }
      } catch (err: any) {
        addLog('error', `Error sending to ${number}: ${err.message}`);
      }

      setProgress(i + 1);

      // Delay logic
      if (i < lines.length - 1 && executionState.current.running) {
        const delaySec = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        addLog('info', `Waiting ${delaySec} seconds before next message to avoid ban...`);
        
        // Wait in small increments so we can interrupt if stopped
        for (let w = 0; w < delaySec * 10; w++) {
          if (!executionState.current.running) break;
          await sleep(100);
        }
      }
    }

    if (executionState.current.running) {
      addLog('success', 'Campaign finished successfully!');
      setIsRunning(false);
    }
  };

  const stopCampaign = () => {
    setIsRunning(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
        {/* Message Configuration */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileText className="text-zinc-500" size={20} />
            Message Template
          </h2>
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full h-32 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              placeholder="Type your message here... Use {Name} to replace with the contact's name."
              disabled={isRunning}
            />
            <div className="flex gap-2 text-sm text-zinc-500">
              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" onClick={() => !isRunning && setMessage(m => m + ' {Name}')}>
                {`{Name}`}
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-50" title="Coming soon">
                {`{Var1}`}
              </span>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="text-zinc-500" size={20} />
            Contacts List
          </h2>
          <p className="text-sm text-zinc-500 mb-2">Format: <code>Number, Name</code> (One per line)</p>
          <textarea
            value={contactsRaw}
            onChange={e => setContactsRaw(e.target.value)}
            className="w-full flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none font-mono text-sm"
            placeholder="1234567890, John Doe\n9876543210, Jane Smith"
            disabled={isRunning}
          />
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
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Wait between messages (seconds)</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="number"
                  value={minDelay}
                  onChange={e => setMinDelay(Number(e.target.value))}
                  className="w-20 p-2 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                  min={1}
                  disabled={isRunning}
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="number"
                  value={maxDelay}
                  onChange={e => setMaxDelay(Number(e.target.value))}
                  className="w-20 p-2 text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none"
                  min={1}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Execution Controls */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Execution</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {!isRunning ? (
              <button
                onClick={startCampaign}
                className="col-span-2 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors shadow-sm shadow-green-500/20"
              >
                <Play size={18} fill="currentColor" />
                Start Campaign
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  <Pause size={18} fill="currentColor" />
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={stopCampaign}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  <Square size={18} fill="currentColor" />
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Progress */}
          {total > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-zinc-500">{progress} / {total}</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300" 
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Realtime Logs */}
          <div className="flex-1 min-h-0 bg-zinc-950 text-zinc-300 rounded-lg p-4 font-mono text-xs overflow-y-auto border border-zinc-800">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center mt-4">Waiting to start...</div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={`
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'error' ? 'text-red-400' : ''}
                      ${log.type === 'info' ? 'text-blue-400' : ''}
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
