import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import StrategyParamsForm from "../../components/common/StrategyParamsForm";
import { useAxios } from "../../hooks/useAxiosWeb";
import { useGenericSet } from "../../hooks/useGenericSetWeb";
import {
  API_ADMIN_TRADING_API_KEYS,
  API_ADMIN_TRADING_API_KEY_BY_ID,
  API_ADMIN_TRADING_BALANCE,
  API_ADMIN_TRADING_BOTS,
  API_ADMIN_TRADING_BOT_BY_ID,
  API_ADMIN_TRADING_TRADES,
  API_ADMIN_TRADING_POSITIONS,
} from "../../config/endpoints";
import { STRATEGIES, initParams } from "../../config/strategies";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import type { ExchangeApiKey, BotConfig, LiveTrade, LivePosition } from "../../types/admin";

type Tab = "api-keys" | "bots" | "positions" | "trades";

export default function LiveTrading() {
  const { get } = useAxios();
  const { submitting, uploadData } = useGenericSet();
  const [activeTab, setActiveTab] = useState<Tab>("api-keys");

  const [apiKeys, setApiKeys] = useState<ExchangeApiKey[]>([]);
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [balance, setBalance] = useState<Record<string, { free: number; used: number; total: number }>>({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // API Key form
  const [keyExchange, setKeyExchange] = useState("binance");
  const [keyApiKey, setKeyApiKey] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [keyTestnet, setKeyTestnet] = useState(false);

  // Bot form
  const [botBase, setBotBase] = useState("");
  const [botTarget, setBotTarget] = useState("USDT");
  const [botInterval, setBotInterval] = useState("1h");
  const [botStrategyId, setBotStrategyId] = useState("trend-accumulation");
  const [botParams, setBotParams] = useState<Record<string, number>>(() => initParams("trend-accumulation"));
  const [botTradeAmount, setBotTradeAmount] = useState("100");

  useEffect(() => { loadApiKeys(); loadBots(); loadPositions(); loadTrades(); loadBalance(); }, []);
  useEffect(() => {
    const usdtFree = balance["USDT"]?.free;
    if (usdtFree !== undefined && botTradeAmount === "100") {
      setBotTradeAmount(String(usdtFree > 0 ? usdtFree : 100));
    }
  }, [balance]);

  const loadApiKeys = () => {
    get({ api: API_ADMIN_TRADING_API_KEYS, successHandler: (res: any) => { if (res.success) setApiKeys(res.data); } });
  };
  const loadBots = () => {
    get({ api: API_ADMIN_TRADING_BOTS, successHandler: (res: any) => { if (res.success) setBots(res.data); } });
  };
  const loadPositions = () => {
    get({ api: API_ADMIN_TRADING_POSITIONS, successHandler: (res: any) => { if (res.success) setPositions(res.data); } });
  };
  const loadTrades = () => {
    get({ api: API_ADMIN_TRADING_TRADES, successHandler: (res: any) => { if (res.success) setTrades(res.data); } });
  };
  const loadBalance = () => {
    get({
      api: API_ADMIN_TRADING_BALANCE,
      params: { exchange: "binance", type: "future" },
      successHandler: (res: any) => { if (res.success) setBalance(res.data); else setError(res.message); },
      errorHandler: (e: any) => setError(e?.message || "Failed to load balance"),
    });
  };
  const addApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    uploadData({
      api: API_ADMIN_TRADING_API_KEYS,
      method: "post",
      data: { exchange: keyExchange, apiKey: keyApiKey, apiSecret: keySecret, isTestnet: keyTestnet },
      dataCallback: (res: any) => {
        if (res.success) { setSuccess("API key added"); setKeyApiKey(""); setKeySecret(""); loadApiKeys(); }
        else setError(res.message);
      },
    });
  };

  const deleteApiKey = (id: string) => {
    uploadData({
      api: API_ADMIN_TRADING_API_KEY_BY_ID(id),
      method: "delete",
      dataCallback: () => loadApiKeys(),
    });
  };

  const createBot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const amount = parseFloat(botTradeAmount) || 0;
    if (amount < 10) { setError("Minimum trade amount is 10 USDT"); return; }
    const usdtFree = balance["USDT"]?.free ?? 0;
    if (usdtFree === 0) { setError("No USDT balance available — deposit or swap coins to USDT first"); return; }
    if (amount > usdtFree) {
      const msg = `Insufficient USDT balance: ${amount} USDT required, ${usdtFree.toFixed(2)} USDT available`;
      setError(msg);
      return;
    }
    uploadData({
      api: API_ADMIN_TRADING_BOTS,
      method: "post",
      data: { exchange: "binance", base: botBase, target: botTarget, interval: botInterval, strategyId: botStrategyId, params: { ...botParams, tradeAmountUsdt: amount } },
      dataCallback: (res: any) => {
        if (res.success) { setSuccess("Bot created"); setBotBase(""); setBotParams(initParams(botStrategyId)); setBotTradeAmount("100"); loadBots(); }
        else setError(res.message);
      },
    });
  };

  const toggleBot = (bot: BotConfig) => {
    uploadData({
      api: API_ADMIN_TRADING_BOT_BY_ID(bot.id),
      method: "post",
      data: { enabled: !bot.enabled },
      dataCallback: (res: any) => { if (res.success) loadBots(); },
    });
  };

  const deleteBot = (id: string) => {
    uploadData({
      api: API_ADMIN_TRADING_BOT_BY_ID(id),
      method: "delete",
      dataCallback: () => loadBots(),
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "api-keys", label: "API Keys" },
    { key: "bots", label: "Bots" },
    { key: "positions", label: "Positions" },
    { key: "trades", label: "Trade History" },
  ];

  return (
    <>
      <PageMeta title="Live Trading" description="Live trading dashboard" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Live Trading</h1>
          <button onClick={loadBalance} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
            Refresh Balance
          </button>
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">{error}</div>}
        {success && <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">{success}</div>}

        {Object.keys(balance).length > 0 && (
          <ComponentCard title="Balances">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(balance).map(([cur, info]) => (
                <div key={cur} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{cur}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Free: {info.free.toFixed(4)}<br />
                    Total: {info.total.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        )}

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "api-keys" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComponentCard title="Add API Key">
              <form onSubmit={addApiKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exchange</label>
                  <select value={keyExchange} onChange={e => setKeyExchange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="binance">Binance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                  <input type="text" value={keyApiKey} onChange={e => setKeyApiKey(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Secret</label>
                  <input type="password" value={keySecret} onChange={e => setKeySecret(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={keyTestnet} onChange={e => setKeyTestnet(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Testnet</span>
                </label>
                <button type="submit" disabled={submitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
                  Add API Key
                </button>
              </form>
            </ComponentCard>

            <ComponentCard title="Saved API Keys">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No API keys configured</p>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(k => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{k.exchange}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {k.apiKey.slice(0, 8)}...{k.apiKey.slice(-4)}
                          {k.isTestnet && <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Testnet</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteApiKey(k.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </ComponentCard>
          </div>
        )}

        {activeTab === "bots" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComponentCard title="Create Bot">
              <form onSubmit={createBot} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base</label>
                    <input type="text" value={botBase} onChange={e => setBotBase(e.target.value)} required placeholder="BTC"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target</label>
                    <input type="text" value={botTarget} onChange={e => setBotTarget(e.target.value)} required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interval</label>
                    <select value={botInterval} onChange={e => setBotInterval(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                      <option value="1d">1d</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Strategy</label>
                  <select value={botStrategyId} onChange={e => { setBotStrategyId(e.target.value); setBotParams(initParams(e.target.value)); }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trade Amount (USDT)
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                      Available: {balance["USDT"]?.free?.toFixed(2) ?? "—"} USDT
                      {balance["USDT"]?.free ? (
                        <button type="button" onClick={() => setBotTradeAmount(String(balance["USDT"].free))}
                          className="ml-2 text-brand-500 hover:text-brand-600 underline">
                          Use Max
                        </button>
                      ) : (
                        <span className="ml-2 text-xs text-red-400">No USDT balance — fund your account first</span>
                      )}
                    </span>
                  </label>
                  <input type="number" value={botTradeAmount} onChange={e => setBotTradeAmount(e.target.value)} required min="10" step="10"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                {(() => { const strat = STRATEGIES.find(s => s.id === botStrategyId); return strat ? (
                  <StrategyParamsForm strategy={strat} params={botParams} onChange={(k, v) => setBotParams(p => ({ ...p, [k]: v }))} />
                ) : null; })()}
                <button type="submit" disabled={submitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50">
                  Create Bot
                </button>
              </form>
            </ComponentCard>

            <ComponentCard title="Bot Configurations">
              {bots.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No bots configured</p>
              ) : (
                <div className="space-y-3">
                  {bots.map(b => (
                    <div key={b.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{b.base}/{b.target}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {b.exchange} · {b.interval} · {STRATEGIES.find(s => s.id === b.strategyId)?.name || b.strategyId}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBot(b)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              b.enabled
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {b.enabled ? "Enabled" : "Disabled"}
                          </button>
                          <button onClick={() => deleteBot(b.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ComponentCard>
          </div>
        )}

        {activeTab === "positions" && (
          <ComponentCard title="Open Positions">
            {positions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No open positions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Pair</TableCell>
                    <TableCell isHeader>Side</TableCell>
                    <TableCell isHeader>Entry</TableCell>
                    <TableCell isHeader>Qty</TableCell>
                    <TableCell isHeader>Entries</TableCell>
                    <TableCell isHeader>Stop Loss</TableCell>
                    <TableCell isHeader>Trailing</TableCell>
                    <TableCell isHeader>Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.base}/{p.target}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          p.side === 'long' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>{p.side}</span>
                      </TableCell>
                      <TableCell>${p.entryPrice.toFixed(4)}</TableCell>
                      <TableCell>{p.quantity.toFixed(4)}</TableCell>
                      <TableCell>{p.entryCount}</TableCell>
                      <TableCell>{p.stopLossPrice ? `$${p.stopLossPrice.toFixed(4)}` : '-'}</TableCell>
                      <TableCell>{p.trailingActivated ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-xs">{new Date(p.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ComponentCard>
        )}

        {activeTab === "trades" && (
          <ComponentCard title="Trade History">
            {trades.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No trades yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Pair</TableCell>
                    <TableCell isHeader>Side</TableCell>
                    <TableCell isHeader>Entry</TableCell>
                    <TableCell isHeader>Exit</TableCell>
                    <TableCell isHeader>Qty</TableCell>
                    <TableCell isHeader>PnL</TableCell>
                    <TableCell isHeader>Reason</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader>Time</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.base}/{t.target}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          t.side === 'buy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>{t.side}</span>
                      </TableCell>
                      <TableCell>${t.entryPrice.toFixed(4)}</TableCell>
                      <TableCell>{t.exitPrice ? `$${t.exitPrice.toFixed(4)}` : '-'}</TableCell>
                      <TableCell>{t.quantity.toFixed(4)}</TableCell>
                      <TableCell className={t.pnl && t.pnl > 0 ? 'text-green-600' : t.pnl && t.pnl < 0 ? 'text-red-600' : ''}>
                        {t.pnlPercent ? `${t.pnlPercent.toFixed(2)}%` : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{t.exitReason || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          t.status === 'open' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>{t.status}</span>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(t.entryTime).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ComponentCard>
        )}

      </div>
    </>
  );
}
