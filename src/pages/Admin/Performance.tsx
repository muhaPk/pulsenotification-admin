import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useGenericGetWeb } from "../../hooks/useGenericGetWeb";
import { API_ADMIN_MONITOR_PERFORMANCE } from "../../config/endpoints";
import {
  WsMessageDonut,
  AlertDirectionDonut,
  ConnectionPairsBar,
  ConnectionSummaryBar,
  TickerProcessingBar,
} from "../../components/charts/performance/PerformanceCharts";

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

export default function AdminPerformance() {
  const { data, loadData } = useGenericGetWeb();
  const [perf, setPerf] = useState<any>(null);

  useEffect(() => {
    loadData({
      api: API_ADMIN_MONITOR_PERFORMANCE,
      dataCallback: (res: any) => setPerf(res),
    });
    const interval = setInterval(() => {
      loadData({
        api: API_ADMIN_MONITOR_PERFORMANCE,
        dataCallback: (res: any) => setPerf(res),
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data) setPerf(data);
  }, [data]);

  if (!perf) {
    return (
      <>
        <PageMeta title="Performance | Admin Dashboard" description="System performance metrics" />
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Performance</h1>
          <p className="text-sm text-gray-500">Loading performance data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Performance | Admin Dashboard"
        description="System performance metrics for WebSocket and volatility tracking"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Performance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time performance metrics for WebSocket connections and volatility monitoring (auto-refreshes every 10s)
          </p>
        </div>

        {/* Monitor Overview */}
        <div className="mb-4 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium w-1/2">Name</th>
                <th className="px-4 py-3 font-medium w-1/2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ['Monitor Uptime', formatUptime(perf.uptime)],
                ['Unique Pairs', perf.uniquePairs],
                ['Multiplier', `${perf.multiplier?.toFixed(1)}x`],
                ['Volatility Cache', `${perf.volatilityCacheSize} pairs`],
              ].map(([name, value]) => (
                <tr key={name as string} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{name as string}</td>
                    <td className="px-4 py-3 font-medium text-right text-gray-500 dark:text-gray-400">{(value ?? 0).toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {/* WebSocket Performance */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            WebSocket Connections
          </h2>

          {/* Summary table */}
          <div className="mb-4 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium w-1/2">Name</th>
                  <th className="px-4 py-3 font-medium w-1/2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  ['Active Connections', perf.ws.totalConnections],
                  ['Tracked Pairs', perf.ws.trackedSymbols],
                  ['Messages Received', perf.ws.messagesReceived?.toLocaleString()],
                  ['Messages Parsed', perf.ws.messagesParsed?.toLocaleString()],
                  ['Parse Errors', perf.ws.parseErrors?.toLocaleString()],
                  ['Reconnections', perf.ws.reconnections],
                  ['Connections Opened', perf.ws.connectionsOpened],
                ].map(([name, value]) => (
                  <tr key={name as string} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{name as string}</td>
                    <td className="px-4 py-3 font-medium text-right text-gray-500 dark:text-gray-400">{(value ?? 0).toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price History */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Price History Buffer
            </h2>
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
                    ['Pairs with History', perf.priceHistoryPairs],
                    ['Avg History Size', perf.avgHistorySize],
                    ['Min / Max', `${perf.minHistorySize} / ${perf.maxHistorySize}`],
                  ].map(([name, value]) => (
                    <tr key={name as string} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{name as string}</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-500 dark:text-gray-400">{(value ?? 0).toString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connection Detail Table — always visible */}
          <div className="mb-4 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Connection</th>
                  <th className="px-4 py-3 font-medium text-right">Pairs</th>
                  <th className="px-4 py-3 font-medium text-right">Uptime</th>
                  <th className="px-4 py-3 font-medium text-right">Reconnects</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {perf.ws.connections?.length > 0 ? (perf.ws.connections.map((conn: any) => (
                  <tr key={conn.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {conn.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {conn.pairs}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {conn.uptime > 0 ? formatUptime(conn.uptime) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {perf.ws.reconnections || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {conn.uptime > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          Disconnected
                        </span>
                      )}
                    </td>
                  </tr>
                ))) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      No active WebSocket connections
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ComponentCard title="Message Flow">
              <WsMessageDonut
                parsed={perf.ws.messagesParsed}
                errors={perf.ws.parseErrors}
              />
            </ComponentCard>
            <ComponentCard title="Connection Summary">
              <ConnectionSummaryBar
                active={perf.ws.totalConnections}
                opened={perf.ws.connectionsOpened}
                reconnections={perf.ws.reconnections}
              />
            </ComponentCard>
            {perf.ws.connections?.length > 0 && (
              <ComponentCard title="Pairs per Connection">
                <ConnectionPairsBar connections={perf.ws.connections} />
              </ComponentCard>
            )}
          </div>
        </div>

        {/* Ticker Processing */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Ticker Processing
          </h2>
          <div className="max-w-md">
            <ComponentCard title="Processed vs Throttled">
              <TickerProcessingBar
                processed={perf.tickersProcessed}
                throttled={perf.tickersThrottled}
              />
            </ComponentCard>
          </div>
        </div>

        

        {/* Session Alerts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Session Alerts (since monitor start)
          </h2>
          <div className="max-w-md">
            <ComponentCard title="Pump / Dump Distribution">
              <AlertDirectionDonut
                pumps={perf.sessionPumps}
                dumps={perf.sessionDumps}
              />
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
}