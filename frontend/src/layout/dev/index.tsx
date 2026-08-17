import { Layout, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import HeaderLayout from '../../components/admin/header';
import FooterLayout from '../../components/admin/footer';
import SiderDev from '../../components/dev/sider';
const { Content } = Layout;

const DeveloperLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pathName, setPathName] = useState('');

    const location = useLocation()
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();


    useEffect(() => {
        const currentPath = location.pathname.split('/')[1]
        setPathName(currentPath ? currentPath : '/')
    }, [location.pathname])

    return (
        <Layout>
            <SiderDev
                collapsed={collapsed}
                pathName={pathName}
            />
            <Layout>
                <HeaderLayout
                    title="Developer Console"
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
                    <div style={{
                        minHeight: '69vh',
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        padding: 24,
                    }}>
                        <Outlet />
                    </div>
                </Content>
                <FooterLayout />
            </Layout>
        </Layout>
    );
};

export default DeveloperLayout;
