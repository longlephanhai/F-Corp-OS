import axios from "axios";
import { message as antdMessage } from "antd";
import { Mutex } from "async-mutex";

import { store } from "../redux/store";

import { setRefreshTokenAction } from "../redux/account/accountSlice";

// ==========================================
// CUSTOM AXIOS CONFIG
//
// Những request đã tự xử lý lỗi ở UI
// có thể tắt global toast bằng:
//
// {
//   suppressGlobalErrorToast: true
// }
// ==========================================

declare module "axios" {
  export interface AxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    suppressGlobalErrorToast?: boolean;
  }
}

interface AccessTokenResponse {
  access_token: string;
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,

  withCredentials: true,
});

const mutex = new Mutex();

const NO_RETRY_HEADER = "x-no-retry";

// ==========================================
// GLOBAL ERROR TOAST DEDUPE
//
// Nhiều request có thể cùng fail một lúc.
// Không spam 5-10 toast giống nhau.
// ==========================================

let lastErrorMessage = "";
let lastErrorAt = 0;

const GLOBAL_ERROR_DEDUPE_MS = 1500;

// ==========================================
// EXTRACT BACKEND ERROR MESSAGE
//
// Hỗ trợ các response dạng:
//
// { message: "..." }
//
// { message: ["...", "..."] }
//
// { error: { message: "..." } }
//
// { error: "..." }
// ==========================================

const extractApiErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  const backendMessage = data?.message ?? data?.error?.message ?? data?.error;

  if (Array.isArray(backendMessage)) {
    const joined = backendMessage.filter(Boolean).join(" • ");

    if (joined) {
      return joined;
    }
  }

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage.trim();
  }

  const status = Number(error?.response?.status);

  // ========================================
  // FALLBACK MESSAGE BY STATUS
  // ========================================

  if (status === 400) {
    return "Dữ liệu gửi lên không hợp lệ.";
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (status === 404) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }

  if (status === 409) {
    return "Không thể thực hiện do trạng thái dữ liệu hiện tại.";
  }

  if (status >= 500) {
    return "Máy chủ gặp lỗi. Vui lòng thử lại.";
  }

  // ========================================
  // NETWORK ERROR
  // ========================================

  if (!error?.response) {
    return "Không thể kết nối tới máy chủ.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
};

// ==========================================
// SHOW GLOBAL ERROR
// ==========================================

const showGlobalApiError = (error: any) => {
  if (error?.config?.suppressGlobalErrorToast) {
    return;
  }

  const status = error?.response?.status;

  const errorMessage = extractApiErrorMessage(error);

  // Trong môi trường dev hiện status
  // để test API/debug nhanh hơn.
  const displayMessage =
    import.meta.env.DEV && status
      ? `[${status}] ${errorMessage}`
      : errorMessage;

  const now = Date.now();

  // ========================================
  // AVOID DUPLICATE TOAST
  // ========================================

  if (
    displayMessage === lastErrorMessage &&
    now - lastErrorAt < GLOBAL_ERROR_DEDUPE_MS
  ) {
    return;
  }

  lastErrorMessage = displayMessage;

  lastErrorAt = now;

  antdMessage.error({
    content: displayMessage,

    duration: 5,
  });
};

// ==========================================
// REFRESH TOKEN
// ==========================================

const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    const res = await instance.get<AccessTokenResponse>("/auth/refresh");

    if (res && res.data) {
      return res.data.access_token;
    }

    return null;
  });
};

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

instance.interceptors.request.use(
  function (config) {
    if (
      typeof window !== "undefined" &&
      window &&
      window.localStorage &&
      window.localStorage.getItem("access_token")
    ) {
      config.headers.Authorization =
        "Bearer " + window.localStorage.getItem("access_token");
    }

    if (!config.headers.Accept && config.headers["Content-Type"]) {
      config.headers.Accept = "application/json";

      config.headers["Content-Type"] = "application/json; charset=utf-8";
    }

    return config;
  },

  function (error) {
    showGlobalApiError(error);

    return Promise.reject(error);
  },
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

instance.interceptors.response.use(
  (res) => res.data,

  async (error) => {
    const requestUrl = String(error?.config?.url ?? "");

    const isLoginRequest = requestUrl.includes("/auth/login");

    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    // ========================================
    // 401 → TRY REFRESH TOKEN FIRST
    //
    // Không hiện lỗi ngay nếu refresh thành
    // công, vì user thực tế không bị lỗi.
    // ========================================

    if (
      error.config &&
      error.response &&
      Number(error.response.status) === 401 &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !error.config.headers[NO_RETRY_HEADER]
    ) {
      const accessToken = await handleRefreshToken();

      error.config.headers[NO_RETRY_HEADER] = "true";

      if (accessToken) {
        error.config.headers["Authorization"] = `Bearer ${accessToken}`;

        localStorage.setItem("access_token", accessToken);

        return instance.request(error.config);
      }
    }

    // ========================================
    // REFRESH TOKEN FAILED
    // ========================================

    if (
      error.config &&
      error.response &&
      Number(error.response.status) === 400 &&
      isRefreshRequest &&
      location.pathname.startsWith("/admin")
    ) {
      const message =
        error?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng login.";

      store.dispatch(
        setRefreshTokenAction({
          status: true,

          message,
        }),
      );
    }

    // ========================================
    // GLOBAL API ERROR TOAST
    // ========================================

    showGlobalApiError(error);

    // Vẫn reject để component có thể xử lý
    // business riêng nếu cần.
    return Promise.reject(error?.response?.data ?? error);
  },
);

export default instance;
