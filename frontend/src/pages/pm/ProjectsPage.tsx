import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Card,
  Space,
  Typography,
} from "antd";
import { PlusOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { pmApi } from "../../api/pm"; // Đảm bảo đường dẫn đúng
import type { ProjectItem } from "../../common/types/pm";
import { MessageOutlined } from "@ant-design/icons";
import { ProjectChatDrawer } from "../../components/pm/ProjectChatDrawer";


const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [chatProject, setChatProject] = useState<ProjectItem | null>(null);
  // Gọi API lấy danh sách dự án
  const fetchProjects = async () => {
    setLoading(true);
    try {
 
      const res = await pmApi.getMyProjects();
      setProjects(res?.data?.data ?? res?.data ?? []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách dự án", error);
      message.error("Không thể tải danh sách dự án từ Server!");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Xử lý submit form tạo dự án mới
  const handleCreateProject = async (values: any) => {
    
    try {
      setLoading(true);
      const payload = {
        name: values.name,
        description: values.description,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
        // Tạm thời hardcode ID của PM (Lấy từ bảng users trong DB của bác)
        pmId: values.id , 
      };

      // Gọi API tạo dự án
      await pmApi.createProject(payload);
      message.success("Đã tạo Dự án mới thành công!");

      setIsModalOpen(false);
      form.resetFields();
      fetchProjects(); // Load lại bảng
    } catch (error) {
      message.error("Lỗi khi khởi tạo dự án!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "TÊN DỰ ÁN",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ProjectItem) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: "15px", color: "#1677ff" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "THỜI GIAN",
      key: "time",
      render: (_: any, record: ProjectItem) => (
        <Text type="secondary">
          {record.startDate} <span style={{ margin: "0 4px" }}>→</span>{" "}
          {record.endDate}
        </Text>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: "green",
          completed: "default",
          delayed: "red",
        };
        const labels: Record<string, string> = {
          active: "ĐANG CHẠY",
          completed: "HOÀN THÀNH",
          delayed: "CHẬM TRỄ",
        };
        return (
          <Tag color={colors[status] || "blue"}>
            {labels[status] || status.toUpperCase()}
          </Tag>
        );
      },
    },
        {
      title: "THAO TÁC",
      key: "action",
      align: "right" as const,
      render: (_: any, record: ProjectItem) => (
        <Space>
          <Button
            icon={<MessageOutlined />}
            onClick={() => setChatProject(record)}
          >
            Chat
          </Button>
          <Button
            type="primary"
            ghost
            icon={<FolderOpenOutlined />}
            // BÙM! Khi bấm nút này, nó sẽ nhảy vào cái Command Center bạn làm hôm trước
            onClick={() => navigate(`/pm/projects/${record.id}`)}
          >
            Vào Command Center
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Danh mục Dự án
          </Title>
          <Text type="secondary">
            Quản lý tổng thể các dự án và phân bổ Sprint
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Khởi tạo Dự án
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            Khởi tạo Dự án Mới
          </Title>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Tạo Dự án"
        cancelText="Hủy bỏ"
        destroyOnClose
      >
        <div style={{ marginBottom: 24, marginTop: 8 }}>
          <Text type="secondary">
            Thiết lập thông tin cơ bản cho dự án mới để bắt đầu lên kế hoạch
            Sprint.
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item
            name="name"
            label="Tên Dự án"
            rules={[{ required: true, message: "Vui lòng nhập tên dự án!" }]}
          >
            <Input placeholder="Ví dụ: Hệ thống F-Corp OS" size="large" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian thực hiện"
            rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
          >
            <RangePicker size="large" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả tóm tắt">
            <Input.TextArea
              rows={4}
              placeholder="Nhập mục tiêu và phạm vi của dự án này..."
            />
          </Form.Item>
        </Form>
      </Modal>
      {chatProject && (
        <ProjectChatDrawer
          open={!!chatProject}
          onClose={() => setChatProject(null)}
          projectId={chatProject.id}
          projectName={chatProject.name}
        />
      )}
    </Card>
  );
};
