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
  Select,
  Progress,
  Alert,
} from "antd";
import { useParams } from "react-router-dom";
import type {
  TaskItem,
  UserSprintItem,
  UserSprintStatus,
  TeamMember,
} from "../../common/types/pm";
import { pmApi } from "../../api/pm";
import { CreateTaskModal } from "../../components/pm/sprints/CreateTaskModal";
import { ReleaseReviewModal } from "../../components/pm/sprints/ReleaseReviewModal";
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

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [selectedCapacity, setSelectedCapacity] = useState<{
    currentAllocation: number;
    availableCapacity: number;
  } | null>(null);

  const [capacityLoading, setCapacityLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [form] = Form.useForm<AssignUserFormValues>();

  // States mới cho Task & Matching
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Release modal states
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseUserSprintId, setReleaseUserSprintId] = useState<string | null>(
    null,
  );
  const [releaseDevName, setReleaseDevName] = useState<string>("");

  // Hàm mở Drawer tìm ứng viên
  const handleOpenMatching = (task: TaskItem) => {
    setSelectedTask(task);
    setIsMatchingOpen(true);
  };

  const handleOpenReleaseModal = (record: UserSprintItem) => {
    setReleaseUserSprintId(record.id);
    setReleaseDevName(record.user?.fullName || "Nhân sự");
    setIsReleaseModalOpen(true);
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
      render: (skills: TaskItem["requiredSkills"]) => (
        <div className="flex flex-wrap gap-1">
          {skills?.map((sk, idx) => {
            const legacySkill = sk as typeof sk & {
              skill?: string;
              level?: number;
              years?: number;
            };
            const skillName =
              legacySkill.skill_id ?? legacySkill.skill ?? "Chưa xác định";
            const level = legacySkill.min_level ?? legacySkill.level;

            return (
              <Tag key={`${skillName}-${idx}`} color="processing">
                {skillName}
                {level !== undefined ? ` (Lv.${level})` : ""}
                {legacySkill.years ? ` · ${legacySkill.years} năm` : ""}
              </Tag>
            );
          })}
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

  const fetchSprintData = useCallback(async () => {
    if (!sprintId) {
      setUserSprints([]);
      setTasks([]);
      return;
    }

    setLoading(true);
    try {
      // add thêm api thay vì mockdataa
      const [resUsers, resTasks, resTeam] = await Promise.all([
        pmApi.getSprintUsers(sprintId),
        pmApi.getSprintTasks(sprintId),
        pmApi.getMyTeam(),
      ]);

      setUserSprints(resUsers?.data?.data ?? resUsers?.data ?? []);
      setTasks(resTasks?.data?.data ?? resTasks?.data ?? []);
      setTeamMembers(resTeam?.data?.data ?? resTeam?.data ?? []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Sprint từ Server:", error);
      message.error("Lỗi khi tải dữ liệu Sprint từ Server!");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    void fetchSprintData();
  }, [fetchSprintData]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: UserSprintStatus,
  ) => {
    try {
      await pmApi.updateUserSprintStatus(id, newStatus);
      message.success("Cập nhật trạng thái thành công!");
      await fetchSprintData();
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
      await fetchSprintData();
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
              onClick={() => handleOpenReleaseModal(record)}
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
            label="Chọn nhân sự"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn nhân sự.",
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên hoặc email..."
              optionFilterProp="label"
              onChange={(userId) => void handleSelectEmployee(userId)}
              options={teamMembers.map((member) => ({
                value: member.id,

                label:
                  `${member.fullName} · ` +
                  `${member.email}` +
                  `${member.title ? ` · ${member.title}` : ""}`,
              }))}
            />
          </Form.Item>
          {capacityLoading && (
            <div className="mb-4 text-sm text-gray-500">
              Đang kiểm tra capacity...
            </div>
          )}

          {selectedCapacity && (
            <div className="mb-5 rounded-lg border border-gray-200 p-4">
              <div className="mb-3 font-semibold">
                Capacity trong thời gian Sprint
              </div>

              <Progress
                percent={selectedCapacity.currentAllocation}
                status={
                  selectedCapacity.currentAllocation >= 100
                    ? "exception"
                    : "active"
                }
              />

              <div className="mt-2 flex justify-between text-sm">
                <span>
                  Đã sử dụng:{" "}
                  <strong>{selectedCapacity.currentAllocation}%</strong>
                </span>

                <span>
                  Còn trống:{" "}
                  <strong>{selectedCapacity.availableCapacity}%</strong>
                </span>
              </div>

              {selectedCapacity.availableCapacity === 0 && (
                <Alert
                  className="mt-3"
                  type="error"
                  showIcon
                  message="Nhân sự đã hết capacity trong thời gian Sprint này."
                />
              )}
            </div>
          )}
          <Form.Item
            name="percitant"
            label="% Công suất tham gia"
            rules={[{ required: true, message: "Vui lòng nhập công suất." }]}
          >
            <InputNumber
              min={1}
              max={selectedCapacity?.availableCapacity ?? 100}
              addonAfter="%"
              disabled={selectedCapacity?.availableCapacity === 0}
              className="w-full"
            />
          </Form.Item>
        </Form>
      </Modal>

      <CreateTaskModal
        open={isTaskModalOpen}
        sprintId={sprintId!}
        onClose={() => setIsTaskModalOpen(false)}
        onRefresh={() => {
          void fetchSprintData();
        }}
      />
      <TaskMatchingDrawer
        open={isMatchingOpen}
        task={selectedTask}
        sprintId={sprintId!}
        onClose={() => setIsMatchingOpen(false)}
        onAssigned={fetchSprintData}
      />
      <ReleaseReviewModal
        open={isReleaseModalOpen}
        userSprintId={releaseUserSprintId}
        devName={releaseDevName}
        onClose={() => setIsReleaseModalOpen(false)}
        onRefresh={() => {
          void fetchSprintData();
        }}
      />
    </div>
  );
};
