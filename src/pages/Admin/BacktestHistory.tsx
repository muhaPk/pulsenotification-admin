import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useGenericGetWeb } from "../../hooks/useGenericGetWeb";
import useGenericSet from "../../hooks/useGenericSetWeb";
import { API_ADMIN_BACKTEST_LIST, API_ADMIN_BACKTEST_BY_ID } from "../../config/endpoints";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import type { BacktestResult, BacktestListResponse } from "../../types/admin";

export default function AdminBacktestHistory() {
  const navigate = useNavigate();
  const { data, loading, loadData } = useGenericGetWeb();
  const { uploadData } = useGenericSet();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchList = () => loadData({ api: API_ADMIN_BACKTEST_LIST });

  useEffect(() => {
    fetchList();
  }, []);

  const list: BacktestResult[] = (data as BacktestListResponse)?.data ?? [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(list.map(a => a.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} backtest(s)?`)) return;
    let completed = 0;
    const total = selectedIds.size;
    for (const id of selectedIds) {
      uploadData({
        api: API_ADMIN_BACKTEST_BY_ID(id),
        method: 'delete',
        dataCallback: () => {
          completed++;
          if (completed >= total) {
            setSelectedIds(new Set());
            fetchList();
          }
        },
      });
    }
  };

  return (
    <div>
      <PageMeta title="Backtest History" description="Past backtest runs" />
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Backtest History
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and compare previous backtest runs
          </p>
        </div>

        <ComponentCard title="Past Runs">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-500">No backtests yet. Run one from the Backtest page.</p>
          ) : (
            <>
              {selectedIds.size > 0 && (
                <div className="mb-3">
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Delete Selected ({selectedIds.size})
                  </button>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={list.length > 0 && selectedIds.size === list.length}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pair</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Interval</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Strategy</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Initial</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Final</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Return</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Win Rate</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Max Dropdown</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Trades</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {list.map((bt) => (
                        <TableRow
                          key={bt.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => navigate(`/admin/backtest/${bt.id}`)}
                        >
                          <TableCell className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(bt.id); }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(bt.id)}
                              onChange={() => toggleSelect(bt.id)}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90"
                          >
                            {bt.name || '-'}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400"
                          >
                            {new Date(bt.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {bt.base}/{bt.target}
                            </span>
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {bt.interval}
                            </span>
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400"
                          >
                            {bt.strategy.strategyId}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start text-gray-800 text-theme-sm dark:text-white/90"
                          >
                            ${bt.initialCap.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start font-medium text-theme-sm dark:text-white/90"
                          >
                            ${bt.finalCap.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              bt.totalReturn >= 5
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : bt.totalReturn >= 0
                                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-500"
                                : bt.totalReturn >= -10
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {bt.totalReturn >= 0 ? "+" : ""}{bt.totalReturn.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              bt.winRate >= 60
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : bt.winRate >= 40
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {bt.winRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              bt.maxDrawdown < 10
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : bt.maxDrawdown < 25
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {bt.maxDrawdown.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell
                            className="px-5 py-4 sm:px-6 text-start"
                          >
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {bt.totalTrades}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
