import { Button, Layout} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,

} from '@ant-design/icons';
const { Header } = Layout;

interface IProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  colorBgContainer: string;
}

const HeaderLayout = (props: IProps) => {
  const { collapsed, setCollapsed, colorBgContainer } = props;

  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>
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
    </Header>
  )
}

export default HeaderLayout