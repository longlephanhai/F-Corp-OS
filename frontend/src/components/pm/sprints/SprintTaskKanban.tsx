import React, { useMemo, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  message,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";

import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { TaskItem } from "../../../common/types/pm";
import { pmApi } from "../../../api/pm";

const { Text, Title } = Typography;

type KanbanStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

interface Props {
  tasks: TaskItem[];

  loading?: boolean;

  onCreateTask: () => void;

  onFindCandidate: (task: TaskItem) => void;

  onRefresh: () => void | Promise<void>;
}

const STATUS_COLUMNS: Array<{
  status: KanbanStatus;
  title: string;
  color: string;
}> = [
  {
    status: "TODO",
    title: "Todo",
    color: "default",
  },

  {
    status: "IN_PROGRESS",
    title: "Đang làm",
    color: "processing",
  },

  {
    status: "BLOCKED",
    title: "Blocked",
    color: "red",
  },

  {
    status: "DONE",
    title: "Hoàn thành",
    color: "green",
  },
];

const normalizeStatus = (status?: string): KanbanStatus => {
  const normalized = (status ?? "").toUpperCase();

  if (
    normalized === "IN_PROGRESS" ||
    normalized === "BLOCKED" ||
    normalized === "DONE"
  ) {
    return normalized;
  }

  return "TODO";
};

const getPriorityTag = (priority?: string) => {
  const normalized = (priority ?? "MEDIUM").toUpperCase();

  switch (normalized) {
    case "LOW":
      return <Tag>Low</Tag>;

    case "HIGH":
      return <Tag color="orange">High</Tag>;

    case "CRITICAL":
      return <Tag color="red">Critical</Tag>;

    default:
      return <Tag color="blue">Medium</Tag>;
  }
};

export const SprintTaskKanban: React.FC<Props> = ({
  tasks,
  loading = false,
  onCreateTask,
  onFindCandidate,
  onRefresh,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ==========================================
  // GROUP TASK BY STATUS
  // ==========================================

  const groupedTasks = useMemo(() => {
    const result: Record<KanbanStatus, TaskItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      BLOCKED: [],
      DONE: [],
    };

    tasks.forEach((task) => {
      const status = normalizeStatus(task.status);

      result[status].push(task);
    });

    return result;
  }, [tasks]);

  const blockedCount = groupedTasks.BLOCKED.length;

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleChangeStatus = async (task: TaskItem, status: KanbanStatus) => {
    try {
      setActionLoadingId(task.id);

      await pmApi.updateTaskLifecycle(task.id, {
        status,
      });

      message.success("Đã cập nhật trạng thái Task.");

      await onRefresh();
    } catch (error: any) {
      console.error("Lỗi cập nhật trạng thái Task:", error);

      message.error(
        error?.response?.data?.message ?? "Không thể cập nhật trạng thái Task.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <Spin spinning={loading}>
      {/* TOOLBAR */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text type="secondary">Theo dõi luồng công việc theo trạng thái.</Text>

        <Button type="primary" onClick={onCreateTask}>
          + Tạo Task mới
        </Button>
      </div>

      {/* BLOCKED ALERT */}

      {blockedCount > 0 && (
        <Alert
          type="error"
          showIcon
          title={`${blockedCount} Task đang bị Blocked`}
          description="PM nên kiểm tra nguyên nhân cản trở để tránh ảnh hưởng tiến độ Sprint."
          style={{
            marginBottom: 18,
          }}
        />
      )}

      {/* EMPTY */}

      {tasks.length === 0 ? (
        <Empty description="Sprint chưa có Task" />
      ) : (
        <Row gutter={[16, 16]}>
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = groupedTasks[column.status];

            return (
              <Col key={column.status} xs={24} md={12} xl={6}>
                <Card
                  title={
                    <Space>
                      <Tag color={column.color}>{column.title}</Tag>

                      <Text strong>{columnTasks.length}</Text>
                    </Space>
                  }
                  style={{
                    minHeight: 500,
                    background: "#fafafa",
                  }}
                >
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{
                      width: "100%",
                    }}
                  >
                    {columnTasks.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có Task"
                      />
                    ) : (
                      columnTasks.map((task) => {
                        const progress = Math.min(
                          100,
                          Math.max(0, Number(task.progress ?? 0)),
                        );

                        return (
                          <Card
                            key={task.id}
                            size="small"
                            hoverable
                            styles={{
                              body: {
                                padding: 14,
                              },
                            }}
                          >
                            <Space
                              direction="vertical"
                              size={10}
                              style={{
                                width: "100%",
                              }}
                            >
                              {/* TITLE */}

                              <div>
                                <Title
                                  level={5}
                                  style={{
                                    margin: 0,
                                  }}
                                >
                                  {task.title ?? "Task chưa đặt tên"}
                                </Title>

                                {task.description && (
                                  <Text type="secondary" ellipsis>
                                    {task.description}
                                  </Text>
                                )}
                              </div>

                              {/* PRIORITY */}

                              <Space wrap>
                                {getPriorityTag(task.priority)}

                                {task.userId ? (
                                  <Tag color="green" icon={<UserOutlined />}>
                                    Có owner
                                  </Tag>
                                ) : (
                                  <Tag color="orange" icon={<UserOutlined />}>
                                    Chưa có owner
                                  </Tag>
                                )}
                              </Space>

                              {/* TIME */}

                              <Space size={4}>
                                <ClockCircleOutlined />

                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                  }}
                                >
                                  {task.startDate ?? "N/A"}
                                  {" → "}
                                  {task.endDate ?? "N/A"}
                                </Text>
                              </Space>

                              {/* PROGRESS */}

                              <div>
                                <div
                                  style={{
                                    display: "flex",

                                    justifyContent: "space-between",

                                    marginBottom: 4,
                                  }}
                                >
                                  <Text type="secondary">Tiến độ</Text>

                                  <Text strong>{progress}%</Text>
                                </div>

                                <Progress
                                  percent={progress}
                                  size="small"
                                  status={
                                    progress === 100
                                      ? "success"
                                      : column.status === "BLOCKED"
                                        ? "exception"
                                        : undefined
                                  }
                                />
                              </div>

                              {/* STATUS */}

                              <div>
                                <Text
                                  type="secondary"
                                  style={{
                                    display: "block",
                                    marginBottom: 4,
                                  }}
                                >
                                  Chuyển trạng thái
                                </Text>

                                <Select
                                  value={column.status}
                                  loading={actionLoadingId === task.id}
                                  disabled={actionLoadingId === task.id}
                                  style={{
                                    width: "100%",
                                  }}
                                  onChange={(value) => {
                                    void handleChangeStatus(
                                      task,
                                      value as KanbanStatus,
                                    );
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
                              </div>

                              {/* FIND RESOURCE */}

                              {!task.userId && column.status !== "DONE" && (
                                <Button
                                  block
                                  type="dashed"
                                  icon={<ExclamationCircleOutlined />}
                                  onClick={() => onFindCandidate(task)}
                                >
                                  Tìm nhân sự
                                </Button>
                              )}
                            </Space>
                          </Card>
                        );
                      })
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Spin>
  );
};
