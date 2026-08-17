import { Avatar, Badge, Button, Dropdown, Flex, Layout, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
const { Header } = Layout;
const { Text } = Typography;

interface IProps {
  title?: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  colorBgContainer: string;
}

const HeaderLayout = (props: IProps) => {
  const { collapsed, setCollapsed, colorBgContainer, title } = props;

  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>
      <Flex justify="space-between" align="center" style={{ paddingRight: 24 }}>
        {/* ↓↓↓ PHẦN NÀY GIỮ NGUYÊN 100%, KHÔNG ĐỔI 1 DÒNG ↓↓↓ */}
        <Flex align="center">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          {/* ↑↑↑ HẾT PHẦN GIỮ NGUYÊN ↑↑↑ */}
          <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
            {title}
          </Text>
        </Flex>

        <Flex align="center" gap={20}>
          <Badge dot>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} />
          </Badge>
          <SettingOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} />
          <Text strong>Admin User</Text>
          <Avatar size={32} icon={<UserOutlined />} />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Logout',
                  onClick: () => {
                    localStorage.removeItem('access_token');
                    window.location.href = '/login';
                  },
                },
              ],
            }}
          >
            <Text style={{ color: '#1677ff', cursor: 'pointer' }}>Logout</Text>
          </Dropdown>
        </Flex>
      </Flex>
    </Header>
  );
};

export default HeaderLayout;