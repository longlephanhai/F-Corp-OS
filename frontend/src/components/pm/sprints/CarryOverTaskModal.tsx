import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  DatePicker,
  Form,
  message,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";

import dayjs from "dayjs";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface SprintOption {
  id: string;

  name?: string;

  projectId?: string;

  status?: string;

  startDate?: string;

  endDate?: string;

  start_date?: string;

  end_date?: string;
}

interface Props {
  open: boolean;

  task: TaskItem | null;

  currentSprint: SprintOption | null;

  onClose: () => void;

  onSuccess: () => void | Promise<void>;
}

export const CarryOverTaskModal: React.FC<Props> = ({
  open,
  task,
  currentSprint,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const [sprintLoading, setSprintLoading] = useState(false);

  const [sprints, setSprints] = useState<SprintOption[]>([]);

  // ========================================
  // LOAD TARGET SPRINTS
  // ========================================

  useEffect(() => {
    if (!open || !currentSprint?.projectId) {
      return;
    }

    const load = async () => {
      try {
        setSprintLoading(true);

        const response = await pmApi.getSprintsByProject(
          currentSprint.projectId!,
        );

        const data = response?.data?.data ?? response?.data ?? [];

        setSprints(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Không load được Sprint đích:", error);

        message.error("Không thể tải danh sách Sprint kế tiếp.");
      } finally {
        setSprintLoading(false);
      }
    };

    void load();
  }, [open, currentSprint]);

  // ========================================
  // TARGET OPTIONS
  // ========================================

  const targetSprints = useMemo(() => {
    if (!currentSprint) {
      return [];
    }

    const currentEnd = new Date(
      currentSprint.endDate ?? currentSprint.end_date ?? "",
    ).getTime();

    return sprints.filter((sprint) => {
      if (sprint.id === currentSprint.id) {
        return false;
      }

      if ((sprint.status ?? "").toString().toUpperCase() !== "UPCOMING") {
        return false;
      }

      const targetStart = new Date(
        sprint.startDate ?? sprint.start_date ?? "",
      ).getTime();

      return !Number.isNaN(targetStart) && targetStart > currentEnd;
    });
  }, [sprints, currentSprint]);

  // ========================================
  // TARGET CHANGED
  // ========================================

  const handleTargetChange = (sprintId: string) => {
    const sprint = targetSprints.find((item) => item.id === sprintId);

    if (!sprint) {
      return;
    }

    const start = sprint.startDate ?? sprint.start_date;

    const end = sprint.endDate ?? sprint.end_date;

    if (start && end) {
      form.setFieldValue("dateRange", [dayjs(start), dayjs(end)]);
    }
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleFinish = async (values: any) => {
    if (!task) {
      return;
    }

    try {
      setLoading(true);

      await pmApi.carryOverTask(task.id, {
        targetSprintId: values.targetSprintId,

        startDate: values.dateRange[0].format("YYYY-MM-DD"),

        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      });

      message.success("Carry-over Task sang Sprint kế tiếp thành công.");

      form.resetFields();

      await onSuccess();

      onClose();
    } catch (error: any) {
      console.error("Carry-over Task thất bại:", error);

      const errorData = error?.response?.data;

      const code = errorData?.code ?? errorData?.error?.code;

      if (code === "TASK_CARRY_OVER_DEPENDENCY_CONFLICT") {
        Modal.warning({
          title: "Task còn Dependency",

          width: 650,

          content: (
            <Space direction="vertical" size={6}>
              <Text>
                Task này còn prerequisite hoặc dependent chưa hoàn thành.
              </Text>

              <Text type="secondary">
                Hãy xử lý/re-plan Dependency trước khi Carry-over riêng Task.
              </Text>
            </Space>
          ),
        });

        return;
      }

      if (code === "CROSS_PROJECT_CARRY_OVER") {
        Modal.warning({
          title: "Sprint không cùng Project",

          content: errorData?.message,
        });

        return;
      }

      if (
        code === "TASK_OUTSIDE_SPRINT_TIMELINE" ||
        code === "INVALID_TASK_TIMELINE"
      ) {
        Modal.warning({
          title: "Timeline không hợp lệ",

          content: errorData?.message,
        });

        return;
      }

      message.error(errorData?.message ?? "Không thể Carry-over Task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Carry-over Task"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Carry-over"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        title="Task sẽ được chuyển sang chu kỳ thực hiện mới"
        description="Task gốc được lưu trữ để giữ lịch sử. Task mới bắt đầu lại ở TODO 0%. Owner chỉ được giữ nếu nhân sự đã ASSIGNED trong Sprint đích."
        style={{
          marginBottom: 16,
        }}
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Task">
          <Text strong>{task?.title ?? "Task"}</Text>
        </Form.Item>

        <Form.Item
          name="targetSprintId"
          label="Sprint kế tiếp"
          rules={[
            {
              required: true,

              message: "Vui lòng chọn Sprint đích",
            },
          ]}
        >
          <Select
            loading={sprintLoading}
            placeholder="Chọn Sprint"
            onChange={handleTargetChange}
            options={targetSprints.map((sprint) => ({
              value: sprint.id,

              label: `${sprint.name ?? "Sprint"} · ${
                sprint.startDate ?? sprint.start_date ?? "?"
              } → ${sprint.endDate ?? sprint.end_date ?? "?"}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Timeline Task ở Sprint mới"
          rules={[
            {
              required: true,

              message: "Vui lòng chọn timeline Task",
            },
          ]}
        >
          <DatePicker.RangePicker
            style={{
              width: "100%",
            }}
          />
        </Form.Item>

        {targetSprints.length === 0 && !sprintLoading && (
          <Alert
            type="warning"
            showIcon
            title="Chưa có Sprint UPCOMING phù hợp"
            description="Hãy tạo Sprint kế tiếp trong cùng Project trước."
          />
        )}
      </Form>
    </Modal>
  );
};
