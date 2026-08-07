import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAppSelector } from '../../hooks/hooks';

/** All role names recognised by the system. Extend as new roles are added. */
export type RoleName = 'ADMIN' | 'HR' | 'DEV' | 'BA' | 'TESTER' | 'PM';

interface IProps {
    /** Roles that are permitted to access the child routes. */
    allowedRoles: RoleName[];
}

/**
 * Route guard that:
 *  1. Shows a full-screen spinner while the account is being fetched.
 *  2. Redirects unauthenticated users to /login.
 *  3. Redirects authenticated users whose role is not in allowedRoles to /403.
 *  4. Renders <Outlet /> for authorised users.
 */
const ProtectedRoute = ({ allowedRoles }: IProps) => {
    const { isLoading, isAuthenticated, user } = useAppSelector(
        (state) => state.account
    );

    // ── 1. Still fetching session ──────────────────────────────────────────
    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    // ── 2. Not logged in ───────────────────────────────────────────────────
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ── 3. Wrong role ──────────────────────────────────────────────────────
    const userRole = user.role.name as RoleName;
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/403" replace />;
    }

    // ── 4. Authorised — render child routes via <Outlet /> ─────────────────
    return <Outlet />;
};

export default ProtectedRoute;
