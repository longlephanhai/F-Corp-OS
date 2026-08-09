import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
} from "antd";
import { UserSprintItem, UserSprintStatus } from "common/types/pm";
import {pmApi} from "api/pm";


export const SprintManagementPage: React.FC<{ sprintId: string }> = ({
  sprintId,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [userSprints, setUserSprints] = useState<UserSprintItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSprintUsers();
  }, [sprintId]);

  const fetchSprintUsers = async () => {
    try {
      setLoading(true);
      const res = await pmApi.getSprintUsers(sprintId);
      if (res && res.data) {
        setUserSprints(res.data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách nhân sự Sprint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: UserSprintStatus,
  ) => {
    try {
      await pmApi.updateUserSprintStatus(id, newStatus);
      message.success("Cập nhật trạng thái thành công!");
      fetchSprintUsers();
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
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
      render: (val: number) => `${val}%`,
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
      render: (_: any, record: UserSprintItem) => (
        <div className="space-x-2">
          {record.status === "requested" && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleUpdateStatus(record.id, "assigned")}
            >
              Chấp nhận (Assign)
            </Button>
          )}
          {record.status === "assigned" && (
            <Button
              danger
              size="small"
              onClick={() => handleUpdateStatus(record.id, "released")}
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Quản lý Nhân sự Sprint
        </h2>
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

      {/* Modal gán nhân sự */}
      <Modal
        title="Yêu cầu gán nhân viên vào Sprint"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await pmApi.assignUserToSprint(
              sprintId,
              values.userId,
              values.percitant,
            );
            message.success("Đã gửi yêu cầu gán!");
            setIsModalOpen(false);
            fetchSprintUsers();
          }}
        >
          <Form.Item
            name="userId"
            label="Mã/ID Nhân viên"
            rules={[{ required: true }]}
          >
            <InputNumber className="w-full" placeholder="Nhập User ID" />
          </Form.Item>
          <Form.Item
            name="percitant"
            label="% Công suất tham gia"
            initialValue={100}
          >
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
