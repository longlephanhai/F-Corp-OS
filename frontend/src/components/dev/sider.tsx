import { Menu } from "antd";
import Sider from "antd/es/layout/Sider";
import { useLocation, useNavigate } from "react-router";
import { DashboardOutlined } from '@ant-design/icons';
import { GiSkills } from "react-icons/gi";
import { RiCertificate2Fill } from "react-icons/ri";

interface IProps {
    collapsed: boolean;
    pathName: string;
}

const SiderDev = (props: IProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { collapsed } = props;

    const selectedKey =
        location.pathname.replace(/^\/developer\/?/, '') || 'dashboard';

    return (
        <Sider trigger={null} collapsible collapsed={collapsed}>
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
                    {collapsed ? 'FC' : 'F-Corp OS'}
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
                        icon: <DashboardOutlined />,
                        label: 'Dashboard',
                        onClick: () => navigate('/developer'),
                    },
                    {
                        key: 'skills',
                        icon: <GiSkills />,
                        label: 'Skills',
                        onClick: () => navigate('skills'),
                    },
                    {
                        key: 'user-skill',
                        icon: <RiCertificate2Fill />,
                        label: 'Evidence',
                        onClick: () => navigate('user-skill')
                    }
                ]}
            />
        </Sider>
    )
}
export default SiderDev;