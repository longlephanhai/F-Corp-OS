import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Avatar,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Typography,
  Card,
  Divider,
  Flex,
  message,
  Select,
  Statistic,
} from "antd";

import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { pmApi } from "../../api/pm"; // Đảm bảo đường dẫn đúng
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
      // Gọi song song 2 API: Chi tiết dự án và Danh sách Sprint
      const [resProject, resSprints] = await Promise.all([
        pmApi.getProjectById(projectId),
        pmApi.getSprintsByProject(projectId),
      ]);

      if (resProject?.data?.data) setProject(resProject.data.data);
      if (resSprints?.data?.data) setSprints(resSprints.data.data);
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

  // 2. HÀM TẠO SPRINT MỚI BẮN XUỐNG DB
  const handleCreateSprint = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        name: values.name,
        projectId: projectId, // Truyền đúng projectId hiện tại
        startDate: values.dateRange[0].format("YYYY-MM-DD 00:00:00"),
        endDate: values.dateRange[1].format("YYYY-MM-DD 23:59:59"),
        attendant: JSON.stringify(values.attendant), // Ép mảng thành chuỗi JSON để lưu DB
      };

      await pmApi.createSprint(payload);
      message.success("Đã tạo Sprint thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchProjectDetails(); // Load lại bảng Sprint
    } catch (error) {
      message.error("Lỗi khi tạo Sprint!");
    } finally {
      setLoading(false);
    }
  };

  // Hàm tự động tính toán Status của Sprint dựa vào ngày tháng (Vì DB chưa có cột status)
  const getSprintStatus = (start: string, end: string) => {
    const today = dayjs();
    const startDate = dayjs(start);
    const endDate = dayjs(end);

    if (today.isBefore(startDate)) return { text: "SẮP TỚI", color: "default" };
    if (today.isAfter(endDate))
      return { text: "ĐÃ HOÀN THÀNH", color: "green" };
    return { text: "ĐANG CHẠY", color: "processing" };
  };

  // 3. CẤU HÌNH CỘT CHO BẢNG SPRINT
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
        const status = getSprintStatus(
          record.start_date || record.startDate,
          record.end_date || record.endDate,
        );
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "VỊ TRÍ CẦN THIẾT (ATTENDANT)",
      dataIndex: "attendant",
      key: "attendant",
      render: (attendant: any) => {
        // Xử lý parse JSON an toàn vì dữ liệu dưới DB đang lưu kiểu chuỗi JSON
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
      render: (_: any, record: any) => (
        <Button
          type="default"
          icon={<SettingOutlined />}
          onClick={() => navigate(`/pm/sprints/${record.id}`)}
        >
          Quản lý Task
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* --- THÔNG TIN DỰ ÁN --- */}
      <Card
        bordered={false}
        style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        loading={loading}
      >
        <Flex justify="space-between" align="flex-start">
          <Space direction="vertical" size="small">
            <Space align="center" size="middle">
              <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
                {project?.name || "Đang tải..."}
              </Title>
              <Tag
                color={project?.status === "active" ? "success" : "default"}
                style={{ fontWeight: "bold" }}
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
              <Space>
                <DollarOutlined />
                <div
                  style={{
                    color: "#16a34a",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {Number(project?.totalBudget || 0).toLocaleString("en-US")}
                </div>
              </Space>
            </Space>
            <Text type="secondary" style={{ marginTop: "8px" }}>
              {project?.description}
            </Text>
          </Space>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Tạo Sprint Mới
          </Button>
        </Flex>
      </Card>

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
