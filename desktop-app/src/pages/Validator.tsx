import { useState } from 'react';
import { ShieldCheck, Play, Download, RefreshCw } from 'lucide-react';

interface ValidationResult {
  number: string;
  isWhatsApp: boolean;
}

export default function Validator() {
  const [numbersRaw, setNumbersRaw] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const startValidation = async () => {
    const lines = numbersRaw.split('\\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;

    setTotal(lines.length);
    setProgress(0);
    setResults([]);
    setRunning(true);

    for (let i = 0; i < lines.length; i++) {
      const number = lines[i];
      try {
        const res = await window.ipcRenderer.invoke('wa-check-number', number);
        setResults(prev => [...prev, { number, isWhatsApp: res.isRegistered }]);
      } catch (err) {
        setResults(prev => [...prev, { number, isWhatsApp: false }]);
      }
      setProgress(i + 1);
      await sleep(300); // Prevent spamming the IPC/WhatsApp engine too fast
    }

    setRunning(false);
  };

  const exportValid = () => {
    const valid = results.filter(r => r.isWhatsApp).map(r => r.number);
    if (valid.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8," + valid.join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "valid_whatsapp_numbers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCount = results.filter(r => r.isWhatsApp).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <ShieldCheck className="text-green-500" />
          Number Validator
        </h2>
        <p className="text-zinc-500 text-sm mb-8">
          Filter out invalid numbers before running campaigns to reduce bounce rates and avoid bans.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input side */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">Numbers to Check (One per line)</label>
            <textarea
              value={numbersRaw}
              onChange={e => setNumbersRaw(e.target.value)}
              disabled={running}
              className="w-full h-64 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
              placeholder="+1234567890\n9876543210"
            />
            <button
              onClick={startValidation}
              disabled={running || !numbersRaw.trim()}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {running ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
              {running ? 'Validating...' : 'Start Validator'}
            </button>
          </div>

          {/* Results side */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-medium mb-4">Results</label>
            
            {total > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress} / {total}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${(progress / total) * 100}%` }}
                  />
                </div>
                {progress === total && (
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Found {validCount} valid WhatsApp numbers!
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 overflow-y-auto max-h-64 mb-4">
              {results.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center mt-8">No results yet.</div>
              ) : (
                <div className="space-y-1 text-sm font-mono">
                  {results.map((r, i) => (
                    <div key={i} className={`flex justify-between ${r.isWhatsApp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span>{r.number}</span>
                      <span>{r.isWhatsApp ? 'VALID' : 'INVALID'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={exportValid}
              disabled={running || validCount === 0}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors mt-auto"
            >
              <Download size={18} />
              Export Valid Numbers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
