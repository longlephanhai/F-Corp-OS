import React, { useState } from "react";

import {
  Button,
  InputNumber,
  message,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface Props {
  tasks: TaskItem[];

  loading?: boolean;

  onCreateTask: () => void;

  onFindCandidate: (task: TaskItem) => void;

  onRefresh: () => void | Promise<void>;
}

const PRIORITY_CONFIG = {
  LOW: {
    label: "Low",
    color: "default",
  },

  MEDIUM: {
    label: "Medium",
    color: "blue",
  },

  HIGH: {
    label: "High",
    color: "orange",
  },

  CRITICAL: {
    label: "Critical",
    color: "red",
  },
};

const STATUS_CONFIG = {
  TODO: {
    label: "Todo",
    color: "default",
  },

  IN_PROGRESS: {
    label: "Đang làm",
    color: "processing",
  },

  BLOCKED: {
    label: "Blocked",
    color: "red",
  },

  DONE: {
    label: "Hoàn thành",
    color: "green",
  },
};

export const SprintTaskTable: React.FC<Props> = ({
  tasks,
  loading = false,
  onCreateTask,
  onFindCandidate,
  onRefresh,
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const updateTask = async (
    taskId: string,
    data: {
      status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

      progress?: number;
    },
  ) => {
    try {
      setActionLoading(taskId);

      await pmApi.updateTaskLifecycle(taskId, data);

      message.success("Đã cập nhật Task");

      await onRefresh();
    } catch (error: any) {
      console.error("Lỗi update Task:", error);

      message.error(
        error?.response?.data?.message ?? "Không thể cập nhật Task",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    // ========================================
    // TASK
    // ========================================

    {
      title: "Task",
      key: "task",
      width: 240,

      render: (_: unknown, record: TaskItem) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.title ?? "Task chưa đặt tên"}</Text>

          {record.description && (
            <Text
              type="secondary"
              ellipsis
              style={{
                maxWidth: 220,
              }}
            >
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },

    // ========================================
    // TIME
    // ========================================

    {
      title: "Thời gian",
      key: "time",
      width: 170,

      render: (_: unknown, record: TaskItem) => (
        <Space direction="vertical" size={1}>
          <Text>Từ: {record.startDate ?? "N/A"}</Text>

          <Text>Đến: {record.endDate ?? "N/A"}</Text>
        </Space>
      ),
    },

    // ========================================
    // PRIORITY
    // ========================================

    {
      title: "Priority",
      key: "priority",
      width: 150,

      render: (_: unknown, record: TaskItem) => {
        const priority = record.priority ?? "MEDIUM";

        const config =
          PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];

        return (
          <Select
            value={priority}
            loading={actionLoading === record.id}
            style={{
              width: 125,
            }}
            onChange={(value) => {
              void updateTask(record.id, {
                priority: value,
              });
            }}
            options={[
              {
                value: "LOW",
                label: <Tag>Low</Tag>,
              },

              {
                value: "MEDIUM",
                label: <Tag color="blue">Medium</Tag>,
              },

              {
                value: "HIGH",
                label: <Tag color="orange">High</Tag>,
              },

              {
                value: "CRITICAL",
                label: <Tag color="red">Critical</Tag>,
              },
            ]}
          />
        );
      },
    },

    // ========================================
    // STATUS
    // ========================================

    {
      title: "Trạng thái",
      key: "status",
      width: 160,

      render: (_: unknown, record: TaskItem) => {
        const status = record.status ?? "TODO";

        return (
          <Select
            value={status}
            loading={actionLoading === record.id}
            style={{
              width: 140,
            }}
            onChange={(value) => {
              void updateTask(record.id, {
                status: value,
              });
            }}
            options={[
              {
                value: "TODO",
                label: "Todo",
              },

              {
                value: "IN_PROGRESS",
                label: "Đang làm",
              },

              {
                value: "BLOCKED",
                label: "Blocked",
              },

              {
                value: "DONE",
                label: "Hoàn thành",
              },
            ]}
          />
        );
      },
    },

    // ========================================
    // PROGRESS
    // ========================================

    {
      title: "Tiến độ",
      key: "progress",
      width: 220,

      render: (_: unknown, record: TaskItem) => {
        const progress = Number(record.progress ?? 0);

        return (
          <div
            style={{
              width: 180,
            }}
          >
            <Progress
              percent={progress}
              size="small"
              status={progress === 100 ? "success" : undefined}
            />

            <Space size={4}>
              <InputNumber
                min={0}
                max={100}
                value={progress}
                disabled={actionLoading === record.id}
                style={{
                  width: 80,
                }}
                onPressEnter={(event) => {
                  const value = Number(
                    (event.target as HTMLInputElement).value,
                  );

                  void updateTask(record.id, {
                    progress: value,
                  });
                }}
              />

              <Text type="secondary">%</Text>
            </Space>
          </div>
        );
      },
    },

    // ========================================
    // SKILL
    // ========================================

    {
      title: "Kỹ năng",
      dataIndex: "requiredSkills",
      key: "skills",
      width: 230,

      render: (skills: TaskItem["requiredSkills"]) => (
        <Space wrap size={[0, 4]}>
          {skills?.map((skill, index) => {
            const legacy = skill as typeof skill & {
              skill?: string;
              level?: number;
            };

            const name = legacy.skill_id ?? legacy.skill ?? "Skill";

            const level = legacy.min_level ?? legacy.level;

            return (
              <Tag key={`${name}-${index}`} color="processing">
                {name}

                {level !== undefined ? ` Lv.${level}` : ""}
              </Tag>
            );
          })}
        </Space>
      ),
    },

    // ========================================
    // OWNER
    // ========================================

    {
      title: "Owner",
      key: "owner",
      width: 130,

      render: (_: unknown, record: TaskItem) =>
        record.userId ? (
          <Tag color="green">Đã có người</Tag>
        ) : (
          <Tag color="orange">Chưa có</Tag>
        ),
    },

    // ========================================
    // ACTION
    // ========================================

    {
      title: "Thao tác",
      key: "action",
      width: 130,

      render: (_: unknown, record: TaskItem) => (
        <Button
          type="primary"
          ghost
          size="small"
          onClick={() => onFindCandidate(record)}
        >
          Tìm nhân sự
        </Button>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text type="secondary">
          Theo dõi Task, priority, tiến độ và nhân sự thực hiện.
        </Text>

        <Button type="primary" onClick={onCreateTask}>
          + Tạo Task mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        scroll={{
          x: 1500,
        }}
        pagination={false}
      />
    </>
  );
};
