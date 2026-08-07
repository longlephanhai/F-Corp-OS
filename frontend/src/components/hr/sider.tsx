import { Layout, Menu } from 'antd';
import {
    BarChartOutlined,
    WalletOutlined,
    CalendarOutlined,
    FundProjectionScreenOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';

const { Sider } = Layout;

interface IProps {
    collapsed: boolean;
}

const HRSider = ({ collapsed }: IProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Strip the leading /hr/ prefix to get the leaf key, e.g. "dashboard"
    const selectedKey =
        location.pathname.replace(/^\/hr\/?/, '') || 'dashboard';

    return (
        <Sider trigger={null} collapsible collapsed={collapsed}>
            {/* Brand */}
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <h2
                    style={{
                        color: '#fff',
                        margin: 0,
                        fontSize: collapsed ? 14 : 16,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        transition: 'font-size 0.2s',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {collapsed ? 'HR' : 'HR Module'}
                </h2>
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                style={{ borderRight: 0, marginTop: 8 }}
                items={[
                    {
                        key: 'dashboard',
                        icon: <BarChartOutlined />,
                        label: 'Tổng quan',
                        onClick: () => navigate('/hr/dashboard'),
                    },
                    {
                        key: 'wallet',
                        icon: <WalletOutlined />,
                        label: 'Quản lý Ví F-Token',
                        onClick: () => navigate('/hr/wallet'),
                    },
                    {
                        key: 'review',
                        icon: <CalendarOutlined />,
                        label: 'Kỳ Đánh Giá',
                        onClick: () => navigate('/hr/review'),
                    },
                    {
                        key: 'bench',
                        icon: <FundProjectionScreenOutlined />,
                        label: 'Dự báo Bench',
                        onClick: () => navigate('/hr/bench'),
                    },
                ]}
            />
        </Sider>
    );
};

export default HRSider;
