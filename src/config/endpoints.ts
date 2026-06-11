// Auth endpoints
export const API_LOGIN = '/auth/login';
export const API_SIGNUP = '/auth/register';
export const API_REFRESH_TOKEN = '/auth/refresh-token';
export const API_FORGOT_PASSWORD = '/auth/forgot-password';
export const API_RESET_PASSWORD = '/auth/reset-password';

// Admin endpoints
export const API_ADMIN_DASHBOARD_STATS = '/admin/dashboard/stats';
export const API_ADMIN_USERS = '/admin/users';
export const API_ADMIN_USER_BY_ID = (id: string) => `/admin/users/${id}`;
export const API_ADMIN_PAIRS = '/admin/pairs';
export const API_ADMIN_PAIRS_VOLATILITY = '/admin/pairs/volatility';
export const API_ADMIN_PAIRS_ALERTS_COUNT = '/admin/pairs/alerts-count';
export const API_ADMIN_PAIRS_SPARKLINES = '/admin/pairs/sparklines';
export const API_ADMIN_ADDRESSES = '/admin/addresses';
export const API_ADMIN_ADDRESS_BY_ID = (id: string) => `/admin/addresses/${id}`;
export const API_ADMIN_BITCOIN_TRANSACTIONS = '/admin/bitcoin-transactions';
export const API_ADMIN_BITCOIN_TRANSACTION_BY_ID = (id: string) => `/admin/bitcoin-transactions/${id}`;
export const API_ADMIN_TRANSACTION_LOGS = '/admin/transaction-logs';
export const API_ADMIN_TRANSACTION_LOG_BY_ID = (id: string) => `/admin/transaction-logs/${id}`;

// Admin Alerts endpoint
export const API_ADMIN_ALERTS = '/admin/alerts';
export const API_ADMIN_ALERT_BY_ID = (id: string) => `/admin/alerts/${id}`;
export const API_ADMIN_ALERTS_SPARKLINES = '/admin/alerts/sparklines';

// Settings endpoints
export const API_SETTINGS = '/settings';

// Monitor endpoints
export const API_ADMIN_MONITOR_STATS = '/admin/monitor/stats';
export const API_ADMIN_MONITOR_PERFORMANCE = '/admin/monitor/performance';
