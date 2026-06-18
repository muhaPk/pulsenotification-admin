import React, { useState, useEffect, useRef } from "react";
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
  AdminPair,
  AdminPairsResponse,
  AdminPairsVolatilityResponse,
  AdminPairsAlertsCountResponse,
  AdminPairsSparklinesResponse,
} from "../../../types/admin";
import {
  API_ADMIN_PAIRS,
  API_ADMIN_PAIRS_VOLATILITY,
  API_ADMIN_PAIRS_ALERTS_COUNT,
  API_ADMIN_PAIRS_SPARKLINES,
} from "../../../config/endpoints";
import { sparklineUp, sparklineDown } from "../../../config/colors";

type SortColumn = 'pair' | 'exchange' | 'type' | 'createdBy' | 'createdAt' | 'volatility1m' | 'change7d' | 'alerts';

const PAGE_SIZE = 50;

export default function PairsTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [allPairs, setAllPairs] = useState<AdminPair[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
  const { data, loading, error, loadData } = useGenericGetWeb();
  const { data: volData, loadData: loadVol } = useGenericGetWeb();
  const { data: alertsData, loadData: loadAlerts } = useGenericGetWeb();
  const { data: sparklinesData, loadData: loadSparklines } = useGenericGetWeb();

  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  const loadVolRef = useRef(loadVol);
  loadVolRef.current = loadVol;
  const loadAlertsRef = useRef(loadAlerts);
  loadAlertsRef.current = loadAlerts;
  const loadSparklinesRef = useRef(loadSparklines);
  loadSparklinesRef.current = loadSparklines;

  const fetchPageRef = useRef((pageNum: number, append: boolean) => {});
  fetchPageRef.current = (pageNum: number, append: boolean) => {
    setLoadingMore(true);
    loadDataRef.current({
      api: API_ADMIN_PAIRS,
      params: { page: pageNum, limit: PAGE_SIZE, ...(debouncedSearchRef.current && { search: debouncedSearchRef.current }) },
      isRefreshing: true,
      dataCallback: (res: AdminPairsResponse) => {
        setAllPairs(prev => append ? [...prev, ...(res.data ?? [])] : (res.data ?? []));
        setHasMore(res.pagination ? res.pagination.page < res.pagination.totalPages : false);
        setLoadingMore(false);
      },
    });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setAllPairs([]);
      setPage(1);
      setHasMore(true);
      setLoadingMore(false);
      setSearchKey(k => k + 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    fetchPageRef.current(1, false);
    loadVolRef.current({ api: API_ADMIN_PAIRS_VOLATILITY });
    loadAlertsRef.current({ api: API_ADMIN_PAIRS_ALERTS_COUNT });
    loadSparklinesRef.current({ api: API_ADMIN_PAIRS_SPARKLINES, params: { interval: '4h', limit: 42 } });
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
    setAllPairs([]);
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
    fetchPageRef.current(1, false);
    loadVolRef.current({ api: API_ADMIN_PAIRS_VOLATILITY, isRefreshing: true });
    loadAlertsRef.current({ api: API_ADMIN_PAIRS_ALERTS_COUNT, isRefreshing: true });
    loadSparklinesRef.current({ api: API_ADMIN_PAIRS_SPARKLINES, params: { interval: '4h', limit: 42, refresh: true }, isRefreshing: true });
  };
  const pairs = allPairs;
  const volatilityMap = new Map(
    (volData as AdminPairsVolatilityResponse | null)?.data?.map((v) => [v.id, v.avgVolatility1m]) ?? [],
  );
  const change7dMap = new Map(
    (volData as AdminPairsVolatilityResponse | null)?.data?.map((v) => [v.id, v.change7d]) ?? [],
  );
  const alertsCountMap = new Map(
    (alertsData as AdminPairsAlertsCountResponse | null)?.data?.map((a) => [a.pairId, a.count]) ?? [],
  );
  const sparklinesMap = (sparklinesData as AdminPairsSparklinesResponse | null)?.data ?? {};

  const sortedPairs = [...pairs].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    let cmp = 0;
    switch (sortColumn) {
      case 'pair':
        cmp = `${a.base}/${a.target}`.localeCompare(`${b.base}/${b.target}`);
        break;
      case 'exchange':
        cmp = a.exchange.localeCompare(b.exchange);
        break;
      case 'type':
        cmp = a.type.localeCompare(b.type);
        break;
      case 'createdBy':
        cmp = a.user.name.localeCompare(b.user.name);
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'volatility1m':
        cmp = (volatilityMap.get(a.id) ?? 0) - (volatilityMap.get(b.id) ?? 0);
        break;
      case 'change7d':
        cmp = (change7dMap.get(a.id) ?? 0) - (change7dMap.get(b.id) ?? 0);
        break;
      case 'alerts':
        cmp = (alertsCountMap.get(a.id) ?? 0) - (alertsCountMap.get(b.id) ?? 0);
        break;
    }
    return cmp * dir;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SparklineChart = ({ closes, change7d, width = 80, height = 28 }: { closes: number[]; change7d?: number | null; width?: number; height?: number }) => {
    if (!closes || closes.length < 2) return <span className="text-gray-400">—</span>;
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const pad = range * 0.1;
    const adjMin = min - pad;
    const adjRange = (max + pad) - adjMin;
    const stepX = width / (closes.length - 1);
    const color = change7d !== undefined && change7d !== null
      ? (change7d >= 0 ? sparklineUp : sparklineDown)
      : (closes[closes.length - 1] >= closes[0] ? sparklineUp : sparklineDown);
    const points = closes.map((c, i) => {
      const x = i * stepX;
      const y = height - ((c - adjMin) / adjRange) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
        <path d={points} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

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

      {error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20">
          Error: {error}
        </div>
      ) : allPairs.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading pairs...</div>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
              <TableRow>
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
                  <button onClick={() => handleSort('type')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Type<SortIcon column="type" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('createdBy')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Created By<SortIcon column="createdBy" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                    Created At<SortIcon column="createdAt" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Sparkline
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('volatility1m')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ml-auto">
                    Avg Volatility 1m<SortIcon column="volatility1m" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('change7d')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ml-auto">
                    7d Change<SortIcon column="change7d" />
                  </button>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  <button onClick={() => handleSort('alerts')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ml-auto">
                    Alerts<SortIcon column="alerts" />
                  </button>
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {sortedPairs.map((pair) => (
                <TableRow key={pair.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <a
                      href={
                        pair.type === 'futures'
                          ? `https://www.binance.com/en/futures/${pair.base}${pair.target}`
                          : `https://www.binance.com/en/trade/${pair.base}_${pair.target}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      {pair.base}/{pair.target}
                    </a>
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
                  <TableCell className="px-4 py-3 text-start">
                    <SparklineChart closes={sparklinesMap[pair.id] ?? []} change7d={change7dMap.get(pair.id)} />
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
                    {change7dMap.has(pair.id) && change7dMap.get(pair.id) !== null ? (
                      <span className={`font-medium ${
                        (change7dMap.get(pair.id) ?? 0) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(change7dMap.get(pair.id) ?? 0) >= 0 ? '+' : ''}{change7dMap.get(pair.id)!.toFixed(2)}%
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
      )}

      <div ref={sentinelRef} className="px-4 py-4">
        {loadingMore && (
          <div className="text-sm text-gray-500 text-center">Loading more pairs...</div>
        )}
        {!hasMore && allPairs.length > 0 && (
          <div className="text-sm text-gray-500 text-center">All {allPairs.length} pairs loaded</div>
        )}
      </div>
    </div>
  );
}
