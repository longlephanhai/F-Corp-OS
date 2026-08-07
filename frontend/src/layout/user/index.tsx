import { useState } from 'react';
import {
    Layout,
    Menu,
    Avatar,
    Badge,
    Dropdown,
    Typography,
    theme,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    BellOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    HomeOutlined,
    ProfileOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 48;

const UserLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notificationCount] = useState(3);

    const {
        token: { colorBgContainer, colorBorderSecondary, colorTextSecondary },
    } = theme.useToken();

    // Derive the active menu key from the current pathname
    const selectedKey = location.pathname;

    // ── Main navigation items ──────────────────────────────────────────────
    const navItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: 'Trang chủ',
            onClick: () => navigate('/'),
        },
        {
            key: '/profile',
            icon: <ProfileOutlined />,
            label: 'Hồ sơ kỹ năng',
            onClick: () => navigate('/profile'),
        },
        {
            key: '/projects',
            icon: <ProjectOutlined />,
            label: 'Dự án',
            onClick: () => navigate('/projects'),
        },
        {
            key: '/tasks',
            icon: <CheckSquareOutlined />,
            label: 'Nhiệm vụ',
            onClick: () => navigate('/tasks'),
        },
    ];

    // ── User dropdown menu ─────────────────────────────────────────────────
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
            onClick: () => navigate('/settings'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: () => {
                // Logout logic is handled by the caller / auth context.
                // Navigate to login as a safe default.
                navigate('/login');
            },
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* ── Fixed Header ──────────────────────────────────────────── */}
            <Header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: HEADER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    background: colorBgContainer,
                    borderBottom: `1px solid ${colorBorderSecondary}`,
                    padding: '0 24px',
                    gap: 24,
                }}
            >
                {/* Left — Brand */}
                <div
                    style={{
                        flexShrink: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                    onClick={() => navigate('/')}
                >
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                        }}
                    >
                        FC
                    </div>
                    <Text strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
                        F-Corp OS
                    </Text>
                </div>

                {/* Center — Horizontal navigation */}
                <Menu
                    mode="horizontal"
                    selectedKeys={[selectedKey]}
                    items={navItems}
                    style={{
                        flex: 1,
                        border: 'none',
                        justifyContent: 'center',
                        background: 'transparent',
                        minWidth: 0,
                    }}
                />

                {/* Right — Notification + User avatar */}
                <div
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    {/* Notification bell */}
                    <Badge count={notificationCount} size="small" offset={[-2, 2]}>
                        <BellOutlined
                            style={{
                                fontSize: 20,
                                cursor: 'pointer',
                                color: colorTextSecondary,
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) =>
                                ((e.target as HTMLElement).style.color = '#1677ff')
                            }
                            onMouseLeave={(e) =>
                                ((e.target as HTMLElement).style.color = colorTextSecondary)
                            }
                        />
                    </Badge>

                    {/* User dropdown */}
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                        arrow
                    >
                        <Avatar
                            icon={<UserOutlined />}
                            style={{
                                cursor: 'pointer',
                                background: '#1677ff',
                                flexShrink: 0,
                            }}
                        />
                    </Dropdown>
                </div>
            </Header>

            {/* ── Scrollable Content ────────────────────────────────────── */}
            <Content
                style={{
                    marginTop: HEADER_HEIGHT,
                    minHeight: `calc(100vh - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
                    background: '#f5f7fa',
                    padding: '24px 0',
                }}
            >
                {/* Centered container — max 1200px */}
                <div
                    style={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: '0 24px',
                    }}
                >
                    <Outlet />
                </div>
            </Content>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <Footer
                style={{
                    height: FOOTER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    background: colorBgContainer,
                    borderTop: `1px solid ${colorBorderSecondary}`,
                }}
            >
                <Text type="secondary" style={{ fontSize: 12 }}>
                    © {new Date().getFullYear()} F-Corp OS. Bảo lưu mọi quyền.
                </Text>
            </Footer>
        </Layout>
    );
};

export default UserLayout;
