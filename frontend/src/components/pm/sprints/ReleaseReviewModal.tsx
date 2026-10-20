import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Rate,
  Button,
  message,
  Divider,
  Avatar,
  Space,
  Typography,
} from "antd";

import {
  pmApi,
  type ReleaseUserSprintPayload,
} from "../../../api/pm";
const { Text } = Typography;
interface Props {
  open: boolean;
  userSprintId: string | null; // ID của bản ghi phân bổ trong bảng user_sprint
  devName: string;
  onClose: () => void;
  onRefresh: () => void; // Load lại danh sách nhân sự sau khi giải phóng
}

interface ReleaseErrorData {
  code?: string;
  error?: { code?: string };
  message?: string | string[];
  unfinishedTasks?: Array<{
    id: string;
    title?: string;
    status?: string;
    progress?: number;
  }>;
}

export const ReleaseReviewModal: React.FC<Props> = ({
  open,
  userSprintId,
  devName,
  onClose,
  onRefresh,
}) => {
  const [form] = Form.useForm<ReleaseUserSprintPayload>();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: ReleaseUserSprintPayload) => {
    if (!userSprintId) return;

    try {
      setLoading(true);

      // Gọi 1 API duy nhất: Vừa nhả người, vừa lưu điểm đánh giá
      await pmApi.releaseUserSprint(userSprintId, values);

      message.success(
        `Đã giải phóng ${devName} thành công! Nhận xét đã được lưu.`,
      );
      form.resetFields();
      onRefresh();
      onClose();
    } catch (error: unknown) {
      const candidate = error as ReleaseErrorData & {
        response?: { data?: ReleaseErrorData };
      };
      const errorData = candidate.response?.data ?? candidate;

      const code = errorData?.code ?? errorData?.error?.code;

      if (code === "USER_HAS_UNFINISHED_TASKS") {
        const unfinishedTasks = errorData?.unfinishedTasks ?? [];

        Modal.warning({
          title: "Chưa thể Release nhân sự",

          width: 620,

          content: (
            <div>
              <p>Nhân sự này vẫn đang là owner của Task chưa hoàn thành.</p>

              <Space
                direction="vertical"
                size={6}
                style={{
                  width: "100%",
                }}
              >
                {unfinishedTasks.map((task: any) => (
                  <div key={task.id}>
                    <Text strong>{task.title}</Text>

                    <Text type="secondary">
                      {" "}
                      — {task.status}
                      {" · "}
                      {task.progress}%
                    </Text>
                  </div>
                ))}
              </Space>

              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Hãy hoàn thành, đổi owner hoặc bỏ owner các Task trên trước khi
                Release.
              </p>
            </div>
          ),
        });

        return;
      }
      const backendMessage = errorData?.message;
      message.error(
        Array.isArray(backendMessage)
          ? backendMessage.join("; ")
          : backendMessage ?? "Có lỗi xảy ra khi giải phóng nhân sự!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-bold text-gray-800">
          Đánh giá & Giải phóng Nhân sự
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-4">
        <Avatar size="large" className="bg-blue-600">
          {devName.charAt(0)}
        </Avatar>
        <div>
          <div className="text-sm text-gray-600">
            Bạn đang làm thủ tục kết thúc dự án cho:
          </div>
          <div className="text-lg font-bold text-blue-800">{devName}</div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Divider titlePlacement="start" plain>
          Đánh giá hiệu suất (Bắt buộc)
        </Divider>

        <div className="flex gap-8">
          <Form.Item
            name="hardSkillRate"
            label="Kỹ năng chuyên môn (Hard Skills)"
            rules={[
              { required: true, message: "Vui lòng chấm điểm!" },
              { type: "number", min: 1, max: 5, message: "Điểm phải từ 1 đến 5" },
            ]}
          >
            <Rate className="text-blue-500" />
          </Form.Item>

          <Form.Item
            name="softSkillRate"
            label="Thái độ & Kỹ năng mềm (Soft Skills)"
            rules={[
              { required: true, message: "Vui lòng chấm điểm!" },
              { type: "number", min: 1, max: 5, message: "Điểm phải từ 1 đến 5" },
            ]}
          >
            <Rate className="text-orange-400" />
          </Form.Item>
        </div>

        <Form.Item
          name="reviewComment"
          label="Nhận xét chi tiết cho nhân sự này"
          rules={[{ required: true, message: "Vui lòng để lại nhận xét!" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Dev code cẩn thận, ít bug, nhưng cần cải thiện kỹ năng giao tiếp với team..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="primary" danger htmlType="submit" loading={loading}>
            Chốt Đánh giá & Giải phóng (Release)
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
