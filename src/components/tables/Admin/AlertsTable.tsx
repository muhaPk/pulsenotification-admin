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
import useGenericSet from "../../../hooks/useGenericSetWeb";
import { AdminAlertsResponse, AdminAlertsSparklinesResponse } from "../../../types/admin";
import { API_ADMIN_ALERTS, API_ADMIN_ALERT_BY_ID, API_ADMIN_ALERTS_SPARKLINES } from "../../../config/endpoints";
import { sparklineUp, sparklineDown, sparklineMuted } from "../../../config/colors";

export default function AlertsTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { data, loading, error, loadData } = useGenericGetWeb();
  const { data: sparklinesData, loadData: loadSparklines } = useGenericGetWeb();

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
      api: API_ADMIN_ALERTS,
      isRefreshing: true,
      params: { page, limit, ...(debouncedSearch && { search: debouncedSearch }) },
    });
  }, [page, debouncedSearch]);

  const fetchSparklines = useCallback(() => {
    loadSparklines({ api: API_ADMIN_ALERTS_SPARKLINES });
  }, []);

  useEffect(() => {
    fetchData();
    fetchSparklines();
  }, [fetchData, fetchSparklines]);

  const refetch = () => {
    loadData({
      api: API_ADMIN_ALERTS,
      params: { page, limit, ...(search && { search }) },
      isRefreshing: true,
    });
    loadSparklines({ api: API_ADMIN_ALERTS_SPARKLINES, isRefreshing: true });
  };

  const { uploadData } = useGenericSet();

  const handleDelete = (alertId: string) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    uploadData({
      api: API_ADMIN_ALERT_BY_ID(alertId),
      method: 'delete',
      dataCallback: () => refetch(),
    });
  };

  const response = data as AdminAlertsResponse | null;
  const alerts = response?.data ?? [];
  const pagination = response?.pagination;
  const sparklinesMap = (sparklinesData as AdminAlertsSparklinesResponse | null)?.data ?? {};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const AlertSparkline = ({
    closes, times, highlight, createdAt, width = 80, height = 32,
  }: {
    closes: number[]; times: number[]; highlight?: 'up' | 'down'; createdAt?: string; width?: number; height?: number;
  }) => {
    if (!closes || closes.length < 2 || !times || times.length < 2) return <span className="text-gray-400">—</span>;

    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const pad = range * 0.1;
    const adjMin = min - pad;
    const adjRange = (max + pad) - adjMin;
    const stepX = width / (closes.length - 1);

    const fullPath = closes.map((c, i) => {
      const x = i * stepX;
      const y = height - ((c - adjMin) / adjRange) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    let segPath = '';
    if (highlight && createdAt && times.length >= 2) {
      const targetTime = new Date(createdAt).getTime();
      const halfInterval = (times[1] - times[0]) / 2;
      let closestIdx = 0;
      let closestDiff = Infinity;
      for (let i = 0; i < times.length; i++) {
        const candleMid = times[i] + halfInterval;
        const diff = Math.abs(candleMid - targetTime);
        if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
      }
      const segEnd = Math.min(closestIdx + 1, closes.length - 1);
      const segStart = segEnd === closestIdx ? Math.max(0, closestIdx - 1) : closestIdx;
      const segPoints = [];
      for (let i = segStart; i <= segEnd; i++) {
        const x = i * stepX;
        const y = height - ((closes[i] - adjMin) / adjRange) * height;
        segPoints.push(`${i === segStart ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
      }
      segPath = segPoints.join(' ');
    }

    const hasHighlight = !!highlight && !!segPath;
    const baseColor = closes[closes.length - 1] >= closes[0] ? sparklineUp : sparklineDown;
    const hlColor = highlight === 'up' ? sparklineUp : sparklineDown;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
        <path d={fullPath} stroke={hasHighlight ? sparklineMuted : baseColor} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {segPath && <path d={segPath} stroke={hlColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading alerts...</div>
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
          placeholder="Search by pair, exchange, direction, or user..."
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
                  Direction
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Pair
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Exchange
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Change
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Multiplier
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Avg Volatility
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Price at Alert
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  User
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Sparkline
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <Badge
                      size="sm"
                      color={alert.direction === 'PUMP' ? 'success' : 'error'}
                    >
                      {alert.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {alert.base}/{alert.target}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {alert.exchange}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`font-medium ${
                      alert.changePct >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {alert.changePct >= 0 ? '+' : ''}{alert.changePct.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {alert.multiplier.toFixed(1)}x
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {alert.avgVolatility.toFixed(4)}%
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {alert.priceAtAlert.toFixed(8)}
                  </TableCell>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {alert.user.name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {alert.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <AlertSparkline
                      closes={sparklinesMap[alert.id]?.closes ?? []}
                      times={sparklinesMap[alert.id]?.times ?? []}
                      highlight={alert.direction === 'PUMP' ? 'up' : 'down'}
                      createdAt={alert.createdAt}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatDate(alert.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                    >
                      Delete
                    </button>
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
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} alerts
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