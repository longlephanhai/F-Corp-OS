import { Layout, Menu } from 'antd';
import { FaKey, FaShieldAlt, FaUser } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { useNavigate } from 'react-router';
const { Sider } = Layout;


interface IProps {
    collapsed: boolean;
    pathName: string;
}

const SiderLayout = (props: IProps) => {

    const navigate = useNavigate()
    const { collapsed, pathName } = props;

    console.log('SiderLayout pathName:', pathName);

    return (
        <Sider trigger={null} collapsible collapsed={collapsed}>
            <div>
                <h1 style={{ color: 'white', textAlign: 'center', padding: '16px' }}>
                    {collapsed ? 'Logo' : 'Big Logo'}
                </h1>
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[`${pathName}`]}
                items={[
                    {
                        key: 'admin',
                        icon: <MdDashboard />,
                        label: 'Dashboard',
                        onClick: () => navigate('/admin')
                    },
                    {
                        key: 'users',
                        icon: <FaUser />,
                        label: 'Users',
                        onClick: () => navigate('users')
                    },
                     {
                        key: 'roles',
                        icon: <FaShieldAlt />,
                        label: 'Roles',
                        onClick: () => navigate('roles')
                    },
                    {
                        key: 'permissions',
                        icon: <FaKey />,
                        label: 'Permissions',
                        onClick: () => navigate('permissions')
                    }
                ]}
            />
        </Sider>
    )
}

export default SiderLayout;