// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Admin User interface
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  image?: string | null;
  bitcoinBalance: string;
  bitcoinBalanceBTC: number;
  withdrawalAddress?: string | null;
  emailVerified?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Address interface
export interface Address {
  id: string;
  user_id: string;
  address: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: BitcoinTransaction[];
}

// Bitcoin Transaction interface
export interface BitcoinTransaction {
  id: string;
  addressId: string;
  txHash: string;
  amount: string;
  amountBTC: number;
  confirmations: number;
  blockHeight?: number;
  timestamp: string;
  type: 'received' | 'sent';
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  updatedAt: string;
  address?: {
    id: string;
    address: string;
    user_id: string;
  };
}

// Transaction Log interface
export interface TransactionLog {
  id: string;
  userId: string;
  type: 'WITHDRAWAL' | 'DEPOSIT' | 'INVESTMENT';
  amount: string;
  amountBTC: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  address?: string;
  txHash?: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Dashboard Stats interface
export interface DashboardStats {
  users: {
    total: number;
  };
  addresses: {
    total: number;
    active: number;
    inactive: number;
  };
  bitcoinTransactions: {
    total: number;
    confirmed: number;
    pending: number;
  };
  transactionLogs: {
    deposits: number;
    withdrawals: number;
    investments: number;
  };
  totalBitcoinBalance: {
    satoshis: string;
    btc: number;
  };
}

// API Response interfaces
export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination: Pagination;
}

export interface AdminUserResponse {
  success: boolean;
  data: AdminUser;
}

export interface AdminAddressesResponse {
  success: boolean;
  data: Address[];
  pagination: Pagination;
}

export interface AdminAddressResponse {
  success: boolean;
  data: Address;
}

export interface AdminBitcoinTransactionsResponse {
  success: boolean;
  data: BitcoinTransaction[];
  pagination: Pagination;
}

export interface AdminBitcoinTransactionResponse {
  success: boolean;
  data: BitcoinTransaction;
}

export interface AdminTransactionLogsResponse {
  success: boolean;
  data: TransactionLog[];
  pagination: Pagination;
}

export interface AdminTransactionLogResponse {
  success: boolean;
  data: TransactionLog;
}

// Admin Pair interface
export interface AdminPair {
  id: string;
  userId: string;
  exchange: string;
  pair: string;
  base: string;
  target: string;
  type: 'spot' | 'futures';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminPairsResponse {
  success: boolean;
  data: AdminPair[];
  pagination: Pagination;
}

export interface PairVolatility {
  id: string;
  avgVolatility1m: number | null;
  change7d: number | null;
}

export interface AdminPairsVolatilityResponse {
  success: boolean;
  data: PairVolatility[];
}

export interface PairAlertCount {
  pairId: string;
  count: number;
}

export interface AdminPairsAlertsCountResponse {
  success: boolean;
  data: PairAlertCount[];
}

export interface AdminPairsSparklinesResponse {
  success: boolean;
  data: Record<string, number[]>;
}

export interface AlertSparklineData {
  closes: number[];
  times: number[];
}

export interface AdminAlertsSparklinesResponse {
  success: boolean;
  data: Record<string, AlertSparklineData>;
}

// Admin Alert interface
export interface AdminAlert {
  id: string;
  userId: string;
  pairId: string;
  exchange: string;
  base: string;
  target: string;
  pairType: string;
  changePct: number;
  multiplier: number;
  avgVolatility: number;
  priceAtAlert: number;
  direction: 'PUMP' | 'DUMP';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminAlertsResponse {
  success: boolean;
  data: AdminAlert[];
  pagination: Pagination;
}

export interface AdminDashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

// Backtest types
export interface BacktestStrategyConfig {
  strategyId: string;
  params: Record<string, number>;
}

export interface BacktestRiskConfig {
  stopLossPct: number;
  trailingActivationPct: number;
  trailingOffsetPct: number;
}

export interface BacktestPositionSizing {
  entries: number[];
  maxEntries: number;
}

export interface BacktestRequest {
  exchange: string;
  base: string;
  target: string;
  type: string;
  interval: string;
  startDate: string;
  endDate: string;
  strategy: BacktestStrategyConfig;
  riskManagement: BacktestRiskConfig;
  positionSizing: BacktestPositionSizing;
  initialCap: number;
  fees: number;
  name?: string;
}

export interface BacktestTrade {
  side: string;
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  quantity: number;
  pnl: number | null;
  pnlPercent: number | null;
  exitReason: string | null;
  entryCount: number;
  entries: { time: string; price: number }[];
}

export interface BacktestCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestResult {
  id: string;
  name?: string;
  exchange: string;
  base: string;
  target: string;
  type: string;
  interval: string;
  startDate: string;
  endDate: string;
  strategy: BacktestStrategyConfig;
  riskManagement: BacktestRiskConfig;
  positionSizing: BacktestPositionSizing;
  initialCap: number;
  finalCap: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  fees: number;
  trades: BacktestTrade[];
  equityCurve: { time: number; value: number }[];
  candles?: BacktestCandle[];
}

export interface BacktestRunResponse {
  success: boolean;
  data?: BacktestResult;
  message?: string;
}

export interface BacktestListResponse {
  success: boolean;
  data: BacktestResult[];
  message?: string;
}

export interface StrategyParamDef {
  key: string;
  label: string;
  type: 'number';
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  paramDefs: StrategyParamDef[];
}

// Trading types
export interface ExchangeApiKey {
  id: string;
  exchange: string;
  apiKey: string;
  isTestnet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BotConfig {
  id: string;
  userId: string;
  exchange: string;
  base: string;
  target: string;
  type: string;
  interval: string;
  strategyId: string;
  params: Record<string, any>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LiveTrade {
  id: string;
  userId: string;
  botId?: string;
  exchange: string;
  base: string;
  target: string;
  type: string;
  side: string;
  entryPrice: number;
  quantity: number;
  status: string;
  entries?: any;
  entryCount: number;
  exitPrice?: number;
  exitTime?: string;
  pnl?: number;
  pnlPercent?: number;
  exitReason?: string;
  entryTime: string;
}

export interface LivePosition {
  id: string;
  userId: string;
  botId?: string;
  exchange: string;
  base: string;
  target: string;
  type: string;
  side: string;
  entryPrice: number;
  quantity: number;
  stopLossPrice?: number;
  entryCount: number;
  highestPrice?: number;
  lowestPrice?: number;
  trailingActivated: boolean;
  trailStopPrice?: number;
  createdAt: string;
}
