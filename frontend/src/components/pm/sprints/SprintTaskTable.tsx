import React, { useState } from "react";

import {
  Button,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { EditOutlined, LockOutlined } from "@ant-design/icons";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

// ==========================================
// PROPS
// ==========================================

interface DependencyStatus {
  taskId: string;

  totalDependencies: number;

  unfinishedDependencies: number;

  isBlockedByDependency: boolean;
}

interface Props {
  tasks: TaskItem[];

  loading?: boolean;

  onCreateTask: () => void;

  onFindCandidate: (task: TaskItem) => void;

  onManageDependencies: (task: TaskItem) => void;

  onRefresh: () => void | Promise<void>;

  dependencyStatusMap: Record<string, DependencyStatus>;
  readOnly?: boolean;
  onEditTask: (task: TaskItem) => void;
}

// ==========================================
// TYPES
// ==========================================

type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ==========================================
// COMPONENT
// ==========================================

export const SprintTaskTable: React.FC<Props> = ({
  tasks,

  loading = false,

  onCreateTask,

  onFindCandidate,

  onRefresh,

  onManageDependencies,

  dependencyStatusMap,
  readOnly = false,
  onEditTask,
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ========================================
  // UPDATE TASK
  // ========================================

  const updateTask = async (
    taskId: string,

    data: {
      status?: TaskStatus;

      priority?: TaskPriority;

      progress?: number;
    },
  ) => {
    try {
      setActionLoading(taskId);

      await pmApi.updateTaskLifecycle(taskId, data);

      message.success("Đã cập nhật Task");

      await onRefresh();
    } catch (error: any) {
      console.error("Lỗi cập nhật Task Lifecycle:", error);

      const errorData = error?.response?.data;

      // ====================================
      // DEPENDENCY BLOCK
      // ====================================

      if (errorData?.code === "UNFINISHED_DEPENDENCIES") {
        Modal.warning({
          title: "Task đang bị khóa bởi Dependency",

          content:
            errorData?.message ??
            "Các Task prerequisite phải hoàn thành trước.",
        });

        await onRefresh();

        return;
      }

      message.error(errorData?.message ?? "Không thể cập nhật Task.");

      // Refresh để UI quay lại
      // dữ liệu thật từ backend.
      await onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // COLUMNS
  // ========================================

  const columns = [
    // ======================================
    // TASK
    // ======================================

    {
      title: "Task",

      key: "task",

      width: 270,

      render: (
        _: unknown,

        record: TaskItem,
      ) => {
        const dependencyStatus = dependencyStatusMap[record.id];

        const locked = dependencyStatus?.isBlockedByDependency ?? false;

        return (
          <Space direction="vertical" size={3}>
            <Space wrap>
              <Text strong>{record.title ?? "Task chưa đặt tên"}</Text>

              {locked && (
                <Tooltip
                  title={`Còn ${
                    dependencyStatus?.unfinishedDependencies ?? 0
                  } dependency chưa hoàn thành`}
                >
                  <Tag color="orange" icon={<LockOutlined />}>
                    Chờ {dependencyStatus?.unfinishedDependencies} dependency
                  </Tag>
                </Tooltip>
              )}
            </Space>

            {record.description && (
              <Text
                type="secondary"
                ellipsis
                style={{
                  maxWidth: 240,
                }}
              >
                {record.description}
              </Text>
            )}
          </Space>
        );
      },
    },

    // ======================================
    // TIME
    // ======================================

    {
      title: "Thời gian",

      key: "time",

      width: 180,

      render: (
        _: unknown,

        record: TaskItem,
      ) => (
        <Space direction="vertical" size={1}>
          <Text>Từ: {record.startDate ?? "N/A"}</Text>

          <Text>Đến: {record.endDate ?? "N/A"}</Text>
        </Space>
      ),
    },

    // ======================================
    // PRIORITY
    // ======================================

    {
      title: "Priority",

      key: "priority",

      width: 150,

      render: (
        _: unknown,

        record: TaskItem,
      ) => {
        const priority: TaskPriority = (record.priority ??
          "MEDIUM") as TaskPriority;

        return (
          <Select
            value={priority}
            loading={actionLoading === record.id}
            disabled={readOnly || actionLoading === record.id}
            style={{
              width: 125,
            }}
            onChange={(value: TaskPriority) => {
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

    // ======================================
    // STATUS
    // ======================================

    {
      title: "Trạng thái",

      key: "status",

      width: 170,

      render: (
        _: unknown,

        record: TaskItem,
      ) => {
        const status: TaskStatus = (record.status ?? "TODO") as TaskStatus;

        // ====================================
        // DEPENDENCY STATUS
        // ====================================

        const dependencyStatus = dependencyStatusMap[record.id];

        const locked = dependencyStatus?.isBlockedByDependency ?? false;

        const unfinished = dependencyStatus?.unfinishedDependencies ?? 0;

        return (
          <Tooltip
            title={
              locked
                ? `Task đang chờ ${unfinished} dependency hoàn thành`
                : undefined
            }
          >
            <Select
              value={status}
              loading={actionLoading === record.id}
              // QUAN TRỌNG:
              // dependency chưa hoàn thành
              // => không cho đổi lifecycle.
              disabled={readOnly || locked || actionLoading === record.id}
              style={{
                width: 145,
              }}
              onChange={(value: TaskStatus) => {
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
          </Tooltip>
        );
      },
    },

    // ======================================
    // PROGRESS
    // ======================================

    {
      title: "Tiến độ",

      key: "progress",

      width: 220,

      render: (
        _: unknown,

        record: TaskItem,
      ) => {
        const progress = Number(record.progress ?? 0);

        // QUAN TRỌNG:
        // Phải tính locked lại
        // trong chính render này.
        const dependencyStatus = dependencyStatusMap[record.id];

        const locked = dependencyStatus?.isBlockedByDependency ?? false;

        const unfinished = dependencyStatus?.unfinishedDependencies ?? 0;

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

            <Tooltip
              title={
                locked
                  ? `Không thể cập nhật tiến độ. Còn ${unfinished} dependency chưa hoàn thành.`
                  : undefined
              }
            >
              <Space size={4}>
                <InputNumber
                  value={progress}
                  min={0}
                  max={100}
                  // QUAN TRỌNG
                  disabled={readOnly || locked || actionLoading === record.id}
                  style={{
                    width: 80,
                  }}
                  onPressEnter={(event) => {
                    if (locked) {
                      return;
                    }

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
            </Tooltip>
          </div>
        );
      },
    },

    // ======================================
    // SKILLS
    // ======================================

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

    // ======================================
    // OWNER
    // ======================================

    {
      title: "Owner",

      key: "owner",

      width: 130,

      render: (
        _: unknown,

        record: TaskItem,
      ) =>
        record.userId ? (
          <Tag color="green">Đã có người</Tag>
        ) : (
          <Tag color="orange">Chưa có</Tag>
        ),
    },

    // ======================================
    // ACTION
    // ======================================

    {
      title: "Thao tác",

      key: "action",

      width: 180,

      render: (
        _: unknown,

        record: TaskItem,
      ) => {
        const dependencyStatus = dependencyStatusMap[record.id];

        const locked = dependencyStatus?.isBlockedByDependency ?? false;

        return (
          <Space wrap>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={readOnly || record.status === "DONE"}
              onClick={() => onEditTask(record)}
            >
              Sửa
            </Button>
            <Button
              size="small"
              icon={locked ? <LockOutlined /> : undefined}
              disabled={readOnly}
              onClick={() => onManageDependencies(record)}
            >
              Dependencies
            </Button>

            {!record.userId && (
              <Button
                type="primary"
                ghost
                size="small"
                onClick={() => onFindCandidate(record)}
                disabled={readOnly}
              >
                Tìm nhân sự
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // ========================================
  // UI
  // ========================================

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
          Theo dõi Task, priority, tiến độ, dependency và nhân sự thực hiện.
        </Text>

        <Button type="primary" disabled={readOnly} onClick={onCreateTask}>
          + Tạo Task mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        scroll={{
          x: 1600,
        }}
        pagination={false}
      />
    </>
  );
};
