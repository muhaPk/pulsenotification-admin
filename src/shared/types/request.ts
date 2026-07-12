export interface LoadDataParams {
  api: string;
  isExternal?: boolean;
  params?: any;
  method?: string;
  isRefreshing?: boolean;
  headers?: Record<string, string>;
  dataCallback?: (data: any) => void;
  loader?: (loading: boolean) => void;
}

export interface TGenericGet {
  loading: boolean;
  refreshing: boolean;
  error: any;
  data: any;
  loadData: (options: LoadDataParams) => Promise<void>;
}
