import { useEffect, useState } from 'react';
import { Bot, Plus, Trash2, Save, CheckCircle2, Lock } from 'lucide-react';
import { useLicense } from '../context/LicenseContext';
import { Link } from 'react-router-dom';

interface Rule {
  id: string;
  keyword: string;
  matchType: 'exact' | 'contains';
  replyText: string;
}

export default function AutoResponder() {
  const { isLicensed } = useLicense();
  const [rules, setRules] = useState<Rule[]>([]);
  const [saved, setSaved] = useState(false);

  // Load persisted rules on mount so the user's saved configuration survives
  // an app restart. Rules saved before this fix appeared to "vanish" because
  // the main process kept them in memory only.
  useEffect(() => {
    let cancelled = false;
    window.smartsender.wa.getAutoResponder().then(saved => {
      if (cancelled) return;
      setRules(
        (saved ?? []).map(r => ({
          id: r.id ?? crypto.randomUUID(),
          keyword: r.keyword,
          matchType: r.matchType,
          replyText: r.replyText,
        }))
      );
    }).catch(err => console.error('Failed to load auto-responder rules', err));
    return () => { cancelled = true; };
  }, []);

  const addRule = () => {
    setRules([
      ...rules,
      { id: Date.now().toString(), keyword: '', matchType: 'exact', replyText: '' }
    ]);
    setSaved(false);
  };

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    setSaved(false);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setSaved(false);
  };

  const saveRules = async () => {
    await window.smartsender.wa.setAutoResponder(rules);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Bot className="text-green-500" />
              Auto Responder
            </h2>
            <p className="text-zinc-500 text-sm">
              Set up automated replies based on keywords. The bot will automatically reply to incoming messages that match these rules.
            </p>
          </div>
          
          {!isLicensed ? (
            <div className="flex flex-col items-end gap-2">
               <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-lg">
                  <Lock size={14} className="text-amber-600" />
                  <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Pro Only</span>
               </div>
               <Link to="/settings" className="text-[10px] text-amber-500 underline">Activate to Save</Link>
            </div>
          ) : (
            <button
              onClick={saveRules}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
            >
              {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {saved ? 'Saved!' : 'Save Rules'}
            </button>
          )}
        </div>

        <div className="space-y-4 mb-6">
          {rules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
              No rules set up yet. Click below to add your first rule.
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div key={rule.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-400">Rule #{idx + 1}</span>
                  <button onClick={() => removeRule(rule.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Match Type</label>
                    <select
                      value={rule.matchType}
                      onChange={(e) => updateRule(rule.id, 'matchType', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      <option value="exact">Exact Match</option>
                      <option value="contains">Contains Keyword</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Keyword / Phrase</label>
                    <input
                      type="text"
                      value={rule.keyword}
                      onChange={(e) => updateRule(rule.id, 'keyword', e.target.value)}
                      placeholder="e.g. price, hello, help"
                      className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Reply Message</label>
                  <textarea
                    value={rule.replyText}
                    onChange={(e) => updateRule(rule.id, 'replyText', e.target.value)}
                    placeholder="Type the automated reply here..."
                    className="w-full h-24 p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={addRule}
          className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-xl text-zinc-500 hover:text-green-600 dark:hover:text-green-400 font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add New Rule
        </button>
      </div>
    </div>
  );
}
