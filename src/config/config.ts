// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Auth configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_data',
};

// Environment configuration
// export const ENV_CONFIG = {
//   NODE_ENV: import.meta.env.MODE,
//   IS_DEVELOPMENT: import.meta.env.DEV,
//   IS_PRODUCTION: import.meta.env.PROD,
// };
