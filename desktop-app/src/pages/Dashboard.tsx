import { useEffect, useState } from 'react';

interface CampaignRecord {
  id: string;
  name: string;
  status: 'Completed' | 'Running' | 'Paused' | 'Failed';
  sent: number;
  total: number;
  date: string;
}

interface DashboardData {
  totalSent: number;
  history: CampaignRecord[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    totalSent: 0,
    history: []
  });

  useEffect(() => {
    window.ipcRenderer.invoke('db-get-dashboard-data').then((res: DashboardData) => {
      if (res) setData(res);
    });
  }, []);

  const stats = {
    totalSent: data.totalSent.toLocaleString(),
    activeCampaigns: data.history.filter(h => h.status === 'Running' || h.status === 'Paused').length,
    connectedAccounts: 1 // For now simple
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Messages Sent</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalSent}</div>
          <p className="mt-1 text-sm text-green-600">Total Lifetime Messages</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Recent Campaigns</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{data.history.length}</div>
          <p className="mt-1 text-sm text-zinc-500">History in last 50 runs</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Status</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">Active</div>
          <p className="mt-1 text-sm text-green-600">All systems operating</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Campaign Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sent</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No recent activity yet. Start your first campaign!
                  </td>
                </tr>
              ) : (
                data.history.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{campaign.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                        ${campaign.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                        ${campaign.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                        ${campaign.status === 'Running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        ${campaign.status === 'Paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                      `}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{campaign.sent} / {campaign.total}</td>
                    <td className="px-6 py-4 text-zinc-500">{campaign.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
