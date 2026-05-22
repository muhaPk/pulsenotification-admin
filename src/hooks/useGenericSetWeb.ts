import { useState } from "react";
import { useAxios } from "./useAxiosWeb";

export interface HTTPErrorType {
  message: string;
  statusCode?: number;
  originalError?: any;
}

export interface UploadDataParams {
  api: string;
  id?: string;
  data?: any;
  params?: any;
  method?: string;
  type?: "form-data";
  dataCallback?: (data: any) => void;
  headers?: { [key: string]: string };
  loader?: (loading: boolean) => void;
}

export const useGenericSet = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<HTTPErrorType | null>(null);
  const [success, setSuccess] = useState(false);
  const [resData, setResData] = useState<any>({});
  const { set } = useAxios();

  const showErrorToast = (message: string | object): void => {
    const formattedMessage =
      typeof message === "string" ? message : JSON.stringify(message);

    // Simple alert for web - you can replace with a proper toast library
    alert(formattedMessage);
  };

  const uploadData = async (options: UploadDataParams) => {
    const {
      api,
      id,
      data,
      params,
      method,
      type,
      dataCallback,
      headers,
      loader,
    } = options;

    setError(null);
    setSuccess(false);
    
    await set({
      api: id ? `${api}${id}` : api,
      errorHandler: (res: HTTPErrorType) => {
        console.log("useGenericSet Error", res);
        if (res?.statusCode === 400) showErrorToast(res?.message as string);
        setError(res);
        setSuccess(false);
      },
      successHandler: (res: any) => {
        if (dataCallback) {
          dataCallback(res);
        } else {
          setResData(res);
        }
        setSuccess(true);
      },
      methodName: method || "post",
      params,
      data,
      type,
      loader: loader ? loader : setSubmitting,
      headers,
    });
  };

  const updateErrors = (err: HTTPErrorType) => {
    setError(err ? { ...error, ...err } : null);
  };

  return {
    submitting,
    error,
    resData,
    success,
    uploadData,
    updateErrors,
    setError,
  };
};

export default useGenericSet;
