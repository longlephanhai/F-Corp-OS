/**
 * App.tsx — Khai báo router chính của ứng dụng.
 *
 * Thay đổi so với phiên bản trước:
 * - Thêm route wrapper không có path (layout route) bọc ngoài /admin.
 *   React Router v6 gọi đây là "Pathless Layout Route" — pattern chính thức
 *   để áp dụng logic bảo vệ (ProtectedRoute) cho một nhóm route mà không
 *   thay đổi URL segment.
 * - ProtectedRoute render <Outlet /> khi xác thực thành công, cho phép
 *   LayoutAdmin được render như route con bình thường.
 * - fetchAccount vẫn được dispatch tại root App để đồng bộ session khi F5.
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from './hooks/hooks';
import { fetchAccount } from './redux/account/accountSlice';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LayoutAdmin from './layout/admin';
import LoginPage from './pages/auth/login';
import ErrorPage from './pages/result/error';
import NotFoundPage from './pages/result/not-found';

function App() {
  const dispatch = useAppDispatch();

  /**
   * Gọi fetchAccount ngay khi App mount để khôi phục session từ server.
   * - Interceptor sẽ tự đính token từ localStorage vào header request.
   * - accountSlice.fetchAccount fulfilled → isAuthenticated = true.
   * - accountSlice.fetchAccount rejected → isAuthenticated = false, isLoading = false.
   * ProtectedRoute đọc isLoading để quyết định hiển thị spinner hay redirect.
   */
  useEffect(() => {
    dispatch(fetchAccount());
  }, []);

  const router = createBrowserRouter([
    {
      // Route trang chủ — chưa implement, placeholder
      path: '/',
      element: <div>Home</div>,
    },

    /**
     * Pathless Layout Route — bọc ngoài /admin (và các route admin khác sau này).
     *
     * Không có `path` → không tạo URL segment mới, chỉ inject logic bảo vệ.
     * ProtectedRoute sẽ:
     *   - Redirect /login nếu chưa xác thực.
     *   - Hiển thị loading nếu đang chờ fetchAccount.
     *   - Render <Outlet /> nếu đã xác thực → LayoutAdmin được render.
     *
     * Để thêm route admin khác (ví dụ /admin/users), chỉ cần thêm vào `children`:
     *   { path: '/admin/users', element: <UsersPage /> }
     */
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/admin',
          element: <LayoutAdmin />,
          errorElement: <ErrorPage />,
        },
        // Thêm các route admin khác vào đây khi cần, ví dụ:
        // { path: '/admin/users', element: <UsersPage /> },
        // { path: '/admin/settings', element: <SettingsPage /> },
      ],
    },

    {
      // Route đăng nhập — công khai, không cần xác thực
      path: '/login',
      element: <LoginPage />,
    },
    {
      // Route đăng ký — placeholder, công khai
      path: '/register',
      element: <div>Register</div>,
    },
    {
      // Catch-all — trả về trang 404 cho mọi route không khớp
      path: '*',
      element: <NotFoundPage />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
