import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Download, 
  Settings, 
  ShieldCheck,
  Smartphone,
  Bot,
  PieChart
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: PieChart },
  { name: 'Bulk Sender', href: '/sender', icon: MessageSquare },
  { name: 'Auto Responder', href: '/auto-responder', icon: Bot },
  { name: 'Extract & Scrape', href: '/extractor', icon: Download },
  { name: 'Group Automation', href: '/groups', icon: Users },
  { name: 'Number Validator', href: '/validator', icon: ShieldCheck },
  { name: 'Accounts', href: '/accounts', icon: Smartphone },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [waStatus, setWaStatus] = useState<{ status: string, number: string | null }>({
    status: 'DISCONNECTED',
    number: null
  });

  useEffect(() => {
    // Get initial status
    window.ipcRenderer.invoke('wa-get-status').then((status: any) => {
      if (status) setWaStatus(status);
    });

    // Listen for updates
    const removeListener = window.ipcRenderer.on('wa-status', (_event, status: any) => {
      setWaStatus(status);
    });

    return () => {
      if (typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            Smart Sender
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white' 
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white'
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-green-500" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              License Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className={cn(
              "text-sm font-medium",
              (waStatus.status === 'READY' || waStatus.status === 'AUTHENTICATED') ? "text-green-600 dark:text-green-400" : "text-zinc-500"
            )}>
              {(waStatus.status === 'READY' || waStatus.status === 'AUTHENTICATED')
                ? (waStatus.number ? `Connected: +${waStatus.number}` : 'Connected')
                : 'No Connection'}
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
