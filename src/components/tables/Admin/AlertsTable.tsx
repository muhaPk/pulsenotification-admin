import { useState, useEffect, useRef } from "react";
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
import { AdminAlert, AdminAlertsResponse, AdminAlertsSparklinesResponse } from "../../../types/admin";
import { API_ADMIN_ALERTS, API_ADMIN_ALERT_BY_ID, API_ADMIN_ALERTS_SPARKLINES } from "../../../config/endpoints";
import { sparklineUp, sparklineDown, sparklineMuted } from "../../../config/colors";

const PAGE_SIZE = 50;

type SortColumn = 'direction' | 'pair' | 'exchange' | 'change' | 'multiplier' | 'volatility' | 'price' | 'user' | 'createdAt';

export default function AlertsTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [allAlerts, setAllAlerts] = useState<AdminAlert[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { error, loadData } = useGenericGetWeb();
  const { data: sparklinesData, loadData: loadSparklines } = useGenericGetWeb();
  const { uploadData } = useGenericSet();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1 text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  const loadSparklinesRef = useRef(loadSparklines);
  loadSparklinesRef.current = loadSparklines;

  const fetchPageRef = useRef((_pageNum: number, _append: boolean) => {});
  fetchPageRef.current = (pageNum: number, append: boolean) => {
    setLoadingMore(true);
    loadDataRef.current({
      api: API_ADMIN_ALERTS,
      params: { page: pageNum, limit: PAGE_SIZE, ...(debouncedSearchRef.current && { search: debouncedSearchRef.current }) },
      isRefreshing: true,
      dataCallback: (res: AdminAlertsResponse) => {
        setAllAlerts(prev => append ? [...prev, ...(res.data ?? [])] : (res.data ?? []));
        setHasMore(res.pagination ? res.pagination.page < res.pagination.totalPages : false);
        setLoadingMore(false);
      },
    });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setAllAlerts([]);
      setPage(1);
      setHasMore(true);
      setLoadingMore(false);
      setSearchKey(k => k + 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    fetchPageRef.current(1, false);
    loadSparklinesRef.current({ api: API_ADMIN_ALERTS_SPARKLINES });
  }, []);

  useEffect(() => {
    if (searchKey > 0) {
      fetchPageRef.current(1, false);
    }
  }, [searchKey]);

  useEffect(() => {
    if (page > 1) {
      fetchPageRef.current(page, true);
    }
  }, [page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(p => p + 1);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const refetch = () => {
    setAllAlerts([]);
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
    fetchPageRef.current(1, false);
    loadSparklinesRef.current({ api: API_ADMIN_ALERTS_SPARKLINES, params: { refresh: true }, isRefreshing: true });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAlerts.map(a => a.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} alert(s)?`)) return;
    let completed = 0;
    const total = selectedIds.size;
    for (const id of selectedIds) {
      uploadData({
        api: API_ADMIN_ALERT_BY_ID(id),
        method: 'delete',
        dataCallback: () => {
          completed++;
          if (completed >= total) {
            setSelectedIds(new Set());
            refetch();
          }
        },
      });
    }
  };

  const alerts = allAlerts;
  const sparklinesMap = (sparklinesData as AdminAlertsSparklinesResponse | null)?.data ?? {};

  const sortedAlerts = [...alerts].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    let cmp = 0;
    switch (sortColumn) {
      case 'direction':
        cmp = a.direction.localeCompare(b.direction);
        break;
      case 'pair':
        cmp = `${a.base}/${a.target}`.localeCompare(`${b.base}/${b.target}`);
        break;
      case 'exchange':
        cmp = a.exchange.localeCompare(b.exchange);
        break;
      case 'change':
        cmp = a.changePct - b.changePct;
        break;
      case 'multiplier':
        cmp = a.multiplier - b.multiplier;
        break;
      case 'volatility':
        cmp = a.avgVolatility - b.avgVolatility;
        break;
      case 'price':
        cmp = a.priceAtAlert - b.priceAtAlert;
        break;
      case 'user':
        cmp = a.user.name.localeCompare(b.user.name);
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return cmp * dir;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = Date.now();
    const diff = now - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return formatDate(dateString);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Search by pair, exchange, direction, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white flex-1"
          />
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20">
          Error: {error}
        </div>
      ) : sortedAlerts.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading alerts...</div>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={sortedAlerts.length > 0 && selectedIds.size === sortedAlerts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('direction')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Direction<SortIcon column="direction" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('pair')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Pair<SortIcon column="pair" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('exchange')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Exchange<SortIcon column="exchange" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('change')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Change<SortIcon column="change" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('multiplier')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Multiplier<SortIcon column="multiplier" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('volatility')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Avg Volatility<SortIcon column="volatility" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Price at Alert<SortIcon column="price" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('user')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    User<SortIcon column="user" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Sparkline
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Created At<SortIcon column="createdAt" />
                  </button>
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {sortedAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(alert.id)}
                      onChange={() => toggleSelect(alert.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <Badge
                      size="sm"
                      color={alert.direction === 'PUMP' ? 'success' : 'error'}
                    >
                      {alert.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <a
                      href={
                        alert.pairType === 'futures'
                          ? `https://www.binance.com/en/futures/${alert.base}${alert.target}`
                          : `https://www.binance.com/en/trade/${alert.base}_${alert.target}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      {alert.base}/{alert.target}
                    </a>
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
                    <span title={formatDate(alert.createdAt)}>
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      <div ref={sentinelRef} className="px-4 py-4">
        {loadingMore && (
          <div className="text-sm text-gray-500 text-center">Loading more alerts...</div>
        )}
        {!hasMore && sortedAlerts.length > 0 && (
          <div className="text-sm text-gray-500 text-center">All {sortedAlerts.length} alerts loaded</div>
        )}
      </div>
    </div>
  );
}
