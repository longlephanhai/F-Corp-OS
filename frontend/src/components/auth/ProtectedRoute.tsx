/**
 * ProtectedRoute — Component bảo vệ route, chỉ cho phép truy cập khi đã xác thực.
 *
 * Luồng xử lý (3 trường hợp):
 *
 * ① Không có access_token trong localStorage
 *    → Chuyển hướng ngay về /login (replace để không lưu vào history stack).
 *
 * ② Có token nhưng Redux chưa có thông tin user (isAuthenticated = false, isLoading = true)
 *    → Trường hợp này xảy ra khi user F5 (refresh trang).
 *    → App.tsx đã dispatch fetchAccount() ở useEffect root, interceptor sẽ tự gắn token.
 *    → Hiển thị màn hình loading toàn trang trong khi chờ API /auth/account phản hồi.
 *
 * ③ Có token VÀ Redux đã có thông tin user (isAuthenticated = true)
 *    → Render <Outlet /> — cho phép render các route con bình thường.
 *
 * Trường hợp đặc biệt: Có token nhưng isLoading = false và isAuthenticated = false
 *    → Token hết hạn / không hợp lệ, interceptor đã xử lý refresh thất bại
 *    → Redirect về /login.
 */

import { Flex, Spin, Typography } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../hooks/hooks';

const { Text } = Typography;

// ─── Màn hình loading toàn trang ──────────────────────────────────────────────
// Hiển thị khi có token nhưng Redux chưa khôi phục session (đang chờ fetchAccount).
const FullScreenLoading = () => (
    <Flex
        vertical
        align="center"
        justify="center"
        gap={16}
        style={{ minHeight: '100vh', background: '#f0f2f5' }}
    >
        <Spin size="large" />
        <Text type="secondary">Đang xác thực phiên đăng nhập...</Text>
    </Flex>
);

// ─── ProtectedRoute ────────────────────────────────────────────────────────────
const ProtectedRoute = () => {
    // Đọc trạng thái xác thực từ Redux store
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    /**
     * isLoading trong accountSlice:
     * - true  → fetchAccount đang pending (App.tsx dispatch khi khởi động)
     * - false → fetchAccount đã fulfilled hoặc rejected
     * Dùng để phân biệt "đang tải" vs "xác thực thất bại".
     */
    const isLoading = useAppSelector(state => state.account.isLoading);

    // Kiểm tra token trong localStorage — đây là điều kiện sơ bộ nhanh nhất
    const hasToken = Boolean(localStorage.getItem('access_token'));

    // ── Trường hợp ①: Không có token → redirect ngay lập tức ──────────────────
    if (!hasToken) {
        return <Navigate to="/login" replace />;
    }

    // ── Trường hợp ②: Có token, Redux đang khôi phục session → hiển thị loading ─
    // Điều kiện: isLoading = true (fetchAccount chưa hoàn thành)
    if (isLoading) {
        return <FullScreenLoading />;
    }

    // ── Trường hợp đặc biệt: Token tồn tại nhưng fetchAccount thất bại ─────────
    // isLoading = false + isAuthenticated = false = token không còn hợp lệ
    // (interceptor đã thử refresh nhưng thất bại → setRefreshTokenAction đã dispatch)
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ── Trường hợp ③: Đã xác thực → render route con thông qua <Outlet /> ──────
    return <Outlet />;
};

export default ProtectedRoute;
