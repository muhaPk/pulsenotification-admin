import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useGenericGetWeb } from "../../hooks/useGenericGetWeb";
import { useAxios } from "../../hooks/useAxiosWeb";
import { API_ADMIN_BACKTEST_BY_ID, API_ADMIN_BACKTEST_CANDLES } from "../../config/endpoints";
import { EquityCurveChart, DrawdownChart, TradePnlChart } from "../../components/charts/backtest/BacktestCharts";
import CandleChart from "../../components/charts/backtest/CandleChart";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import type { BacktestResult, BacktestRunResponse, BacktestCandle } from "../../types/admin";

function fmtUTC(date: string | Date) {
  return new Date(date).toLocaleString('en-GB', { timeZone: 'UTC', hour12: false, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function copyLogs(result: BacktestResult) {
  const lines: string[] = [];
  lines.push(`Backtest: ${result.base}/${result.target} (${result.interval})`);
  lines.push(`Period: ${new Date(result.startDate).toLocaleDateString()} → ${new Date(result.endDate).toLocaleDateString()}`);
  lines.push(`Strategy: ${result.strategy.strategyId}`);
  lines.push(`Initial Cap: $${result.initialCap.toLocaleString()}  Final Cap: $${result.finalCap.toLocaleString()}  Return: ${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}%`);
  lines.push(`Win Rate: ${result.winRate.toFixed(1)}%  Drawdown: ${result.maxDrawdown.toFixed(2)}%  Sharpe: ${result.sharpeRatio.toFixed(2)}  Trades: ${result.totalTrades}`);
  lines.push('');

  for (const t of result.trades) {
    const pnlStr = t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '?';
    const pctStr = t.pnlPercent !== null ? `${t.pnlPercent >= 0 ? '+' : ''}${t.pnlPercent.toFixed(2)}%` : '?%';
    const reason = t.exitReason ?? '?';
    lines.push(`${fmtUTC(t.entryTime)} ${t.side} ENTRY @ ${t.entryPrice.toFixed(2)} qty=${t.quantity.toFixed(2)}${t.entryCount > 1 ? ` (${t.entryCount} fills)` : ''}`);
    if (t.exitTime) {
      lines.push(`${fmtUTC(t.exitTime)} ${t.side} EXIT  @ ${t.exitPrice?.toFixed(2)} pnl=${pnlStr} (${pctStr}) reason=${reason}`);
    }
    lines.push('');
  }

  navigator.clipboard.writeText(lines.join('\n'));
}

const candleCache: Record<string, BacktestCandle[]> = {};

export default function AdminBacktestView() {
  const { id } = useParams();
  const { data, loading, loadData } = useGenericGetWeb();
  const { get } = useAxios();
  const [candles, setCandles] = useState<BacktestCandle[]>([]);
  const [chartInterval, setChartInterval] = useState<string>("1h");
  const [loadingCandles, setLoadingCandles] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!chartRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      chartRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const onFSChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  useEffect(() => {
    if (id) loadData({ api: API_ADMIN_BACKTEST_BY_ID(id) });
  }, [id]);

  const result: BacktestResult | null = (data as BacktestRunResponse)?.data ?? null;

  const loadAllCandles = (interval: string) => {
    if (!result) return;
    setLoadingCandles(true);

    const start = new Date(result.startDate);
    const end = new Date(result.endDate);
    end.setDate(end.getDate() + 1);

    get({
      api: API_ADMIN_BACKTEST_CANDLES,
      params: {
        exchange: result.exchange,
        base: result.base,
        target: result.target,
        type: result.type,
        interval,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      successHandler: (res: any) => {
        if (res.success && res.data) {
          candleCache[interval] = res.data;
          setCandles(res.data);
        }
        setLoadingCandles(false);
      },
      errorHandler: () => {
        setLoadingCandles(false);
      },
    });
  };

  useEffect(() => {
    if (result) {
      setChartInterval(result.interval);
      if (!result.candles || result.candles.length === 0) {
        loadAllCandles(result.interval);
      } else {
        candleCache[result.interval] = result.candles;
        setCandles(result.candles);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleIntervalChange = (interval: string) => {
    if (!result || interval === chartInterval) return;
    setChartInterval(interval);
    if (candleCache[interval]) {
      setCandles(candleCache[interval]);
    } else {
      setCandles([]);
      loadAllCandles(interval);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageMeta title="Loading..." description="" />
        <p className="text-sm text-gray-500">Loading backtest results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <PageMeta title="Not Found" description="" />
        <p className="text-sm text-gray-500">Backtest not found.</p>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Backtest Result" description="View backtest results" />
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {result.name ? `${result.name} - ` : ''}{result.base}/{result.target} ({result.interval})
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {new Date(result.startDate).toLocaleDateString()} → {new Date(result.endDate).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => copyLogs(result)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
              Copy Logs
            </button>
          </div>
        </div>

        <ComponentCard title="Summary">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Final Capital</p>
              <p className={`mt-1 text-2xl font-semibold ${result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${result.finalCap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Total Return</p>
              <p className={`mt-1 text-2xl font-semibold ${result.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                {result.totalReturn >= 0 ? "+" : ""}{result.totalReturn.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="mt-1 text-2xl font-semibold text-gray-500">{result.winRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Max Drawdown</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{result.maxDrawdown.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Sharpe Ratio</p>
              <p className="mt-1 text-2xl font-semibold text-gray-500">{result.sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="mt-1 text-2xl font-semibold text-gray-500">{result.totalTrades}</p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="P&L per Trade">
          <TradePnlChart trades={result.trades} />
        </ComponentCard>

        <ComponentCard title={`Price History — ${result.base}/${result.target}`}>
          <div className="relative">
            {loadingCandles && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </div>
              </div>
            )}
            <div ref={chartRef} className={`flex flex-col ${loadingCandles ? "opacity-30 pointer-events-none" : ""} ${fullscreen ? "fixed inset-0 z-50 bg-white dark:bg-[#161F2E]" : "h-[450px]"}`}>
              <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-sm text-gray-500">Interval</span>
              <div className="flex items-center gap-1">
                {["1m", "5m", "15m", "30m", "1h", "2h", "4h", "12h", "1d"].map((iv) => (
                  <button
                    key={iv}
                    onClick={() => handleIntervalChange(iv)}
                    className={`px-2.5 py-0.5 text-xs font-medium rounded ${
                      chartInterval === iv
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {iv}
                  </button>
                ))}
                <button
                  onClick={toggleFullscreen}
                  className="ml-1 rounded-md bg-white/80 p-1 text-gray-500 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-800"
                  title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    {fullscreen ? (
                      <path d="M5 5a1 1 0 00-1 1v3a1 1 0 002 0V7h3a1 1 0 000-2H5zm9 0a1 1 0 00-1 1v3a1 1 0 002 0V7h3a1 1 0 100-2h-4zM4 15a1 1 0 001 1h3a1 1 0 000-2H6v-2a1 1 0 00-2 0v3zm13-1a1 1 0 001-1v-3a1 1 0 10-2 0v2h-2a1 1 0 100 2h3z" />
                    ) : (
                      <path d="M4 4a1 1 0 011-1h3a1 1 0 010 2H6v2a1 1 0 01-2 0V4zm12 0a1 1 0 00-1-1h-3a1 1 0 000 2h2v2a1 1 0 002 0V4zM4 16a1 1 0 001 1h3a1 1 0 000-2H6v-2a1 1 0 00-2 0v3zm12-1a1 1 0 001-1v-3a1 1 0 10-2 0v2h-2a1 1 0 100 2h3z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <CandleChart key={String(fullscreen)} candles={candles} trades={result.trades} fastEMAPeriod={result.strategy.params.fastEMA} slowEMAPeriod={result.strategy.params.slowEMA} emaEnabled={result.strategy.params.emaEnabled !== 0} adxEnabled={result.strategy.params.adxEnabled !== 0} rsiEnabled={result.strategy.params.rsiEnabled !== 0} rsiPeriod={result.strategy.params.rsiPeriod} />
          </div>
          </div>
        </ComponentCard>

        {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title="Equity Curve">
            <EquityCurveChart data={result.equityCurve} buyPoints={tradeMarkers.buyPoints} sellPoints={tradeMarkers.sellPoints} />
          </ComponentCard>
          <ComponentCard title="Drawdown">
            <DrawdownChart data={result.equityCurve} />
          </ComponentCard>
        </div> */}

        <ComponentCard title={`Trades (${result.trades.length})`}>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Side</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Entry#</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Entry Time</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Entry Price</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Exit Time</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Exit Price</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Amount</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">P&amp;L</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">P&amp;L %</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Exit Reason</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {result.trades.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className={`px-5 py-4 sm:px-6 text-start text-theme-sm ${t.side === "LONG" || t.side === "BUY" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{t.side === "BUY" ? "LONG" : t.side === "SELL" ? "SHORT" : t.side}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-end text-theme-sm">
                        {t.entryCount > 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold">{t.entryCount}</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">{t.entryCount}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {t.entries && t.entries.length > 1 ? (
                          <div className="space-y-0.5">
                            {t.entries.map((e, idx) => (
                              <div key={idx}>{fmtUTC(e.time)}</div>
                            ))}
                          </div>
                        ) : (
                          fmtUTC(t.entryTime)
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-end text-gray-500 text-theme-sm dark:text-gray-400">
                        {t.entries && t.entries.length > 1 ? (
                          <div className="space-y-0.5">
                            {t.entries.map((e, idx) => (
                              <div key={idx}>${e.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                            ))}
                          </div>
                        ) : (
                          `$${t.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">{t.exitTime ? fmtUTC(t.exitTime) : "-"}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-end text-gray-500 text-theme-sm dark:text-gray-400">{t.exitPrice != null ? `$${t.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : "-"}</TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-end text-gray-500 text-theme-sm dark:text-gray-400">${(t.quantity * t.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={`px-5 py-4 sm:px-6 text-end text-theme-sm ${t.pnl != null && t.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`px-5 py-4 sm:px-6 text-end text-theme-sm ${t.pnlPercent != null && t.pnlPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {t.pnlPercent != null ? `${t.pnlPercent >= 0 ? "+" : ""}${t.pnlPercent.toFixed(2)}%` : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          t.exitReason === "stop_loss" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          t.exitReason === "trailing_stop" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          t.exitReason === "end_of_data" ? "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" :
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {t.exitReason?.replace(/_/g, " ") || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
