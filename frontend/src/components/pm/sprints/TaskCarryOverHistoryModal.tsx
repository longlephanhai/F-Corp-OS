import React, { useEffect, useState } from "react";

import {
  Alert,
  Modal,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";

import dayjs from "dayjs";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface HistoryItem {
  taskId: string;

  sprintId: string;

  sprintName: string | null;

  title: string | null;

  status: string | null;

  progress: number;

  userId: string | null;

  isDeleted: boolean;

  startDate: string | null;

  endDate: string | null;

  carriedInAt: string | null;

  carriedOutAt: string | null;

  isCurrent: boolean;
}

interface Props {
  open: boolean;

  task: TaskItem | null;

  onClose: () => void;
}

export const TaskCarryOverHistoryModal: React.FC<Props> = ({
  open,
  task,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const response = await pmApi.getTaskCarryOverHistory(task.id);

        const data = response?.data?.data ?? response?.data;

        setHistory(Array.isArray(data?.history) ? data.history : []);
      } catch (error) {
        console.error("Không tải được Carry-over history:", error);

        setHistory([]);

        message.error("Không thể tải lịch sử Carry-over.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, task]);

  return (
    <Modal
      title="Lịch sử Carry-over"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <Alert
          type="info"
          showIcon
          title={task?.title ?? "Task"}
          description="Mỗi lần Carry-over tạo một Task mới để giữ nguyên lịch sử thực thi của Sprint trước."
          style={{
            marginBottom: 20,
          }}
        />

        {!loading && history.length === 0 ? (
          <Text type="secondary">Task chưa có lịch sử Carry-over.</Text>
        ) : (
          <Timeline
            items={history.map((item, index) => ({
              children: (
                <Space direction="vertical" size={4}>
                  <Space wrap>
                    <Text strong>{item.sprintName ?? item.sprintId}</Text>

                    {item.isCurrent && <Tag color="blue">Task hiện tại</Tag>}

                    {item.isDeleted && <Tag>Archived</Tag>}

                    <Tag
                      color={
                        (item.status ?? "").toUpperCase() === "DONE"
                          ? "green"
                          : "gold"
                      }
                    >
                      {item.status ?? "N/A"}
                    </Tag>
                  </Space>

                  <Text>
                    Progress: <strong>{item.progress}%</strong>
                  </Text>

                  <Text type="secondary">
                    {item.startDate
                      ? dayjs(item.startDate).format("DD/MM/YYYY")
                      : "?"}

                    {" → "}

                    {item.endDate
                      ? dayjs(item.endDate).format("DD/MM/YYYY")
                      : "?"}
                  </Text>

                  {item.carriedOutAt && index < history.length - 1 && (
                    <Text type="secondary">
                      Carry-over:{" "}
                      {dayjs(item.carriedOutAt).format("DD/MM/YYYY HH:mm")}
                    </Text>
                  )}
                </Space>
              ),
            }))}
          />
        )}
      </Spin>
    </Modal>
  );
};
