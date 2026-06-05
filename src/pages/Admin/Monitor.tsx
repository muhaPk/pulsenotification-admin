import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useGenericGetWeb } from "../../hooks/useGenericGetWeb";
import { API_ADMIN_MONITOR_STATS } from "../../config/endpoints";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const diffMs = now - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Online";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ${diffHr % 24}h ago`;
}

export default function AdminMonitor() {
  const { data, loadData } = useGenericGetWeb();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData({
      api: API_ADMIN_MONITOR_STATS,
      dataCallback: (res: any) => setStats(res),
    });

    const interval = setInterval(() => {
      loadData({
        api: API_ADMIN_MONITOR_STATS,
        dataCallback: (res: any) => setStats(res),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data) setStats(data);
  }, [data]);

  return (
    <>
      <PageMeta
        title="Monitor | Admin Dashboard"
        description="Server-side volatility monitoring status"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Monitor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Server-side volatility monitor status (auto-refreshes every 10s)
          </p>
        </div>

        {stats && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium w-1/2">Name</th>
                  <th className="px-4 py-3 font-medium w-1/2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  ['Uptime', formatUptime(stats.uptime)],
                  ['WS Connections', stats.connections],
                  ['Monitored Pairs', stats.uniquePairs],
                  ['Total Alerts (all time)', stats.totalAlerts],
                  ['Alerts (24h)', stats.alertsLast24h],
                  ['Authorized Users', stats.totalUsers],
                ].map(([name, value]) => (
                  <tr key={name as string} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{name as string}</td>
                    <td className="px-4 py-3 font-medium text-right text-gray-500 dark:text-gray-400">{(value ?? 0).toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats?.usersWithPairs && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Pairs per User
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium text-right">Pairs</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.usersWithPairs.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-800 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white">
                        {u.pairsCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                          u.lastActiveAt && Date.now() - new Date(u.lastActiveAt).getTime() < 60000
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {u.lastActiveAt && Date.now() - new Date(u.lastActiveAt).getTime() < 60000 && (
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                          )}
                          {formatLastActive(u.lastActiveAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!stats && (
          <p className="text-sm text-gray-500">Loading monitor stats...</p>
        )}
      </div>
    </>
  );
}
