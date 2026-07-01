import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useGenericSet } from "../../hooks/useGenericSetWeb";
import { useAxios } from "../../hooks/useAxiosWeb";
import { API_ADMIN_BACKTEST_RUN, API_ADMIN_BACKTEST_LIST } from "../../config/endpoints";
import { EquityCurveChart, DrawdownChart, TradePnlChart } from "../../components/charts/backtest/BacktestCharts";
import CandleChart from "../../components/charts/backtest/CandleChart";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import type { BacktestResult, BacktestRequest, BacktestTrade, BacktestListResponse } from "../../types/admin";

const STRATEGIES = [
  {
    id: "trend-pullback",
    name: "Trend Pullback",
    description: "Directional strategy: LONG on pullbacks in uptrend, SHORT on bounces in downtrend. Uses EMA50/200 for trend, ADX > 25 for strength, RSI for entry timing. Includes yearly-range position biasing, scale-in add-ons, and trailing stops.",
    groups: [
      {
        key: "ema",
        label: "EMA",
        paramDefs: [
          { key: "emaEnabled", label: "EMA Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "fastEMA", label: "Fast EMA Period", default: 50, min: 5, max: 200, step: 1 },
          { key: "slowEMA", label: "Slow EMA Period", default: 200, min: 10, max: 400, step: 1 },
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
        ],
      },
      {
        key: "adx",
        label: "ADX",
        paramDefs: [
          { key: "adxEnabled", label: "ADX Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "adxPeriod", label: "ADX Period", default: 14, min: 5, max: 50, step: 1 },
          { key: "adxThreshold", label: "ADX Threshold (>)", default: 25, min: 5, max: 50, step: 1 },
        ],
      },
      {
        key: "rsi",
        label: "RSI",
        paramDefs: [
          { key: "rsiEnabled", label: "RSI Filter", default: 1, min: 0, max: 1, step: 1 },
          { key: "rsiPeriod", label: "RSI Period", default: 14, min: 2, max: 50, step: 1 },
          { key: "rsiLongThreshold", label: "RSI Long Entry (<)", default: 40, min: 5, max: 95, step: 1 },
          { key: "rsiShortThreshold", label: "RSI Short Entry (>)", default: 65, min: 5, max: 95, step: 1 },
        ],
      },
      {
        key: "bias",
        label: "Yearly Range Bias",
        paramDefs: [
          { key: "biasEnabled", label: "Yearly Range Bias", default: 1, min: 0, max: 1, step: 1 },
          { key: "yearlyRangeLookback", label: "Lookback", default: 8760, min: 100, max: 100000, step: 100 },
          { key: "biasZoneTop", label: "Bias Short Zone Top %", default: 80, min: 50, max: 100, step: 1 },
          { key: "biasZoneBottom", label: "Bias Long Zone Bottom %", default: 20, min: 0, max: 50, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 40, min: 5, max: 100, step: 5 },
          { key: "longAddonEnabled", label: "Add-on", default: 1, min: 0, max: 1, step: 1 },
          { key: "longAddonPct", label: "Add-on %", default: 60, min: 0, max: 100, step: 5 },
          { key: "longAddonTriggerPct", label: "Add-on Trigger (%)", default: -3, min: -20, max: 0, step: 1 },
          { key: "longAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "longStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
          { key: "longRetryOffsetTrailingPct", label: "Re-entry Trailing %", default: 2, min: 0, max: 20, step: 0.5 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 60, min: 5, max: 100, step: 5 },
          { key: "shortAddonEnabled", label: "Add-on", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortAddonPct", label: "Add-on %", default: 40, min: 0, max: 100, step: 5 },
          { key: "shortAddonTriggerPct", label: "Add-on Trigger (%)", default: 3, min: 0, max: 20, step: 1 },
          { key: "shortAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 5, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 6, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 3, min: 1, max: 50, step: 1 },
          { key: "shortRetryOffsetTrailingPct", label: "Re-entry Trailing %", default: 2, min: 0, max: 20, step: 0.5 },
        ],
      },
    ],
  },
  {
    id: "adaptive-rsi-trend",
    name: "Adaptive RSI Trend",
    description: "Switches between RSI mean-reversion in ranging markets (ADX low) and EMA trend-following in trending markets (ADX high). Auto-adapts to market conditions.",
    groups: [
      {
        key: "adxRegime",
        label: "ADX Regime",
        paramDefs: [
          { key: "adxPeriod", label: "ADX Period", default: 14, min: 5, max: 50, step: 1 },
          { key: "adxThreshold", label: "ADX Threshold", default: 40, min: 10, max: 50, step: 1 },
        ],
      },
      {
        key: "rangeMode",
        label: "Range Mode",
        paramDefs: [
          { key: "rangeRsiPeriod", label: "RSI Period", default: 7, min: 2, max: 50, step: 1 },
          { key: "rangeRsiOversold", label: "RSI Oversold (<)", default: 15, min: 5, max: 50, step: 1 },
          { key: "rangeRsiOverbought", label: "RSI Overbought (>)", default: 85, min: 50, max: 95, step: 1 },
          { key: "rangeRsiExitLong", label: "RSI Exit Long (>)", default: 55, min: 40, max: 90, step: 1 },
          { key: "rangeRsiExitShort", label: "RSI Exit Short (<)", default: 45, min: 10, max: 60, step: 1 },
          { key: "rangeStopLossPct", label: "Range Stop Loss %", default: 4, min: 1, max: 15, step: 1 },
        ],
      },
      {
        key: "trendMode",
        label: "Trend Mode",
        paramDefs: [
          { key: "trendFastEMA", label: "Fast EMA Period", default: 100, min: 5, max: 200, step: 1 },
          { key: "trendSlowEMA", label: "Slow EMA Period", default: 200, min: 10, max: 400, step: 1 },
          { key: "trendRsiPullbackLong", label: "RSI Pullback Long (<)", default: 35, min: 5, max: 80, step: 1 },
          { key: "trendRsiPullbackShort", label: "RSI Pullback Short (>)", default: 65, min: 20, max: 95, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "longStopLoss", label: "Stop Loss %", default: 10, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 25, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 15, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 10, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 25, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 15, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        paramDefs: [
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
          { key: "reversed", label: "Reversed", default: 0, min: 0, max: 1, step: 1 },
          { key: "takeProfitPct", label: "Take Profit %", default: 10, min: 1, max: 50, step: 1 },
        ],
      },
    ],
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description: "Flat direction: BUY when RSI < oversold threshold (default 25), SELL when RSI > overbought threshold (default 75). Exits when RSI crosses back toward the midline. Pure mean-reversion on a single pair.",
    groups: [
      {
        key: "rsi",
        label: "RSI",
        paramDefs: [
          { key: "rsiPeriod", label: "RSI Period", default: 14, min: 2, max: 50, step: 1 },
          { key: "rsiOversoldThreshold", label: "Oversold (<)", default: 25, min: 5, max: 45, step: 1 },
          { key: "rsiOverboughtThreshold", label: "Overbought (>)", default: 75, min: 55, max: 95, step: 1 },
        ],
      },
      {
        key: "exit",
        label: "Exit",
        paramDefs: [
          { key: "rsiExitLong", label: "Exit Long RSI (>)", default: 50, min: 30, max: 80, step: 1 },
          { key: "rsiExitShort", label: "Exit Short RSI (<)", default: 50, min: 20, max: 70, step: 1 },
        ],
      },
      {
        key: "direction",
        label: "Direction",
        paramDefs: [
          { key: "directionFilter", label: "Direction (0=Both, 1=Long, 2=Short)", default: 0, min: 0, max: 2, step: 1 },
          { key: "slCooldownCandles", label: "SL Cooldown Candles", default: 0, min: 0, max: 50, step: 1 },
        ],
      },
      {
        key: "long",
        label: "Long",
        paramDefs: [
          { key: "longFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "longAddonEnabled", label: "Add-on", default: 0, min: 0, max: 1, step: 1 },
          { key: "longAddonPct", label: "Add-on %", default: 60, min: 0, max: 100, step: 5 },
          { key: "longAddonTriggerPct", label: "Add-on Trigger (%)", default: -3, min: -20, max: 0, step: 1 },
          { key: "longAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "longStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "longTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "longTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "longTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
        ],
      },
      {
        key: "short",
        label: "Short",
        paramDefs: [
          { key: "shortFirstPct", label: "First Entry %", default: 100, min: 5, max: 100, step: 5 },
          { key: "shortAddonEnabled", label: "Add-on", default: 0, min: 0, max: 1, step: 1 },
          { key: "shortAddonPct", label: "Add-on %", default: 40, min: 0, max: 100, step: 5 },
          { key: "shortAddonTriggerPct", label: "Add-on Trigger (%)", default: 3, min: 0, max: 20, step: 1 },
          { key: "shortAddonStopLoss", label: "Add-on Stop Loss %", default: 0, min: 0, max: 50, step: 1 },
          { key: "shortStopLoss", label: "Stop Loss %", default: 6, min: 1, max: 50, step: 1 },
          { key: "shortTrailingEnabled", label: "Trailing", default: 1, min: 0, max: 1, step: 1 },
          { key: "shortTrailingActivationPct", label: "Trailing Activation %", default: 8, min: 1, max: 100, step: 1 },
          { key: "shortTrailingOffsetPct", label: "Trailing Offset %", default: 4, min: 1, max: 50, step: 1 },
        ],
      },
    ],
  },
];

const DEFAULT_CONFIG: BacktestRequest = {
  exchange: "binance",
  base: "BTC",
  target: "USDT",
  type: "futures",
  interval: "4h",
  startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  strategy: { strategyId: "trend-pullback", params: {} },
  riskManagement: { stopLossPct: 6, trailingActivationPct: 8, trailingOffsetPct: 4 },
  positionSizing: { entries: [50, 50], maxEntries: 2 },
  initialCap: 1000,
  fees: 0.001,
};

function initParams(groups: typeof STRATEGIES[0]["groups"]): Record<string, number> {
  const p: Record<string, number> = {};
  for (const g of groups) for (const d of g.paramDefs) p[d.key] = d.default;
  return p;
}

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
    strategy: { ...DEFAULT_CONFIG.strategy, params: initParams(STRATEGIES[0].groups) },
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
                onClick={() => { setSelectedSavedId(""); setConfig({ ...DEFAULT_CONFIG, strategy: { ...DEFAULT_CONFIG.strategy, params: initParams(STRATEGIES[0].groups) } }); }}
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
                const s = STRATEGIES.find((st) => st.id === e.target.value)!;
                setConfig((prev) => ({
                  ...prev,
                  strategy: { strategyId: e.target.value, params: initParams(s.groups) },
                }));
              }}
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {currentStrategy && (
              <p className="mb-3 text-xs text-gray-500">{currentStrategy.description}</p>
            )}
            {currentStrategy?.groups.map((group) => (
              <div key={group.key} className="mb-4">
                <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                  group.key === "long" ? "text-green-600 dark:text-green-400" :
                  group.key === "short" ? "text-red-600 dark:text-red-400" :
                  "text-gray-500 dark:text-gray-400"
                }`}>
                  {group.label}
                </h4>
                {(() => {
                  const depMap: Record<string, string[]> = {
                    emaEnabled: ["fastEMA", "slowEMA"],
                    adxEnabled: ["adxPeriod", "adxThreshold"],
                    rsiEnabled: ["rsiLongThreshold", "rsiShortThreshold"],
                    biasEnabled: ["yearlyRangeLookback", "biasZoneTop", "biasZoneBottom"],
                    longAddonEnabled: ["longAddonPct", "longAddonTriggerPct", "longAddonStopLoss"],
                    longTrailingEnabled: ["longTrailingActivationPct", "longTrailingOffsetPct"],
                    shortAddonEnabled: ["shortAddonPct", "shortAddonTriggerPct", "shortAddonStopLoss"],
                    shortTrailingEnabled: ["shortTrailingActivationPct", "shortTrailingOffsetPct"],
                  };
                  const allDeps = Object.values(depMap).flat();
                  const standalone = group.paramDefs.filter(d => !allDeps.includes(d.key) && !depMap[d.key]);
                  const toggleGroups = group.paramDefs
                    .filter(d => depMap[d.key])
                    .map(t => ({ toggle: t, deps: depMap[t.key].map(k => group.paramDefs.find(d => d.key === k)!).filter(Boolean) }));
                  const offMap: Record<string, boolean> = {
                    emaEnabled: (config.strategy.params.emaEnabled ?? 0) === 0,
                    adxEnabled: (config.strategy.params.adxEnabled ?? 0) === 0,
                    rsiEnabled: (config.strategy.params.rsiEnabled ?? 0) === 0,
                    biasEnabled: (config.strategy.params.biasEnabled ?? 0) === 0,
                    longAddonEnabled: (config.strategy.params.longAddonEnabled ?? 0) === 0,
                    shortAddonEnabled: (config.strategy.params.shortAddonEnabled ?? 0) === 0,
                    longTrailingEnabled: (config.strategy.params.longTrailingEnabled ?? 0) === 0,
                    shortTrailingEnabled: (config.strategy.params.shortTrailingEnabled ?? 0) === 0,
                  };
                  return (
                    <>
                      {standalone.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
                          {standalone.map(def => {
                            const slDisabled =
                              (def.key === "longStopLoss" && (config.strategy.params.longAddonEnabled ?? 0) !== 0) ||
                              (def.key === "shortStopLoss" && (config.strategy.params.shortAddonEnabled ?? 0) !== 0);
                            const disabled = slDisabled;
                            return (
                            <div key={def.key}>
                              <label className={`mb-0.5 block text-xs font-medium ${disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}>
                                {def.label}
                              </label>
                              {def.key === "directionFilter" ? (
                                 <select
                                   value={config.strategy.params[def.key] ?? def.default}
                                   onChange={(e) => updateStrategyParam(def.key, Number(e.target.value))}
                                   disabled={disabled}
                                   className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${
                                     disabled
                                       ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                                       : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                   }`}
                                 >
                                   <option value={0}>Both</option>
                                   <option value={1}>Long</option>
                                   <option value={2}>Short</option>
                                 </select>
                               ) : def.key === "reversed" ? (
                                 <select
                                   value={config.strategy.params[def.key] ?? def.default}
                                   onChange={(e) => updateStrategyParam(def.key, Number(e.target.value))}
                                   disabled={disabled}
                                   className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${
                                     disabled
                                       ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                                       : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                   }`}
                                 >
                                   <option value={0}>No</option>
                                   <option value={1}>Yes</option>
                                 </select>
                              ) : (
                                <input
                                  type="number"
                                  value={config.strategy.params[def.key] ?? def.default}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    updateStrategyParam(def.key, val);
                                    if (def.key === "longFirstPct") {
                                      const addonMax = Math.max(0, 100 - val);
                                      const curAddon = config.strategy.params.longAddonPct ?? 60;
                                      if (curAddon > addonMax) updateStrategyParam("longAddonPct", addonMax);
                                    }
                                    if (def.key === "shortFirstPct") {
                                      const addonMax = Math.max(0, 100 - val);
                                      const curAddon = config.strategy.params.shortAddonPct ?? 40;
                                      if (curAddon > addonMax) updateStrategyParam("shortAddonPct", addonMax);
                                    }
                                  }}
                                  min={def.min} max={def.max} step={def.step}
                                  disabled={disabled}
                                  className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${
                                    disabled
                                      ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                                      : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                  }`}
                                />
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                      {toggleGroups.map(({ toggle, deps }) => {
                        const off = offMap[toggle.key];
                        return (
                          <div key={toggle.key} className="mb-2 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{toggle.label}</span>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={(config.strategy.params[toggle.key] ?? toggle.default) === 1}
                                  onChange={(e) => updateStrategyParam(toggle.key, e.target.checked ? 1 : 0)}
                                  className="peer sr-only"
                                />
                                <div className="h-5 w-9 rounded-full bg-red-400 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-green-500 peer-checked:after:translate-x-full dark:bg-red-500 dark:peer-checked:bg-green-600"></div>
                              </div>
                              <span className={`text-xs font-medium ${off ? "text-red-500" : "text-green-600"}`}>
                                {off ? "OFF" : "ON"}
                              </span>
                            </label>
                            {deps.map(def => {
                              const effectiveMax =
                                def.key === "longAddonPct"
                                  ? Math.max(0, 100 - (config.strategy.params.longFirstPct ?? 100))
                                  : def.key === "shortAddonPct"
                                    ? Math.max(0, 100 - (config.strategy.params.shortFirstPct ?? 100))
                                    : def.max;
                              return (
                              <div key={def.key}>
                                <label className={`mb-0.5 block text-xs font-medium ${
                                  off
                                    ? "text-gray-400 dark:text-gray-500"
                                    : def.key === "fastEMA"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : def.key === "slowEMA"
                                        ? "text-orange-600 dark:text-orange-500"
                                        : "text-gray-600 dark:text-gray-400"
                                }`}>
                                  {def.label}
                                </label>
                                <input
                                  type="number"
                                  value={config.strategy.params[def.key] ?? def.default}
                                  onChange={(e) => {
                                    const val = Math.min(Number(e.target.value), effectiveMax);
                                    updateStrategyParam(def.key, val);
                                  }}
                                  min={def.min} max={effectiveMax} step={def.step}
                                  disabled={off}
                                  className={`w-[100px] rounded-md border px-1.5 py-1 text-sm ${
                                    off
                                      ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                                      : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                  }`}
                                />
                              </div>
                            );
                          })}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            ))}
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
