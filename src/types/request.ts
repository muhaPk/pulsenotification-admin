import { AxiosHeaderValue } from "axios";

export type ContentTypes = "form-data";

export type LoadDataParams = {
  api: string;
  params?: any;
  isExternal?: boolean;
  method?: string;
  isRefreshing?: boolean;
  dataCallback?(data: any): void;
  loader?(loading: boolean): void;
  headers?: {
    [key: string]: AxiosHeaderValue;
  };
};

export type TGenericGet = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  data: any;
  loadData(options: LoadDataParams): Promise<void>;
};

export type UploadDataParams = {
  api: string;
  params?: any;
  data?: any;
  id?: string;
  type?: ContentTypes;
  method?: string;
  dataCallback?(data: any): void;
  loader?(loading: boolean): void;
  headers?: {
    [key: string]: AxiosHeaderValue;
  };
};
