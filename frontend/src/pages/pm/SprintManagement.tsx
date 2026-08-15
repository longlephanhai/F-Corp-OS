import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Table,
  Tag,
  Tabs,
} from "antd";
import { useParams } from "react-router-dom";
import type {
  TaskItem,
  UserSprintItem,
  UserSprintStatus,
} from "../../common/types/pm";
import { pmApi } from "../../api/pm";
import { CreateTaskModal } from "../../components/pm/sprints/CreateTaskModal";
import { TaskMatchingDrawer } from "../../components/pm/sprints/TaskMatchingDrawer";

type AssignUserFormValues = {
  userId: string;
  percitant: number;
};

export const SprintManagementPage: React.FC = () => {
  // Route is configured as /pm/sprints/:sprintId in App.tsx.
  // Hooks must be called inside a React component, not at module scope.
  const { sprintId } = useParams<{ sprintId: string }>();
  const [loading, setLoading] = useState(false);
  const [userSprints, setUserSprints] = useState<UserSprintItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [form] = Form.useForm<AssignUserFormValues>();

  // States mới cho Task & Matching
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Hàm mở Drawer tìm ứng viên
  const handleOpenMatching = (task: TaskItem) => {
    setSelectedTask(task);
    setIsMatchingOpen(true);
  };

  // Cột cho Bảng Task
  const taskColumns = [
    {
      title: "Thời gian",
      key: "time",
      render: (_: any, record: TaskItem) => (
        <div className="text-sm">
          <div>
            <span className="font-semibold text-gray-500">Từ:</span>{" "}
            {record.startDate || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-gray-500">Đến:</span>{" "}
            {record.endDate || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Kỹ năng yêu cầu (Required Skills)",
      dataIndex: "requiredSkills",
      key: "skills",
      render: (skills: any[]) => (
        <div className="flex flex-wrap gap-1">
          {skills?.map((sk, idx) => (
            <Tag key={idx} color="processing">
              {sk.skill_id} (Lv.{sk.min_level})
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Ngân sách",
      dataIndex: "budgetRate",
      key: "budget",
      render: (val: number) => (
        <span className="font-semibold text-green-600">${val || 0}</span>
      ),
    },
    {
      title: "Nhân sự đảm nhận",
      dataIndex: "userId",
      key: "user",
      render: (userId: string) =>
        userId ? (
          <Tag color="green">Đã có người</Tag>
        ) : (
          <Tag color="orange">Đang thiếu</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: TaskItem) => (
        <Button
          type="primary"
          ghost
          size="small"
          onClick={() => handleOpenMatching(record)}
        >
          🔍 Tìm Nhân Sự
        </Button>
      ),
    },
  ];

  // Giả lập 1 Task mẫu vào mảng Tasks để test UI
  useEffect(() => {
    setTasks([
      {
        id: "task-1",
        sprintId: sprintId!,
        startDate: "2026-08-15",
        endDate: "2026-08-30",
        budgetRate: 1200,
        requiredSkills: [
          { skill_id: "ReactJS", min_level: 4, weight: 5 },
          { skill_id: "Figma", min_level: 2, weight: 2 },
        ],
      },
    ]);
  }, []);

  const fetchSprintUsers = useCallback(async () => {
    if (!sprintId) {
      setUserSprints([]);
      return;
    }

    try {
      setLoading(true);
      const res = await pmApi.getSprintUsers(sprintId);
      setUserSprints(res.data.data ?? []);
    } catch (error) {
      console.error("Lỗi tải danh sách nhân sự Sprint:", error);
      message.error("Không thể tải danh sách nhân sự Sprint.");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    void fetchSprintUsers();
  }, [fetchSprintUsers]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: UserSprintStatus,
  ) => {
    try {
      await pmApi.updateUserSprintStatus(id, newStatus);
      message.success("Cập nhật trạng thái thành công!");
      await fetchSprintUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      message.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleAssignUser = async (values: AssignUserFormValues) => {
    if (!sprintId) {
      message.error("Không tìm thấy Sprint ID trên URL.");
      return;
    }

    try {
      await pmApi.assignUserToSprint(sprintId, values.userId, values.percitant);
      message.success("Đã gửi yêu cầu gán nhân viên!");
      form.resetFields();
      setIsModalOpen(false);
      await fetchSprintUsers();
    } catch (error) {
      console.error("Lỗi khi gán nhân viên vào Sprint:", error);
      message.error("Không thể gửi yêu cầu gán nhân viên.");
    }
  };

  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["user", "fullName"],
      key: "fullName",
      render: (text: string, record: UserSprintItem) => (
        <div>
          <div className="font-semibold">{text || "N/A"}</div>
          <div className="text-xs text-gray-400">{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: "Công suất (% Effort)",
      dataIndex: "percitant",
      key: "percitant",
      render: (value: number) => `${value}%`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: UserSprintStatus) => {
        const colorMap: Record<UserSprintStatus, string> = {
          requested: "orange",
          pending_approval: "gold",
          assigned: "green",
          released: "gray",
        };

        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Thao tác (PM)",
      key: "action",
      render: (_: unknown, record: UserSprintItem) => (
        <div className="space-x-2">
          {record.status === "requested" && (
            <Button
              type="primary"
              size="small"
              onClick={() => void handleUpdateStatus(record.id, "assigned")}
            >
              Chấp nhận (Assign)
            </Button>
          )}
          {record.status === "assigned" && (
            <Button
              danger
              size="small"
              onClick={() => void handleUpdateStatus(record.id, "released")}
            >
              Giải phóng (Release 100%)
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý Sprint: <span className="text-blue-600">{sprintId}</span>
        </h2>
      </div>

      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Nhân sự tham gia (Allocation)" key="1">
          <div className="flex justify-end mb-4">
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              + Gán Nhân viên vào Sprint
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={userSprints}
            rowKey="id"
            loading={loading}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Danh sách Tasks" key="2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 italic">
              Tính năng chia việc chi tiết cho nhân sự...
            </span>
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a" }}
              onClick={() => setIsTaskModalOpen(true)}
            >
              + Tạo Task Mới
            </Button>
          </div>

          <Table
            columns={taskColumns}
            dataSource={tasks}
            rowKey="id"
            pagination={false}
            className="border border-gray-200 rounded"
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Yêu cầu gán nhân viên vào Sprint"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ percitant: 100 }}
          onFinish={handleAssignUser}
        >
          <Form.Item
            name="userId"
            label="Mã/ID Nhân viên"
            rules={[{ required: true, message: "Vui lòng nhập User ID." }]}
          >
            <Input placeholder="Nhập User ID" />
          </Form.Item>
          <Form.Item
            name="percitant"
            label="% Công suất tham gia"
            rules={[{ required: true, message: "Vui lòng nhập công suất." }]}
          >
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <CreateTaskModal
        open={isTaskModalOpen}
        sprintId={sprintId!}
        onClose={() => setIsTaskModalOpen(false)}
        onRefresh={() => {
          console.log("Sẽ reload lại bảng danh sách Task");
        }}
      />
      <TaskMatchingDrawer
        open={isMatchingOpen}
        task={selectedTask}
        onClose={() => setIsMatchingOpen(false)}
      />
    </div>
  );
};
