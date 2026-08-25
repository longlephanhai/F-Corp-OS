import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Typography,
  Card,
  Flex,
  message,
  Select,
  Statistic,
  Progress,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { pmApi } from "../../api/pm"; // Đảm bảo đường dẫn đúng
import { ProjectHealthPanel } from "../../components/pm/projects/ProjectHealthPanel";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Formatter cho Statistic (hiển thị số có dấu phẩy)
const formatter = (value: number | string) =>
  Number(value).toLocaleString("en-US");

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>(); // Lấy ID từ URL
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [sprints, setSprints] = useState<any[]>([]);

  const [form] = Form.useForm();

  // 1. KÉO DỮ LIỆU TỪ DB LÊN KHI VÀO TRANG
  const fetchProjectDetails = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [resProject, resSprints] = await Promise.all([
        pmApi.getProjectById(projectId),
        pmApi.getSprintsByProject(projectId),
      ]);

      const projectData = resProject?.data?.data ?? resProject?.data ?? null;

      const sprintList = resSprints?.data?.data ?? resSprints?.data ?? [];

      setProject(projectData);

      setSprints(Array.isArray(sprintList) ? sprintList : []);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải dữ liệu Dự án!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // 2. HÀM TÍNH % TIẾN ĐỘ DỰ ÁN DỰA TRÊN SPRINT
  const calculateProgress = () => {
    if (!sprints || sprints.length === 0) {
      return 0;
    }

    // Sprint CANCELLED không tính vào tiến độ delivery.
    const deliverySprints = sprints.filter(
      (sprint) => (sprint.status ?? "").toLowerCase() !== "cancelled",
    );

    if (deliverySprints.length === 0) {
      return 0;
    }

    // QUAN TRỌNG:
    // Chỉ backend status = completed mới được tính hoàn thành.
    // Không auto completed theo endDate.
    const completedSprints = deliverySprints.filter(
      (sprint) => (sprint.status ?? "").toLowerCase() === "completed",
    ).length;

    return Math.round((completedSprints / deliverySprints.length) * 100);
  };

  // 3. HÀM TẠO SPRINT MỚI BẮN XUỐNG DB
  const handleCreateSprint = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        name: values.name,
        projectId,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
        attendant: values.attendant ?? [],
      };

      await pmApi.createSprint(payload);
      message.success("Đã tạo Sprint thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchProjectDetails();
    } catch (error) {
      message.error("Lỗi khi tạo Sprint!");
    } finally {
      setLoading(false);
    }
  };
  const handleSprintStatusChange = async (
    sprint: any,
    status: "active" | "completed" | "cancelled",
  ) => {
    try {
      setLoading(true);

      await pmApi.updateSprintStatus(sprint.id, status);

      const successMessages = {
        active: "Sprint đã bắt đầu.",

        completed: "Sprint đã hoàn thành.",

        cancelled: "Sprint đã được hủy.",
      };

      message.success(successMessages[status]);

      await fetchProjectDetails();
    } catch (error: any) {
      console.error("Sprint lifecycle error:", error);

      const response = error?.response?.data;

      const backendMessage =
        response?.message ??
        response?.error?.message ??
        "Không thể cập nhật trạng thái Sprint.";

      const code = response?.code ?? response?.error?.code;

      // ========================================
      // COMPLETION GUARD DETAILS
      // ========================================

      if (
        code === "SPRINT_HAS_UNFINISHED_TASKS" &&
        Array.isArray(response?.unfinishedTasks)
      ) {
        Modal.warning({
          title: "Sprint chưa thể hoàn thành",

          content: (
            <Space direction="vertical" size={4}>
              <Text>{backendMessage}</Text>

              {response.unfinishedTasks.map((task: any) => (
                <Text key={task.id} type="danger">
                  • {task.title} — {task.status} — {task.progress}%
                </Text>
              ))}
            </Space>
          ),
        });

        return;
      }

      if (code === "SPRINT_HAS_ACTIVE_ALLOCATIONS") {
        Modal.warning({
          title: "Còn nhân sự chưa Release",

          content: backendMessage,
        });

        return;
      }

      if (code === "SPRINT_HAS_UNFINISHED_DEPENDENCIES") {
        Modal.warning({
          title: "Dependency chưa hoàn thành",

          content: backendMessage,
        });

        return;
      }

      if (code === "SPRINT_HAS_ASSIGNED_RESOURCES") {
        Modal.warning({
          title: "Không thể hủy Sprint",

          content: backendMessage,
        });

        return;
      }

      Modal.error({
        title: "Không thể cập nhật Sprint",

        content: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const confirmStartSprint = (sprint: any) => {
    Modal.confirm({
      title: "Bắt đầu Sprint?",

      content: `Sprint "${sprint.name}" sẽ chuyển sang trạng thái ACTIVE.`,

      okText: "Bắt đầu",

      cancelText: "Đóng",

      onOk: async () => {
        await handleSprintStatusChange(sprint, "active");
      },
    });
  };

  const confirmCompleteSprint = (sprint: any) => {
    Modal.confirm({
      title: "Hoàn thành Sprint?",

      content:
        "Hệ thống sẽ kiểm tra Task, Dependency và Allocation trước khi cho phép hoàn thành.",

      okText: "Hoàn thành",

      cancelText: "Đóng",

      onOk: async () => {
        await handleSprintStatusChange(sprint, "completed");
      },
    });
  };

  const confirmCancelSprint = (sprint: any) => {
    Modal.confirm({
      title: "Hủy Sprint?",

      content: `Bạn có chắc muốn hủy "${sprint.name}"?`,

      okText: "Hủy Sprint",

      okButtonProps: {
        danger: true,
      },

      cancelText: "Đóng",

      onOk: async () => {
        await handleSprintStatusChange(sprint, "cancelled");
      },
    });
  };
  // Hàm tự động tính toán Status của Sprint
  const getSprintStatus = (sprint: any) => {
    const status = (sprint?.status ?? "").toString().toLowerCase();
    switch (status) {
      case "upcoming":
        return {
          text: "SẮP TỚI",
          color: "blue",
        };

      case "active":
        return {
          text: "ĐANG CHẠY",
          color: "processing",
        };

      case "completed":
        return {
          text: "ĐÃ HOÀN THÀNH",
          color: "green",
        };

      case "cancelled":
        return {
          text: "ĐÃ HỦY",
          color: "default",
        };

      default:
        return {
          text: "KHÔNG XÁC ĐỊNH",
          color: "default",
        };
    }
  };

  // 4. CẤU HÌNH CỘT CHO BẢNG SPRINT
  const columns = [
    {
      title: "CHI TIẾT SPRINT",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: "15px" }}>
            {text || "Sprint Chưa đặt tên"}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            ID: {record.id.substring(0, 8)}...
          </Text>
        </Space>
      ),
    },
    {
      title: "THỜI GIAN",
      key: "timeline",
      render: (_: any, record: any) => (
        <Text type="secondary">
          {dayjs(record.start_date || record.startDate).format("DD/MM/YYYY")} -{" "}
          {dayjs(record.end_date || record.endDate).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "TRẠNG THÁI",
      key: "status",
      render: (_: any, record: any) => {
        const status = getSprintStatus(record);

        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "VỊ TRÍ CẦN THIẾT (ATTENDANT)",
      dataIndex: "attendant",
      key: "attendant",
      render: (attendant: any) => {
        let roles = [];
        try {
          roles =
            typeof attendant === "string" ? JSON.parse(attendant) : attendant;
        } catch (e) {
          roles = [];
        }

        return (
          <Space size={[0, 4]} wrap>
            {roles?.map((role: string, idx: number) => (
              <Tag color="cyan" key={idx}>
                {role}
              </Tag>
            )) || <Text type="secondary">Chưa định nghĩa</Text>}
          </Space>
        );
      },
    },
    {
      title: "THAO TÁC",

      key: "action",

      align: "right" as const,

      width: 360,

      render: (_: any, record: any) => {
        const status = (record.status ?? "").toString().toLowerCase();

        return (
          <Space wrap>
            {/* ================================= */}
            {/* UPCOMING */}
            {/* ================================= */}

            {status === "upcoming" && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => confirmStartSprint(record)}
                >
                  Bắt đầu
                </Button>

                <Button
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => confirmCancelSprint(record)}
                >
                  Hủy
                </Button>
              </>
            )}

            {/* ================================= */}
            {/* ACTIVE */}
            {/* ================================= */}

            {status === "active" && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => confirmCompleteSprint(record)}
                >
                  Hoàn thành
                </Button>

                <Button
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => confirmCancelSprint(record)}
                >
                  Hủy
                </Button>
              </>
            )}

            {/* ================================= */}
            {/* MANAGEMENT */}
            {/* ================================= */}

            <Button
              type="default"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => navigate(`/pm/sprints/${record.id}`)}
            >
              Quản lý
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* --- THÔNG TIN DỰ ÁN & TIẾN ĐỘ --- */}
      <Card
        bordered={false}
        style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        loading={loading}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="large">
          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
          <Space direction="vertical" size="small">
            <Space align="center" size="middle">
              <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
                {project?.name || "Đang tải..."}
              </Title>
              <Tag
                color={project?.status === "active" ? "success" : "default"}
                style={{ fontWeight: "bold", margin: 0 }}
              >
                {project?.status?.toUpperCase() || "N/A"}
              </Tag>
            </Space>

            <Space size="large" style={{ color: "#6b7280", marginTop: "8px" }}>
              <Space>
                <UserOutlined />{" "}
                <Text type="secondary">
                  PM: {project?.pm?.fullName || "Chưa gán"}
                </Text>
              </Space>
              <Space>
                <CalendarOutlined />{" "}
                <Text type="secondary">
                  {project?.start_date} → {project?.end_date}
                </Text>
              </Space>
              {/* Đã gỡ bỏ cục Ngân sách text thường ở đây */}
            </Space>

            <Text type="secondary" style={{ marginTop: "8px" }}>
              {project?.description}
            </Text>
          </Space>

          {/* CỘT PHẢI: THỐNG KÊ (NGÂN SÁCH + TIẾN ĐỘ) & NÚT TẠO SPRINT */}
          <div className="flex gap-6 items-center">
            {/* Cục ngân sách nhảy số VIP */}
            <Card
              bordered={false}
              className="bg-green-50 shadow-sm"
              styles={{ body: { padding: "16px 24px" } }}
            >
              <Statistic
                title={
                  <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    Tổng Ngân Sách
                  </span>
                }
                value={project?.totalBudget || 0}
                formatter={formatter}
                prefix="$"
                valueStyle={{
                  color: "#16a34a",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              />
            </Card>

            {/* Vòng tròn % Tiến độ VIP */}
            <Card
              bordered={false}
              className="bg-blue-50 shadow-sm"
              styles={{ body: { padding: "12px 24px" } }}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-gray-500 font-semibold mb-1 text-xs uppercase tracking-wider">
                  Tiến độ Dự án
                </span>
                <Progress
                  type="circle"
                  percent={calculateProgress()}
                  size={65}
                  strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} // Chuyển màu từ xanh dương sang xanh lá
                />
              </div>
            </Card>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={{ height: "auto", padding: "16px 24px", fontWeight: 600 }}
            >
              Tạo Sprint
              <br />
              Mới
            </Button>
          </div>
        </Flex>
      </Card>

      {/* ========================================== */}
      {/* PROJECT / SPRINT HEALTH */}
      {/* ========================================== */}
      <ProjectHealthPanel
        sprints={sprints}
        loading={loading}
        onOpenSprint={(id) => navigate(`/pm/sprints/${id}`)}
      />

      {/* --- BẢNG DANH SÁCH SPRINT --- */}
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Lộ trình Sprint (Roadmap)
          </Title>
        }
        bordered={false}
        style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={sprints}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* --- MODAL TẠO SPRINT MỚI --- */}
      <Modal
        title={
          <Title level={3} style={{ margin: 0 }}>
            Khởi tạo Sprint Mới
          </Title>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Hủy bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
          >
            Chốt Tạo Sprint
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ marginBottom: "24px", color: "#6b7280" }}>
          Xác định phạm vi, thời gian và các vị trí cần thiết cho chặng tiếp
          theo.
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateSprint}>
          <Form.Item
            name="name"
            label="Tên Sprint"
            rules={[{ required: true, message: "Vui lòng nhập tên Sprint!" }]}
          >
            <Input
              placeholder="Ví dụ: Sprint 3 - Tính năng giỏ hàng"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian diễn ra"
            rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
          >
            <RangePicker size="large" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="attendant"
            label="Các vị trí cần thiết (Attendant Roles)"
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất 1 role!" },
            ]}
          >
            <Select
              mode="tags"
              size="large"
              placeholder="Chọn hoặc gõ tên Role (Backend, Frontend...)"
              options={[
                { value: "Frontend", label: "Frontend" },
                { value: "Backend", label: "Backend" },
                { value: "Tester", label: "Tester" },
                { value: "BA", label: "Business Analyst" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
