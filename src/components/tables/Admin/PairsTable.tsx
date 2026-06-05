import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { useGenericGetWeb } from "../../../hooks/useGenericGetWeb";
import {
  AdminPairsResponse,
  AdminPairsVolatilityResponse,
  AdminPairsAlertsCountResponse,
} from "../../../types/admin";
import {
  API_ADMIN_PAIRS,
  API_ADMIN_PAIRS_VOLATILITY,
  API_ADMIN_PAIRS_ALERTS_COUNT,
} from "../../../config/endpoints";

export default function PairsTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { data, loading, error, loadData } = useGenericGetWeb();
  const { data: volData, loadData: loadVol } = useGenericGetWeb();
  const { data: alertsData, loadData: loadAlerts } = useGenericGetWeb();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchData = useCallback(() => {
    loadData({
      api: API_ADMIN_PAIRS,
      isRefreshing: true,
      params: { page, limit, ...(debouncedSearch && { search: debouncedSearch }) },
    });
  }, [page, debouncedSearch]);

  const fetchVolatility = useCallback(() => {
    loadVol({ api: API_ADMIN_PAIRS_VOLATILITY });
  }, []);

  const fetchAlertsCount = useCallback(() => {
    loadAlerts({ api: API_ADMIN_PAIRS_ALERTS_COUNT });
  }, []);

  useEffect(() => {
    fetchData();
    fetchVolatility();
    fetchAlertsCount();
  }, [fetchData, fetchVolatility, fetchAlertsCount]);

  const refetch = () => {
    loadData({
      api: API_ADMIN_PAIRS,
      params: { page, limit, ...(search && { search }) },
      isRefreshing: true,
    });
    loadVol({ api: API_ADMIN_PAIRS_VOLATILITY, isRefreshing: true });
    loadAlerts({ api: API_ADMIN_PAIRS_ALERTS_COUNT, isRefreshing: true });
  };

  const response = data as AdminPairsResponse | null;
  const pairs = response?.data ?? [];
  const pagination = response?.pagination;
  const volatilityMap = new Map(
    (volData as AdminPairsVolatilityResponse | null)?.data?.map((v) => [v.id, v.avgVolatility1m]) ?? [],
  );
  const alertsCountMap = new Map(
    (alertsData as AdminPairsAlertsCountResponse | null)?.data?.map((a) => [a.pairId, a.count]) ?? [],
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading pairs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by pair, exchange, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={refetch}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Pair
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Exchange
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Type
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created By
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Avg Volatility 1m
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Alerts
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pairs.map((pair) => (
                <TableRow key={pair.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {pair.base}/{pair.target}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {pair.exchange}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge
                      size="sm"
                      color={pair.type === 'futures' ? 'warning' : 'primary'}
                    >
                      {pair.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {pair.user.name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {pair.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatDate(pair.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end text-theme-sm">
                    {volatilityMap.has(pair.id) ? (
                      <span className={volatilityMap.get(pair.id)! > 1 ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                        {volatilityMap.get(pair.id)!.toFixed(4)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end text-theme-sm">
                    {alertsCountMap.has(pair.id) ? (
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {alertsCountMap.get(pair.id)}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} pairs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
