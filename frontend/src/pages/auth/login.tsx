
import {
    Alert,
    Button,
    Card,
    Divider,
    Flex,
    Form,
    Input,
    message,
    Space,
    theme,
    Typography,
} from 'antd';
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callApiLogin } from '../../api';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { setUserLoginInfo } from '../../redux/account/accountSlice';

const { Title, Text, Link } = Typography;

// ─── Logo Component ────────────────────────────────────────────────────────────
// Placeholder logo — thay nội dung bên trong bằng <img src="..."> khi có file logo thật.
// Dùng <Flex> thay <div style={{display:'flex'}}> theo AntD v5 convention.
const CompanyLogo = () => {
    const { token } = theme.useToken();

    return (
        <Flex justify="center">
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: token.borderRadiusLG,
                    // Gradient xanh primary — tạo cảm giác tin cậy, chuyên nghiệp cho B2B
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // Shadow màu primary giúp logo nổi bật mà không cứng
                    boxShadow: `0 6px 16px ${token.colorPrimaryBorder}`,
                }}
            >
                <SafetyOutlined style={{ fontSize: 26, color: token.colorWhite }} />
            </div>
        </Flex>
    );
};

// ─── LoginPage ─────────────────────────────────────────────────────────────────
const LoginPage = () => {
    const { token } = theme.useToken();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    // Chuyển hướng ngay nếu người dùng đã đăng nhập trước đó
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin');
        }
    }, [isAuthenticated, navigate]);

    const [form] = Form.useForm();

    // Trạng thái loading — hiển thị spinner trên nút Đăng nhập khi đang chờ API
    const [loading, setLoading] = useState<boolean>(false);

    // Lỗi trả về từ server — null nghĩa là không có lỗi, không hiển thị Alert
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Xử lý submit form sau khi AntD validate thành công
    const onFinish = async (values: { email: string; password: string }) => {
        setErrorMessage(null); // Xóa lỗi cũ trước mỗi lần thử lại
        setLoading(true);

        try {
            const response = await callApiLogin(values);
            setLoading(false);

            if (response?.data) {
                // Lưu token — key 'access_token' phải khớp với interceptor.tsx (line 29-30)
                localStorage.setItem('access_token', response.data.access_token);

                // Cập nhật Redux store với thông tin user từ server
                dispatch(setUserLoginInfo(response.data.user));

                message.success('Đăng nhập thành công! Đang chuyển hướng...');
                navigate('/admin');
            } else {
                // Server trả về 2xx nhưng không có data → thông tin sai
                setErrorMessage(
                    (response as any)?.message ?? 'Email hoặc mật khẩu không chính xác.'
                );
            }
        } catch (error) {
            setLoading(false);
            // Lỗi mạng hoặc lỗi server không mong đợi (5xx, timeout...)
            setErrorMessage(
                (error as any)?.message ?? 'Có lỗi xảy ra, vui lòng thử lại sau.'
            );
        }
    };

    // ─── Label mật khẩu có "Quên mật khẩu?" căn phải ─────────────────────────
    // Dùng <Flex> thay div custom để đúng AntD v5 pattern.
    // Phải dùng style width:'100%' vì AntD v5 render label trong flex container giới hạn chiều rộng.
    const passwordLabel = (
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Text strong>Mật khẩu</Text>
            {/* Placeholder — chưa có route /forgot-password, preventDefault giữ SPA */}
            <Link
                href="#"
                style={{ fontWeight: 400 }}
                onClick={e => e.preventDefault()}
            >
                Quên mật khẩu?
            </Link>
        </Flex>
    );

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        /*
         * Wrapper ngoài cùng:
         * Dùng <Flex vertical> thay <div style={{display:'flex',flexDirection:'column'}}>
         * — đúng AntD v5 idiom, loại bỏ inline CSS boilerplate hoàn toàn.
         * minHeight + background đặt trực tiếp vì Flex không có prop cho giá trị này.
         */
        <Flex
            vertical
            align="center"
            justify="center"
            style={{
                minHeight: '100vh',
                // Dùng token thay hardcode '#f0f2f5' — nhất quán khi đổi theme
                background: token.colorBgLayout,
                padding: `${token.paddingLG}px ${token.padding}px`,
            }}
        >
            {/* Card login — giới hạn max-width 420px cho cảm giác tập trung, chuyên nghiệp */}
            <Card
                style={{
                    width: '100%',
                    maxWidth: 420,
                    // Dùng token border radius thay hardcode 12
                    borderRadius: token.borderRadiusLG,
                    boxShadow: token.boxShadowTertiary,
                }}
                // AntD v5: dùng styles.body thay bodyStyle (đã deprecated)
                styles={{
                    body: {
                        padding: `${token.paddingXL}px ${token.paddingXL}px ${token.paddingLG}px`,
                    },
                }}
            >
                {/*
                 * Header: Logo + Title + Subtitle
                 * Dùng <Space direction="vertical"> + align="center"
                 * → Khoảng cách đồng nhất, không cần marginBottom thủ công từng element.
                 */}
                <Space
                    direction="vertical"
                    size={token.marginXS}
                    style={{ width: '100%', textAlign: 'center', marginBottom: token.marginXL }}
                >
                    <CompanyLogo />
                    <Title level={3} style={{ margin: 0 }}>
                        F-Corp OS
                    </Title>
                    <Text type="secondary">
                        Đăng nhập vào hệ thống quản lý nội bộ
                    </Text>
                </Space>

                {/* Alert lỗi — chỉ render khi có errorMessage, closable để người dùng bỏ qua */}
                {errorMessage && (
                    <Alert
                        message={errorMessage}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setErrorMessage(null)}
                        style={{ marginBottom: token.marginMD }}
                    />
                )}

                {/* Form đăng nhập */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    size="large"
                >
                    {/* Email */}
                    <Form.Item
                        label={<Text strong>Email công việc</Text>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Vui lòng nhập đúng định dạng email!' },
                        ]}
                    >
                        {/*
                         * Không cần style={{ borderRadius: 8 }} vì AntD v5 đã áp dụng
                         * token.borderRadius mặc định cho tất cả Input component.
                         */}
                        <Input
                            prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />}
                            placeholder="ten@congty.com"
                            autoComplete="email"
                        />
                    </Form.Item>

                    {/* Mật khẩu */}
                    <Form.Item
                        label={passwordLabel}
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                        ]}
                        // marginBottom custom vì Form.Item cuối cùng trước Button cần khoảng cách đủ
                        style={{ marginBottom: token.marginLG }}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: token.colorTextPlaceholder }} />}
                            placeholder="Nhập mật khẩu"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    {/* Nút Đăng nhập */}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                            style={{ fontWeight: 600 }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>

                {/*
                 * Footer: "Chưa có tài khoản?"
                 * Dùng <Space size={4}> thay <Text> lồng <Text>
                 * → Tránh anti-pattern lồng Typography, dễ đọc và maintain hơn.
                 */}
                <Divider style={{ marginBlock: `${token.marginMD}px ${token.marginSM}px` }} />
                <Flex justify="center">
                    <Space size={4}>
                        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                            Chưa có tài khoản?
                        </Text>
                        <Text strong style={{ fontSize: token.fontSizeSM, color: token.colorPrimary }}>
                            Liên hệ quản trị viên
                        </Text>
                    </Space>
                </Flex>
            </Card>

            {/* Nhãn bản quyền phía dưới Card */}
            <Text
                type="secondary"
                style={{ marginTop: token.marginLG, fontSize: token.fontSizeSM }}
            >
                © {new Date().getFullYear()} F-Corp. Nền tảng quản lý nội bộ doanh nghiệp.
            </Text>
        </Flex>
    );
};

export default LoginPage;