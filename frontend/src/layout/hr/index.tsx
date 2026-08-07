import { Layout, theme } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router';
import HRSider from '../../components/hr/sider';
import HeaderLayout from '../../components/admin/header';
import FooterLayout from '../../components/admin/footer';

const { Content } = Layout;

const LayoutHR = () => {
    const [collapsed, setCollapsed] = useState(false);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <HRSider collapsed={collapsed} />
            <Layout>
                <HeaderLayout
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    colorBgContainer={colorBgContainer}
                />
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div
                        style={{
                            minHeight: '69vh',
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            padding: 24,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
                <FooterLayout />
            </Layout>
        </Layout>
    );
};

export default LayoutHR;
