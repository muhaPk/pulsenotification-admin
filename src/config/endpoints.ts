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

// Backtest endpoints
export const API_ADMIN_BACKTEST_RUN = '/admin/backtest/run';
export const API_ADMIN_BACKTEST_SAVE = '/admin/backtest/save';
export const API_ADMIN_BACKTEST_LIST = '/admin/backtest';
export const API_ADMIN_BACKTEST_BY_ID = (id: string) => `/admin/backtest/${id}`;
export const API_ADMIN_BACKTEST_CANDLES = '/admin/backtest/candles';

// Trading endpoints
export const API_ADMIN_TRADING_API_KEYS = '/admin/trading/api-keys';
export const API_ADMIN_TRADING_API_KEY_BY_ID = (id: string) => `/admin/trading/api-keys/${id}`;
export const API_ADMIN_TRADING_BALANCE = '/admin/trading/balance';
export const API_ADMIN_TRADING_ORDERS = '/admin/trading/orders';
export const API_ADMIN_TRADING_ORDER_BY_ID = (orderId: string) => `/admin/trading/orders/${orderId}`;
export const API_ADMIN_TRADING_BOTS = '/admin/trading/bots';
export const API_ADMIN_TRADING_BOT_BY_ID = (id: string) => `/admin/trading/bots/${id}`;
export const API_ADMIN_TRADING_TRADES = '/admin/trading/trades';
export const API_ADMIN_TRADING_POSITIONS = '/admin/trading/positions';
