import { Layout, Menu, Typography, Button, Flex, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  ProjectOutlined,
  RocketOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

const LayoutPM = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<string>("projects");

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Tự động nhận diện URL hiện tại để bôi sáng đúng Menu (Active State)
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/pm/my-team")) {
      setSelectedKey("my-team");
    } else if (path.includes("/pm/sprints")) {
      setSelectedKey("sprints");
    } else if (path.includes("/pm/resources")) {
      setSelectedKey("resources");
    } else {
      setSelectedKey("projects"); // Mặc định vào /pm hoặc /pm/projects sẽ sáng tab Dự án
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={260}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontSize: collapsed ? "16px" : "20px",
            transition: "font-size 0.2s",
          }}
        >
          {collapsed ? "PM" : "PM Workspace"}
        </div>

        {/* MENU SWITCHER */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ marginTop: 16 }}
          items={[
            {
              key: "projects",
              icon: <ProjectOutlined />,
              label: "Quản lý Dự án",
              onClick: () => navigate("/pm/projects"),
            },
            {
              key: "my-team",
              icon: <TeamOutlined />,
              label: "Đội của tôi (My Team)",
              onClick: () => navigate("/pm/my-team"),
            },
            {
              key: "resources",
              icon: <DatabaseOutlined />,
              label: "Tài nguyên",
              onClick: () => navigate("/pm/resources"),
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer }}>
          <Flex
            align="center"
            justify="space-between"
            style={{ height: "100%" }}
          >
            <Flex align="center">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                  marginLeft: -24,
                }}
              />
              <Text strong style={{ fontSize: 18, color: "#1677ff" }}>
                Project Manager
              </Text>
            </Flex>

            <div>
              <Text type="secondary">Welcome, PM!</Text>
            </div>
          </Flex>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 0,
            minHeight: 280,
          }}
        >
          {/* Bỏ background trắng ở class bọc ngoài này để UI các trang con tự bung màu Tailwind cho đẹp */}
          <div
            style={{
              minHeight: "calc(100vh - 112px)",
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutPM;
