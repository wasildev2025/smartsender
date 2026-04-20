export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Messages Sent</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">12,450</div>
          <p className="mt-1 text-sm text-green-600">+14% from last week</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Active Campaigns</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">3</div>
          <p className="mt-1 text-sm text-zinc-500">2 running, 1 paused</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-500 text-sm font-medium">Connected Accounts</h3>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">2</div>
          <p className="mt-1 text-sm text-zinc-500">All operating normally</p>
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
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">Spring Sale Promo</td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</span></td>
                <td className="px-6 py-4">4,500 / 4,500</td>
                <td className="px-6 py-4 text-zinc-500">Apr 20, 2026</td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">Customer Welcome</td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Running</span></td>
                <td className="px-6 py-4">120 / ∞</td>
                <td className="px-6 py-4 text-zinc-500">Active</td>
              </tr>
              <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">Product Update Notice</td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Paused</span></td>
                <td className="px-6 py-4">800 / 1,200</td>
                <td className="px-6 py-4 text-zinc-500">Apr 18, 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
