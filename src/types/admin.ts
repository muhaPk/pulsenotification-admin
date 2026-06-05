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
