import { Layout, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import SiderLayout from '../../components/admin/sider';
import HeaderLayout from '../../components/admin/header';
import FooterLayout from '../../components/admin/footer';
import type LayoutAdmin from '../admin';
const { Content } = Layout;

const LayoutPM = () => {

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
            <SiderLayout
                collapsed={collapsed}
                pathName={pathName}
            />
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
    )
}

export default LayoutPM;

