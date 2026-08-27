import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Empty,
  List,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";

import { DeleteOutlined, LinkOutlined } from "@ant-design/icons";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text, Title } = Typography;

interface DependencyItem {
  id: string;

  taskId: string;

  dependsOnTaskId: string;

  dependsOnTask?: {
    id: string;

    title?: string;

    status?: string;

    priority?: string;

    progress?: number;

    endDate?: string;
  } | null;
}

interface Props {
  open: boolean;

  task: TaskItem | null;

  tasks: TaskItem[];

  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

const normalizeStatus = (status?: string) => (status ?? "TODO").toUpperCase();

export const TaskDependenciesModal: React.FC<Props> = ({
  open,
  task,
  tasks,
  onClose,
  onChanged,
}) => {
  const [loading, setLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  // ==========================================
  // LOAD
  // ==========================================

  const loadDependencies = useCallback(async () => {
    if (!task?.id) {
      setDependencies([]);

      return;
    }

    try {
      setLoading(true);

      const response = await pmApi.getTaskDependencies(task.id);

      const data = response?.data?.data ?? response?.data ?? [];

      setDependencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi load dependency:", error);

      message.error("Không thể tải Task Dependencies.");
    } finally {
      setLoading(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (open) {
      void loadDependencies();
    }
  }, [open, loadDependencies]);

  // ==========================================
  // AVAILABLE TASK
  // ==========================================

  const dependencyTaskIds = useMemo(
    () => new Set(dependencies.map((dependency) => dependency.dependsOnTaskId)),
    [dependencies],
  );

  const isTimelineCompatible = (candidate: TaskItem) => {
    if (!task?.startDate || !candidate.endDate) {
      return false;
    }

    const currentStart = new Date(task.startDate).getTime();

    const candidateEnd = new Date(candidate.endDate).getTime();

    if (Number.isNaN(currentStart) || Number.isNaN(candidateEnd)) {
      return false;
    }

    // Cùng ngày vẫn hợp lệ.
    const currentStartDate = new Date(
      new Date(task.startDate).toDateString(),
    ).getTime();

    const candidateEndDate = new Date(
      new Date(candidate.endDate).toDateString(),
    ).getTime();

    return candidateEndDate <= currentStartDate;
  };
  const availableTasks = useMemo(
    () =>
      tasks.filter(
        (candidate) =>
          candidate.id !== task?.id && !dependencyTaskIds.has(candidate.id),
      ),
    [tasks, task?.id, dependencyTaskIds],
  );

  // ==========================================
  // ADD
  // ==========================================

  const handleAdd = async () => {
    if (!task?.id || !selectedTaskId) {
      message.warning("Vui lòng chọn Task dependency.");

      return;
    }

    try {
      await pmApi.addTaskDependency(task.id, selectedTaskId);

      message.success("Đã thêm dependency.");

      setSelectedTaskId(undefined);

      // Refresh danh sách trong Modal
      await loadDependencies();

      // QUAN TRỌNG:
      // Báo cho SprintManagement refresh
      // dependencyStatusMap
      await onChanged();
    } catch (error: any) {
      console.error("Lỗi add dependency:", error);

      const errorData = error?.response?.data;

      if (errorData?.code === "DEPENDENCY_CYCLE") {
        Modal.warning({
          title: "Không thể tạo Dependency",

          content: "Dependency này sẽ tạo vòng lặp giữa các Task.",
        });

        return;
      }

      if (errorData?.code === "DEPENDENCY_TIMELINE_CONFLICT") {
        const dependency = errorData?.dependency;

        const currentTask = errorData?.task;

        Modal.warning({
          title: "Timeline Dependency không hợp lệ",

          width: 620,

          content: (
            <Space direction="vertical" size={8}>
              <Text>
                Task prerequisite phải kết thúc trước hoặc đúng ngày Task hiện
                tại bắt đầu.
              </Text>

              <Text>
                Prerequisite: <strong>{dependency?.title ?? "Task"}</strong>
              </Text>

              <Text type="secondary">
                {dependency?.startDate ?? "?"}
                {" → "}
                {dependency?.endDate ?? "?"}
              </Text>

              <Text>
                Task hiện tại: <strong>{currentTask?.title ?? "Task"}</strong>
              </Text>

              <Text type="secondary">
                {currentTask?.startDate ?? "?"}
                {" → "}
                {currentTask?.endDate ?? "?"}
              </Text>
            </Space>
          ),
        });

        return;
      }

      message.error(errorData?.message ?? "Không thể thêm dependency.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // REMOVE
  // ==========================================

  const handleRemove = (dependency: DependencyItem) => {
    if (!task?.id) {
      return;
    }

    Modal.confirm({
      title: "Xóa Task Dependency?",

      content: "Task sẽ không còn phụ thuộc vào công việc này.",

      okText: "Xóa",

      okType: "danger",

      cancelText: "Hủy",

      async onOk() {
        try {
          await pmApi.removeTaskDependency(
            task.id,

            dependency.id,
          );

          message.success("Đã xóa dependency.");

          await loadDependencies();

          // Refresh trạng thái khóa ở Table
          await onChanged();
        } catch (error) {
          console.error("Lỗi delete dependency:", error);

          message.error("Không thể xóa dependency.");
        }
      },
    });
  };

  const unfinishedCount = dependencies.filter(
    (dependency) =>
      normalizeStatus(dependency.dependsOnTask?.status) !== "DONE",
  ).length;

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />

          <span>Task Dependencies</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={700}
      destroyOnHidden
    >
      {task ? (
        <>
          {/* CURRENT TASK */}

          <div
            style={{
              marginBottom: 18,
            }}
          >
            <Text type="secondary">Task hiện tại</Text>

            <Title
              level={5}
              style={{
                marginTop: 2,
              }}
            >
              {task.title ?? "Task chưa đặt tên"}
            </Title>
          </div>

          {/* BLOCK STATUS */}

          {unfinishedCount > 0 ? (
            <Alert
              type="warning"
              showIcon
              title={`Task đang chờ ${unfinishedCount} dependency hoàn thành`}
              style={{
                marginBottom: 16,
              }}
            />
          ) : dependencies.length > 0 ? (
            <Alert
              type="success"
              showIcon
              title="Tất cả dependency đã hoàn thành"
              style={{
                marginBottom: 16,
              }}
            />
          ) : null}

          {/* ADD */}

          <Space
            style={{
              width: "100%",
              marginBottom: 20,
            }}
            align="start"
          >
            <Select
              showSearch
              allowClear
              value={selectedTaskId}
              placeholder="Chọn Task mà công việc này phụ thuộc..."
              optionFilterProp="label"
              style={{
                width: 480,
              }}
              onChange={setSelectedTaskId}
              options={availableTasks.map((candidate) => {
                const timelineCompatible = isTimelineCompatible(candidate);

                return {
                  value: candidate.id,

                  disabled: !timelineCompatible,

                  label: timelineCompatible
                    ? `${candidate.title ?? "Task"} · ${candidate.status ?? "TODO"}`
                    : `${candidate.title ?? "Task"} · Timeline không phù hợp`,
                };
              })}
            />

            <Button
              type="primary"
              loading={actionLoading}
              disabled={!selectedTaskId}
              onClick={() => void handleAdd()}
            >
              Thêm
            </Button>
          </Space>

          {/* LIST */}

          {dependencies.length > 0 ? (
            <List
              loading={loading}
              dataSource={dependencies}
              renderItem={(dependency) => {
                const dependencyTask = dependency.dependsOnTask;

                const status = normalizeStatus(dependencyTask?.status);

                const progress = Number(dependencyTask?.progress ?? 0);

                return (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(dependency)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <Text strong>
                            {dependencyTask?.title ??
                              dependency.dependsOnTaskId}
                          </Text>

                          {status === "DONE" ? (
                            <Tag color="green">Done</Tag>
                          ) : (
                            <Tag color="gold">Chưa hoàn thành</Tag>
                          )}

                          {dependencyTask?.priority && (
                            <Tag>{dependencyTask.priority}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div
                          style={{
                            width: 300,
                          }}
                        >
                          <Progress percent={progress} size="small" />
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            !loading && <Empty description="Task chưa có dependency" />
          )}
        </>
      ) : null}
    </Modal>
  );
};
