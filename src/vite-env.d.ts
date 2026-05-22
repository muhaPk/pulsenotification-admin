/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_DEV_HOST?: string
  readonly VITE_DEV_PORT?: string
  readonly VITE_API_BASE_URL_STAGING?: string
  readonly VITE_API_BASE_URL_PROD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}