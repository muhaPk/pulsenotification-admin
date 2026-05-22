import axios from "axios";
import { useAuthStore } from '../store/auth.store.simple';
import { API_CONFIG } from '../config/config';

type TParams = {
  api: string;
  methodName?: string;
  loader?: (loading: boolean) => void;
  successHandler?: Function;
  errorHandler?: Function;
  params?: Object;
  data?: Object;
  isExternal?: boolean;
  type?: "form-data";
  headers?: {
    [key: string]: string;
  };
};

interface Params {
  baseURL: string;
  method?: string;
}

const postConfig: Params = {
  baseURL: API_CONFIG.BASE_URL,
};

const getConfig: Params = {
  baseURL: API_CONFIG.BASE_URL,
  method: "get",
};

export function useAxios() {
  const { token, clearAuth } = useAuthStore();

  const get = async (options: TParams): Promise<any> => {
    const {
      api,
      loader,
      successHandler,
      isExternal,
      errorHandler,
      params,
      headers,
    } = options;

    if (loader) loader(true);

    try {
      const response = await axios({
        ...getConfig,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        url: isExternal ? api : `${getConfig.baseURL}${api}`,
        params,
      });

      const { data } = response;
      if (successHandler) successHandler(data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        clearAuth();
        window.location.href = '/signin';
      } else if (errorHandler) {
        errorHandler(error?.response?.data || "An unknown error occurred");
      }
    } finally {
      if (loader) loader(false);
    }
  };

  const set = async (options: TParams): Promise<any> => {
    const {
      api,
      loader,
      successHandler,
      errorHandler,
      params,
      data,
      methodName,
      type,
      headers,
    } = options;

    if (loader) loader(true);

    try {
      // Build headers carefully for FormData
      const requestHeaders: any = {};
      
      // For FormData, explicitly set the Content-Type to multipart/form-data
      if (type === "form-data") {
        requestHeaders["Content-Type"] = "multipart/form-data";
      } else {
        requestHeaders["Content-Type"] = "application/json";
      }
      
      // Add authorization if available
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      
      // Add any additional headers
      Object.assign(requestHeaders, headers);

      const response = await axios({
        ...postConfig,
        headers: requestHeaders,
        method: methodName,
        url: `${postConfig.baseURL}${api}`,
        data,
        params,
        timeout: 300000, // 5 minute timeout for uploads
      });

      if (successHandler) successHandler(response.data);
    } catch (error: any) {
      console.log('useAxios error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      let errorMessage = "An unexpected error occurred";
      
      if (error?.response?.status === 401) {
        clearAuth();
        window.location.href = '/signin';
        errorMessage = "Unauthorized";
      } else if (error?.response?.status === 413) {
        errorMessage = "File too large. Please select a smaller file.";
      } else if (error?.response?.status) {
        // Handle other HTTP errors
        errorMessage = error?.response?.data?.message || `Server error: ${error.response.status}`;
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = "Upload timed out. Please try again with a smaller file or check your connection.";
      } else if (error?.message?.includes('Network Error')) {
        errorMessage = "Network connection lost. Please check your internet connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (errorHandler) {
        errorHandler({
          message: errorMessage,
          statusCode: error?.response?.status,
          originalError: error
        });
      }
    } finally {
      if (loader) loader(false);
    }
  };

  return { get, set };
}
