import { Layout, Menu, Typography, Button, Flex, theme } from "antd";
import {
  DashboardOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { NotificationBell } from "../../components/pm/NotificationBell";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

import { io, Socket } from "socket.io-client";

const LayoutPM = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    const rawToken = token.replace(/^Bearer\s+/i, "");

    const socket = io("http://localhost:8080/user-skills", {
      auth: {
        token: `Bearer ${rawToken}`,
      },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("ẾT NỐI THÀNH CÔNG! Socket ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("LỖI KẾT NỐI SOCKET:", err.message);
    });

    socket.on("user-skill-updated", (message) => {
      console.log("Cập nhật kỹ năng người dùng:", message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [selectedKey, setSelectedKey] = useState<string>("projects");

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // ==========================================
  // ACTIVE MENU
  // ==========================================

  useEffect(() => {
    const path = location.pathname;

    if (path === "/pm" || path.includes("/pm/dashboard")) {
      setSelectedKey("dashboard");
    } else if (path.includes("/pm/my-team")) {
      setSelectedKey("my-team");
    } else if (path.includes("/pm/sprints")) {
      setSelectedKey("projects");
    } else if (path.includes("/pm/resources")) {
      setSelectedKey("resources");
    } else if (path.includes("/pm/projects")) {
      setSelectedKey("projects");
    }
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <Sider trigger={null} collapsible collapsed={collapsed} width={260}>
        {/* LOGO */}
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

        {/* MENU */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ marginTop: 16 }}
          items={[
            {
              key: "dashboard",

              icon: <DashboardOutlined />,

              label: "Tổng quan",

              onClick: () => navigate("/pm/dashboard"),
            },
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

      {/* ==========================================
          MAIN LAYOUT
      ========================================== */}

      <Layout>
        {/* ========================================
            HEADER
        ======================================== */}

        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Flex
            align="center"
            justify="space-between"
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            {/* LEFT */}
            <Flex align="center" gap={12}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "18px",
                  width: 42,
                  height: 42,
                }}
              />

              <Text
                strong
                style={{
                  fontSize: 18,
                  color: "#1677ff",
                }}
              >
                Project Manager
              </Text>
            </Flex>

            {/* RIGHT */}
            <Flex
              align="center"
              gap={20}
              style={{
                height: "100%",
              }}
            >
              {/* NOTIFICATION */}
              <NotificationBell />

              {/* USER */}
              <Flex
                align="center"
                gap={4}
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                <Text type="secondary">Welcome,</Text>

                <Text strong>Khanh Nguyễn (PM)</Text>
              </Flex>
            </Flex>
          </Flex>
        </Header>

        {/* ========================================
            CONTENT
        ======================================== */}

        <Content
          style={{
            margin: "24px 16px",
            padding: 0,
            minHeight: 280,
          }}
        >
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
