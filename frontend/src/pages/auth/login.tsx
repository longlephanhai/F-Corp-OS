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
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callApiLogin } from '../../api';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { setUserLoginInfo } from '../../redux/account/accountSlice';
import CompanyLogo from '../../components/auth/logo-company';

const { Title, Text, Link } = Typography;

const LoginPage = () => {
    const { token } = theme.useToken();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin');
        }
    }, [isAuthenticated, navigate]);

    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const onFinish = async (values: { email: string; password: string }) => {
        setErrorMessage(null);
        setLoading(true);

        try {
            const response = await callApiLogin(values);
            setLoading(false);

            if (response?.data) {
                localStorage.setItem('access_token', response.data.access_token);
                dispatch(setUserLoginInfo(response.data.user));
                message.success(`${response.message}`);
                const route = response.data.user.role.name.toLowerCase()
                navigate(`/${route}`);
            } else {
                setErrorMessage(
                    (response as any)?.message ?? 'Email hoặc mật khẩu không chính xác.'
                );
            }
        } catch (error) {
            setLoading(false);
            setErrorMessage(
                (error as any)?.message ?? 'Có lỗi xảy ra, vui lòng thử lại sau.'
            );
        }
    };

    const passwordLabel = (
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Text strong>Mật khẩu</Text>
            <Link
                href="#"
                style={{ fontWeight: 400 }}
                onClick={e => e.preventDefault()}
            >
                Quên mật khẩu?
            </Link>
        </Flex>
    );

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            style={{
                minHeight: '100vh',
                background: token.colorBgLayout,
                padding: `${token.paddingLG}px ${token.padding}px`,
            }}
        >
            <Card
                style={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: token.borderRadiusLG,
                    boxShadow: token.boxShadowTertiary,
                }}
                styles={{
                    body: {
                        padding: `${token.paddingXL}px ${token.paddingXL}px ${token.paddingLG}px`,
                    },
                }}
            >
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

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    size="large"
                >
                    <Form.Item
                        label={<Text strong>Email công việc</Text>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Vui lòng nhập đúng định dạng email!' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />}
                            placeholder="ten@congty.com"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        label={passwordLabel}
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                        ]}
                        style={{ marginBottom: token.marginLG }}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: token.colorTextPlaceholder }} />}
                            placeholder="Nhập mật khẩu"
                            autoComplete="current-password"
                        />
                    </Form.Item>
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