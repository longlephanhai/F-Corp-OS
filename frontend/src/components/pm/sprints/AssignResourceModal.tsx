import React, { useState } from "react";
import {
  Alert,
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Typography,
} from "antd";

import type { TeamMember } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

type FormValues = {
  userId: string;
  percitant: number;
};

type CapacityInfo = {
  currentAllocation: number;
  availableCapacity: number;
};

interface Props {
  open: boolean;
  sprintId: string;
  teamMembers: TeamMember[];

  onClose: () => void;

  onSuccess: () => void | Promise<void>;
}

export const AssignResourceModal: React.FC<Props> = ({
  open,
  sprintId,
  teamMembers,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();

  const [selectedCapacity, setSelectedCapacity] = useState<CapacityInfo | null>(
    null,
  );

  const [capacityLoading, setCapacityLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const handleSelectEmployee = async (userId: string) => {
    if (!sprintId) {
      return;
    }

    try {
      setCapacityLoading(true);
      setSelectedCapacity(null);

      const res = await pmApi.getUserCapacity(userId, sprintId);

      const capacity = res?.data?.data ?? res?.data;

      const currentAllocation = Number(capacity?.currentAllocation ?? 0);

      const availableCapacity = Number(capacity?.availableCapacity ?? 100);

      setSelectedCapacity({
        currentAllocation,
        availableCapacity,
      });

      if (availableCapacity > 0) {
        form.setFieldValue("percitant", Math.min(availableCapacity, 100));
      } else {
        form.setFieldValue("percitant", undefined);
      }
    } catch (error) {
      console.error("Không lấy được capacity:", error);

      setSelectedCapacity(null);

      message.error("Không lấy được capacity của nhân sự.");
    } finally {
      setCapacityLoading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!sprintId) {
      message.error("Không tìm thấy Sprint.");
      return;
    }

    if (
      selectedCapacity &&
      values.percitant > selectedCapacity.availableCapacity
    ) {
      message.warning(
        `Nhân sự chỉ còn ${selectedCapacity.availableCapacity}% capacity.`,
      );
      return;
    }

    try {
      setSubmitting(true);

      await pmApi.assignUserToSprint(sprintId, values.userId, values.percitant);

      message.success("Đã gửi yêu cầu phân bổ nhân sự.");

      form.resetFields();
      setSelectedCapacity(null);

      await onSuccess();

      onClose();
    } catch (error: any) {
      console.error("Lỗi gửi allocation:", error);

      const errorData = error?.response?.data;

      if (errorData?.code === "DUPLICATE_ALLOCATION") {
        message.warning(
          "Nhân sự này đã có allocation đang hoạt động trong Sprint.",
        );

        return;
      }

      if (errorData?.code === "OVER_ALLOCATION") {
        Modal.warning({
          title: "Không đủ capacity",

          content: (
            <div>
              <p>
                Đã sử dụng: <strong>{errorData.currentAllocation}%</strong>
              </p>

              <p>
                Yêu cầu thêm: <strong>{errorData.requestedAllocation}%</strong>
              </p>

              <p>
                Sau khi phân bổ: <strong>{errorData.afterAllocation}%</strong>
              </p>

              <p>
                Capacity còn lại:{" "}
                <strong>{errorData.availableCapacity}%</strong>
              </p>
            </div>
          ),
        });

        return;
      }

      message.error(errorData?.message ?? "Không thể gửi yêu cầu phân bổ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) {
      return;
    }

    form.resetFields();
    setSelectedCapacity(null);

    onClose();
  };

  return (
    <Modal
      title="Yêu cầu gán nhân viên vào Sprint"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          percitant: 100,
        }}
        onFinish={handleSubmit}
      >
        {/* USER */}

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
            allowClear
            placeholder="Tìm theo tên hoặc email..."
            optionFilterProp="label"
            onChange={(userId) => {
              setSelectedCapacity(null);

              if (userId) {
                void handleSelectEmployee(userId);
              }
            }}
            options={teamMembers.map((member) => ({
              value: member.id,

              label:
                `${member.fullName} · ` +
                `${member.email}` +
                `${member.title ? ` · ${member.title}` : ""}`,
            }))}
          />
        </Form.Item>

        {/* CAPACITY LOADING */}

        {capacityLoading && (
          <div
            style={{
              marginBottom: 16,
            }}
          >
            <Text type="secondary">Đang kiểm tra capacity...</Text>
          </div>
        )}

        {/* CAPACITY */}

        {selectedCapacity && !capacityLoading && (
          <div
            style={{
              padding: 16,
              marginBottom: 18,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fafafa",
            }}
          >
            <div
              style={{
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              Capacity trong thời gian Sprint
            </div>

            <Progress
              percent={Math.min(selectedCapacity.currentAllocation, 100)}
              status={
                selectedCapacity.currentAllocation >= 100
                  ? "exception"
                  : "active"
              }
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text>
                Đã sử dụng:{" "}
                <strong>{selectedCapacity.currentAllocation}%</strong>
              </Text>

              <Text>
                Còn trống:{" "}
                <strong>{selectedCapacity.availableCapacity}%</strong>
              </Text>
            </div>

            {selectedCapacity.availableCapacity === 0 && (
              <Alert
                style={{
                  marginTop: 12,
                }}
                type="error"
                showIcon
                title="Nhân sự đã hết capacity trong thời gian Sprint này."
              />
            )}

            {selectedCapacity.availableCapacity > 0 &&
              selectedCapacity.availableCapacity <= 30 && (
                <Alert
                  style={{
                    marginTop: 12,
                  }}
                  type="warning"
                  showIcon
                  title={`Nhân sự chỉ còn ${selectedCapacity.availableCapacity}% capacity.`}
                />
              )}
          </div>
        )}

        {/* PERCENT */}

        <Form.Item
          name="percitant"
          label="% Công suất tham gia"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập công suất.",
            },
          ]}
        >
          <Space.Compact block>
            <InputNumber
              min={1}
              max={selectedCapacity?.availableCapacity ?? 100}
              disabled={
                capacityLoading || selectedCapacity?.availableCapacity === 0
              }
              style={{
                width: "100%",
              }}
            />

            <Button disabled>%</Button>
          </Space.Compact>
        </Form.Item>
      </Form>
    </Modal>
  );
};
