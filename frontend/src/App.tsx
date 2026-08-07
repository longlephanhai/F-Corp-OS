import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// ── Layouts ───────────────────────────────────────────────────────────────────
import LayoutAdmin from './layout/admin';
import LayoutHR from './layout/hr';
import UserLayout from './layout/user';

// ── Route Guard ───────────────────────────────────────────────────────────────
import ProtectedRoute from './components/auth/ProtectedRoute';

// ── Pages ─────────────────────────────────────────────────────────────────────
import LoginPage from './pages/auth/login';
import HRDashboard from './pages/hr/Dashboard';
import WalletAdmin from './pages/hr/WalletAdmin';
import ReviewConsole from './pages/hr/ReviewConsole';
import ErrorPage from './pages/result/error';
import NotFoundPage from './pages/result/not-found';

// ── Redux ─────────────────────────────────────────────────────────────────────
import { useAppDispatch } from './hooks/hooks';
import { fetchAccount } from './redux/account/accountSlice';

// ── Placeholder (replace with real pages when ready) ─────────────────────────
const PlaceholderPage = ({ title }: { title: string }) => (
    <div style={{ padding: 48, textAlign: 'center', color: '#8c8c8c' }}>
        <h2>{title}</h2>
        <p>Trang đang được phát triển.</p>
    </div>
);

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchAccount());
    }, []);

    const router = createBrowserRouter([
        // ── Root: send unauthenticated users to login ─────────────────────────
        {
            path: '/',
            element: <Navigate to="/login" replace />,
        },

        // ── Public ───────────────────────────────────────────────────────────
        {
            path: '/login',
            element: <LoginPage />,
        },
        {
            path: '/register',
            element: <PlaceholderPage title="Đăng ký" />,
        },

        // ── Branch 1 — Admin only (/admin/*) ─────────────────────────────────
        {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            errorElement: <ErrorPage />,
            children: [
                {
                    element: <LayoutAdmin />,
                    children: [
                        {
                            path: '/admin',
                            element: <PlaceholderPage title="Bảng điều khiển Admin" />,
                        },
                        {
                            path: '/admin/dashboard',
                            element: <PlaceholderPage title="Bảng điều khiển Admin" />,
                        },
                        {
                            path: '/admin/users',
                            element: <PlaceholderPage title="Quản lý Người dùng" />,
                        },
                    ],
                },
            ],
        },

        // ── Branch 2 — HR & Admin (/hr/*) ────────────────────────────────────
        // TODO: restore ProtectedRoute below when auth is ready
        // { element: <ProtectedRoute allowedRoles={['HR', 'ADMIN']} />, ...}
        {
            errorElement: <ErrorPage />,
            children: [
                {
                    element: <LayoutHR />,
                    children: [
                        {
                            path: '/hr/dashboard',
                            element: <HRDashboard />,
                        },
                        {
                            path: '/hr/wallet',
                            element: <WalletAdmin />,
                        },
                        {
                            path: '/hr/review',
                            element: <ReviewConsole />,
                        },
                        {
                            path: '/hr/bench',
                            element: <PlaceholderPage title="Dự báo Bench" />,
                        },
                    ],
                },
            ],
        },

        // ── Branch 3 — Regular Users (/home, /profile, /projects, /tasks) ────
        {
            element: <ProtectedRoute allowedRoles={['DEV', 'BA', 'TESTER', 'PM']} />,
            errorElement: <ErrorPage />,
            children: [
                {
                    element: <UserLayout />,
                    children: [
                        {
                            path: '/home',
                            element: <PlaceholderPage title="Trang chủ" />,
                        },
                        {
                            path: '/profile',
                            element: <PlaceholderPage title="Hồ sơ kỹ năng" />,
                        },
                        {
                            path: '/projects',
                            element: <PlaceholderPage title="Dự án" />,
                        },
                        {
                            path: '/tasks',
                            element: <PlaceholderPage title="Nhiệm vụ" />,
                        },
                    ],
                },
            ],
        },

        // ── Fallback ──────────────────────────────────────────────────────────
        {
            path: '/403',
            element: (
                <PlaceholderPage title="403 — Bạn không có quyền truy cập trang này." />
            ),
        },
        {
            path: '*',
            element: <NotFoundPage />,
        },
    ]);

    return <RouterProvider router={router} />;
}

export default App;
