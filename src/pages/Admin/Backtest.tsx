import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import StrategyParamsForm from "../../components/common/StrategyParamsForm";
import { useGenericSet } from "../../hooks/useGenericSetWeb";
import { useAxios } from "../../hooks/useAxiosWeb";
import { API_ADMIN_BACKTEST_RUN, API_ADMIN_BACKTEST_LIST } from "../../config/endpoints";
import { STRATEGIES, initParams } from "../../config/strategies";
import { EquityCurveChart, DrawdownChart, TradePnlChart } from "../../components/charts/backtest/BacktestCharts";
import CandleChart from "../../components/charts/backtest/CandleChart";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import type { BacktestResult, BacktestRequest, BacktestListResponse } from "../../types/admin";

const DEFAULT_CONFIG: BacktestRequest = {
  exchange: "binance",
  base: "BTC",
  target: "USDT",
  type: "spot",
  interval: "1h",
  startDate: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  strategy: { strategyId: STRATEGIES[0].id, params: initParams(STRATEGIES[0].id) },
  riskManagement: { stopLossPct: 5, trailingActivationPct: 8, trailingOffsetPct: 4 },
  positionSizing: { entries: [100], maxEntries: 1 },
  initialCap: 10000,
  fees: 0.001,
};

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color || "text-gray-800 dark:text-white/90"}`}>
        {value}
      </p>
    </div>
  );
}

export default function AdminBacktest() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<BacktestRequest>(() => ({
    ...DEFAULT_CONFIG,
    strategy: { ...DEFAULT_CONFIG.strategy, params: initParams(STRATEGIES[0].id) },
  }));

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [sortCol, setSortCol] = useState<string>("entryTime");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { submitting, uploadData } = useGenericSet();
  const { get } = useAxios();
  const [savedList, setSavedList] = useState<BacktestResult[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState("");
  const [copied, setCopied] = useState(false);

  const copyConfig = useCallback(() => {
    const groups = STRATEGIES.find(s => s.id === config.strategy.strategyId)?.groups;
    if (!groups) return;
    const lines: string[] = [];
    for (const g of groups) {
      lines.push(`[${g.label}]`);
      for (const d of g.paramDefs) {
        const val = config.strategy.params[d.key] ?? d.default;
        const display = d.step === 1 ? String(Math.round(val)) : String(val);
        lines.push(`  ${d.label}: ${display}`);
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [config.strategy]);

  const fetchSaved = () => {
    get({
      api: API_ADMIN_BACKTEST_LIST,
      successHandler: (res: BacktestListResponse) => {
        if (res.success) setSavedList(res.data ?? []);
      },
    });
  };

  useEffect(() => { fetchSaved(); }, []);

  useEffect(() => {
    if (savedList.length > 0 && !selectedSavedId) {
      loadSavedConfig(savedList[0].id);
    }
  }, [savedList]);

  const loadSavedConfig = (id: string) => {
    const saved = savedList.find(b => b.id === id);
    if (!saved) return;
    setSelectedSavedId(id);
    setConfig({
      ...DEFAULT_CONFIG,
      name: saved.name ?? '',
      exchange: saved.exchange,
      base: saved.base,
      target: saved.target,
      type: saved.type,
      interval: saved.interval,
      startDate: saved.startDate.split('T')[0],
      endDate: saved.endDate.split('T')[0],
      initialCap: saved.initialCap,
      fees: saved.fees,
      riskManagement: saved.riskManagement,
      positionSizing: saved.positionSizing,
      strategy: {
        strategyId: saved.strategy.strategyId,
        params: { ...saved.strategy.params },
      },
    });
  };

  const updateParam = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateStrategyParam = (key: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      strategy: { ...prev.strategy, params: { ...prev.strategy.params, [key]: value } },
    }));
  };

  const setDatePreset = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setConfig((prev) => ({
      ...prev,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    }));
  };

  const runBacktest = () => {
    setResult(null);
    uploadData({
      api: API_ADMIN_BACKTEST_RUN,
      method: "post",
      data: config,
      dataCallback: (res: any) => {
        if (res.success && res.data) {
          navigate(`/admin/backtest/${res.data.id}`);
        } else {
          alert(res.message || "Backtest failed");
        }
      },
    });
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sortedTrades = [...(result?.trades || [])].sort((a, b) => {
    const aVal = a[sortCol as keyof typeof a];
    const bVal = b[sortCol as keyof typeof b];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span className="ml-1 text-gray-400">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const currentStrategy = STRATEGIES.find((s) => s.id === config.strategy.strategyId);

  const tradeMarkers = useMemo(() => {
    if (!result) return { buyPoints: [], sellPoints: [] };
    const curve = result.equityCurve;
    const findValue = (time: number) => {
      let lo = 0, hi = curve.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (curve[mid].time < time) lo = mid + 1;
        else hi = mid;
      }
      if (lo > 0 && lo < curve.length) {
        const t0 = curve[lo - 1].time, t1 = curve[lo].time;
        const v0 = curve[lo - 1].value, v1 = curve[lo].value;
        return v0 + (v1 - v0) * ((time - t0) / (t1 - t0));
      }
      return curve[Math.min(lo, curve.length - 1)]?.value ?? 0;
    };
    const buyPoints: { time: number; price: number }[] = [];
    const sellPoints: { time: number; price: number }[] = [];
    for (const t of result.trades) {
      const entryMs = new Date(t.entryTime).getTime();
      buyPoints.push({ time: entryMs, price: findValue(entryMs) });
      if (t.exitTime) {
        const exitMs = new Date(t.exitTime).getTime();
        sellPoints.push({ time: exitMs, price: findValue(exitMs) });
      }
    }
    return { buyPoints, sellPoints };
  }, [result]);

  return (
    <div>
      <PageMeta title="Backtest" description="Run strategy backtests on historical data" />
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Backtest</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure and run strategy backtests on historical market data
          </p>
        </div>

        {/* Load Saved */}
        <ComponentCard title="Load Saved Strategy">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <select
                value={selectedSavedId}
                onChange={(e) => loadSavedConfig(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">-- Select saved backtest --</option>
                {savedList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name || `${b.base}/${b.target} (${b.interval})`} — {new Date(b.startDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            {(selectedSavedId || config.name) && (
              <button
                onClick={() => { setSelectedSavedId(""); setConfig({ ...DEFAULT_CONFIG, strategy: { ...DEFAULT_CONFIG.strategy, params: initParams(STRATEGIES[0].id) } }); }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                Reset
              </button>
            )}
          </div>
        </ComponentCard>

        {/* Configuration Form */}
        <ComponentCard title="Configuration">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                value={config.name ?? ''}
                onChange={(e) => updateParam("name", e.target.value)}
                placeholder="My Backtest"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Exchange */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Exchange</label>
              <select
                value={config.exchange}
                onChange={(e) => updateParam("exchange", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="binance">Binance</option>
                <option value="bybit">Bybit</option>
                <option value="okx">OKX</option>
                <option value="kraken">Kraken</option>
                <option value="coinbase">Coinbase</option>
              </select>
            </div>

            {/* Base */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Base Asset</label>
              <input
                type="text"
                value={config.base}
                onChange={(e) => updateParam("base", e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Target */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Target Asset</label>
              <input
                type="text"
                value={config.target}
                onChange={(e) => updateParam("target", e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={config.type}
                onChange={(e) => updateParam("type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="spot">Spot</option>
                <option value="futures">Futures</option>
              </select>
            </div>

            {/* Interval */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Interval</label>
              <select
                value={config.interval}
                onChange={(e) => updateParam("interval", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="30m">30m</option>
                <option value="1h">1h</option>
                <option value="2h">2h</option>
                <option value="4h">4h</option>
                <option value="12h">12h</option>
                <option value="1d">1d</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <div className="flex gap-2">
                <button onClick={() => setDatePreset(1)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">1m</button>
                <button onClick={() => setDatePreset(3)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">3m</button>
                <button onClick={() => setDatePreset(6)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">6m</button>
                <button onClick={() => setDatePreset(12)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">1Y</button>
                <button onClick={() => setDatePreset(24)} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">2Y</button>
              </div>
              <div className="mt-1 flex gap-2">
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => updateParam("startDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={config.endDate}
                  onChange={(e) => updateParam("endDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Initial Capital */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Capital ($)</label>
              <input
                type="number"
                value={config.initialCap}
                onChange={(e) => updateParam("initialCap", Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Fees */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fees (%)</label>
              <input
                type="number"
                value={config.fees * 100}
                onChange={(e) => updateParam("fees", Number(e.target.value) / 100)}
                step="0.01"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Strategy Section */}
          <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Strategy</h3>
              <button
                onClick={copyConfig}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <select
              value={config.strategy.strategyId}
              onChange={(e) => {
                setConfig((prev) => ({
                  ...prev,
                  strategy: { strategyId: e.target.value, params: initParams(e.target.value) },
                }));
              }}
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {currentStrategy && (
              <StrategyParamsForm
                strategy={currentStrategy}
                params={config.strategy.params}
                onChange={updateStrategyParam}
              />
            )}
          </div>

          {/* Run Button */}
          <div className="mt-6">
            <button
              onClick={runBacktest}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Running Backtest..." : "Run Backtest"}
            </button>
          </div>
        </ComponentCard>

        {/* Results Dashboard */}
        {result && (
          <>
            <ComponentCard title="Results">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <MetricCard
                  label="Final Capital"
                  value={`$${result.finalCap.toLocaleString()}`}
                  color={result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}
                />
                <MetricCard
                  label="Total Return"
                  value={`${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn.toFixed(2)}%`}
                  color={result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}
                />
                <MetricCard label="Win Rate" value={`${result.winRate.toFixed(1)}%`} color="text-gray-500" />
                <MetricCard label="Max Drawdown" value={`${result.maxDrawdown.toFixed(2)}%`} color="text-red-600" />
                <MetricCard label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} color="text-gray-500" />
                <MetricCard label="Total Trades" value={String(result.totalTrades)} color="text-gray-500" />
              </div>
            </ComponentCard>

            {result.candles && result.candles.length > 0 && (
              <ComponentCard title={`Price History — ${result.base}/${result.target} (${result.interval})`}>
                <CandleChart candles={result.candles} trades={result.trades}
                  fastEMAPeriod={result.strategy.params.fastEMA ?? result.strategy.params.trendFastEMA}
                  slowEMAPeriod={result.strategy.params.slowEMA ?? result.strategy.params.trendSlowEMA}
                  emaEnabled={result.strategy.params.emaEnabled !== 0}
                  adxEnabled={result.strategy.params.adxEnabled !== 0}
                  rsiEnabled={result.strategy.params.rsiEnabled !== 0}
                  rsiPeriod={result.strategy.params.rsiPeriod ?? result.strategy.params.rangeRsiPeriod}
                />
              </ComponentCard>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ComponentCard title="Equity Curve">
                <EquityCurveChart data={result.equityCurve} buyPoints={tradeMarkers.buyPoints} sellPoints={tradeMarkers.sellPoints} />
              </ComponentCard>
              <ComponentCard title="Drawdown">
                <DrawdownChart data={result.equityCurve} />
              </ComponentCard>
            </div>
            <ComponentCard title="P&L per Trade">
              <TradePnlChart trades={result.trades} />
            </ComponentCard>

            <ComponentCard title={`Trades (${result.trades.length})`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("side")}>
                        Side <SortIcon col="side" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer text-center" onClick={() => handleSort("entryCount")}>
                        Entry# <SortIcon col="entryCount" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("entryTime")}>
                        Entry Time <SortIcon col="entryTime" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("entryPrice")}>
                        Entry Price <SortIcon col="entryPrice" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("exitTime")}>
                        Exit Time <SortIcon col="exitTime" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("exitPrice")}>
                        Exit Price <SortIcon col="exitPrice" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("quantity")}>
                        Amount <SortIcon col="quantity" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("pnl")}>
                        P&L <SortIcon col="pnl" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("pnlPercent")}>
                        P&L % <SortIcon col="pnlPercent" />
                      </TableCell>
                      <TableCell isHeader className="cursor-pointer" onClick={() => handleSort("exitReason")}>
                        Exit Reason <SortIcon col="exitReason" />
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTrades.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className={t.side === "LONG" || t.side === "BUY" ? "text-green-600" : "text-red-600"}>{t.side === "BUY" ? "LONG" : t.side === "SELL" ? "SHORT" : t.side}</TableCell>
                        <TableCell className="text-center">
                          {t.entryCount > 1 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">{t.entryCount}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">{t.entryCount}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.entries && t.entries.length > 1 ? (
                            <div className="space-y-0.5">
                              {t.entries.map((e, idx) => (
                                <div key={idx}>{new Date(e.time).toLocaleString()}</div>
                              ))}
                            </div>
                          ) : (
                            new Date(t.entryTime).toLocaleString()
                          )}
                        </TableCell>
                        <TableCell>
                          {t.entries && t.entries.length > 1 ? (
                            <div className="space-y-0.5">
                              {t.entries.map((e, idx) => (
                                <div key={idx}>${e.price.toLocaleString()}</div>
                              ))}
                            </div>
                          ) : (
                            `$${t.entryPrice.toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell>{t.exitTime ? new Date(t.exitTime).toLocaleString() : "-"}</TableCell>
                        <TableCell>{t.exitPrice != null ? `$${t.exitPrice.toLocaleString()}` : "-"}</TableCell>
                        <TableCell>${(t.quantity * t.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className={t.pnl != null && t.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                          {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className={t.pnlPercent != null && t.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}>
                          {t.pnlPercent != null ? `${t.pnlPercent >= 0 ? "+" : ""}${t.pnlPercent.toFixed(2)}%` : "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            t.exitReason === "stop_loss" ? "bg-red-100 text-red-700" :
                            t.exitReason === "trailing_stop" ? "bg-yellow-100 text-yellow-700" :
                            t.exitReason === "end_of_data" ? "bg-gray-100 text-gray-600" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {t.exitReason?.replace(/_/g, " ") || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ComponentCard>
          </>
        )}
      </div>
    </div>
  );
}
