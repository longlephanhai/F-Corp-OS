import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, message, Modal, Table, Tag, Tabs } from "antd";
import { useParams } from "react-router-dom";
import type { UserSprintItem, UserSprintStatus } from "../../common/types/pm";
import { pmApi } from "../../api/pm";
import { CreateTaskModal } from '../../components/pm/CreateTaskModal';

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

  const handleUpdateStatus = async (id: string, newStatus: UserSprintStatus) => {
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
            <Button type="primary" size="small" onClick={() => void handleUpdateStatus(record.id, "assigned")}>
              Chấp nhận (Assign)
            </Button>
          )}
          {record.status === "assigned" && (
            <Button danger size="small" onClick={() => void handleUpdateStatus(record.id, "released")}>
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sprint: <span className="text-blue-600">{sprintId}</span></h2>
      </div>

      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Nhân sự tham gia (Allocation)" key="1">
           <div className="flex justify-end mb-4">
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                + Gán Nhân viên vào Sprint
              </Button>
           </div>
           <Table columns={columns} dataSource={userSprints} rowKey="id" loading={loading} />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Danh sách Tasks" key="2">
           <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 italic">Tính năng chia việc chi tiết cho nhân sự...</span>
              <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={() => setIsTaskModalOpen(true)}>
                + Tạo Task Mới
              </Button>
           </div>
           
           <div className="border border-dashed border-gray-300 rounded p-12 text-center text-gray-400">
              Chưa có task nào được tạo trong Sprint này.
           </div>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Yêu cầu gán nhân viên vào Sprint"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ percitant: 100 }} onFinish={handleAssignUser}>
          <Form.Item name="userId" label="Mã/ID Nhân viên" rules={[{ required: true, message: "Vui lòng nhập User ID." }]}> 
            <Input placeholder="Nhập User ID" />
          </Form.Item>
          <Form.Item name="percitant" label="% Công suất tham gia" rules={[{ required: true, message: "Vui lòng nhập công suất." }]}> 
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
    </div>
  );
};
