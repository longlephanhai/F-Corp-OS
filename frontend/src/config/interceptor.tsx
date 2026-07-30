import axios from "axios";
import { Mutex } from "async-mutex";
import { setRefreshTokenAction } from "../redux/account/accountSlice";

/**
 * Lazy getter để lấy Redux store — phá vòng circular dependency.
 *
 * Chuỗi import gây lỗi (circular):
 *   interceptor.tsx → store.ts → accountSlice.ts → api/index.tsx → interceptor.tsx
 *
 * Nguyên tắc fix:
 * - `import type` chỉ tồn tại ở compile-time (TypeScript), KHÔNG tạo runtime import
 *   → an toàn để dùng ở top-level chỉ với mục đích lấy kiểu.
 * - `require()` bên trong hàm chạy ở runtime (sau khi mọi module đã init xong)
 *   → không còn "before initialization" error.
 */
import type { store as StoreType } from "../redux/store";

const getStore = (): typeof StoreType => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("../redux/store") as { store: typeof StoreType }).store;
};


interface AccessTokenResponse {
  access_token: string;
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true
});

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';

const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    const res = await instance.get<IBackendRes<AccessTokenResponse>>('/api/v1/auth/refresh');
    if (res && res.data && res.data.data) return res.data.data.access_token;
    else return null;
  });
};

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  if (typeof window !== "undefined" && window && window.localStorage && window.localStorage.getItem('access_token')) {
    config.headers.Authorization = 'Bearer ' + window.localStorage.getItem('access_token');
  }
  if (!config.headers.Accept && config.headers["Content-Type"]) {
    config.headers.Accept = "application/json";
    config.headers["Content-Type"] = "application/json; charset=utf-8";
  }
  // Do something before request is sent
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    if (error.config && error.response
      && +error.response.status === 401
      && error.config.url !== '/api/v1/auth/login'
      && !error.config.headers[NO_RETRY_HEADER]
    ) {
      const access_token = await handleRefreshToken();
      error.config.headers[NO_RETRY_HEADER] = 'true'
      if (access_token) {
        error.config.headers['Authorization'] = `Bearer ${access_token}`;
        localStorage.setItem('access_token', access_token)
        return instance.request(error.config);
      }
    }

    if (
      error.config && error.response
      && +error.response.status === 400
      && error.config.url === '/api/v1/auth/refresh'
      && location.pathname.startsWith("/admin")
    ) {
      const message = error?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng login.";

      /**
       * Xóa token khỏi localStorage khi refresh thất bại.
       *
       * Bug cũ: Không xóa token → ProtectedRoute thấy hasToken=true
       * nhưng isAuthenticated=false và isLoading mãi không chuyển false
       * → spinner vô tận, user bị kẹt không thể vào /login.
       *
       * Fix: Xóa token ngay tại đây → lần re-render tiếp theo của
       * ProtectedRoute sẽ thấy hasToken=false → redirect /login đúng cách.
       */
      localStorage.removeItem('access_token');

      // Lấy store qua lazy getter để tránh circular dependency
      getStore().dispatch(setRefreshTokenAction({ status: true, message }));
    }

    return error?.response?.data ?? Promise.reject(error);
  }
);

export default instance;