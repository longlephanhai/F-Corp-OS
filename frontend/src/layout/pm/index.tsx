import { Layout, Menu, Typography, Button, Flex, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, TeamOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
const { Content } = Layout;
const { Sider, Header } = Layout;
const { Text } = Typography;

const LayoutPM = () => {

    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const selectedKeys =
        location.pathname === '/pm' || location.pathname.startsWith('/pm/my-team')
            ? ['my-team']
            : [];
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {collapsed ? 'PM' : 'PM Workspace'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKeys}
                    items={[
                        {
                            key: 'my-team',
                            icon: <TeamOutlined />,
                            label: 'Đội của tôi',
                            onClick: () => navigate('/pm/my-team'),
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Flex align="center">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ width: 64, height: 64, fontSize: 16 }}
                        />
                        <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                            Project Manager
                        </Text>
                    </Flex>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div style={{
                        minHeight: '69vh',
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        padding: 24,
                    }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default LayoutPM;

