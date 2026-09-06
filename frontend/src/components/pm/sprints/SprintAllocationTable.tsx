import React, { useState } from "react";
import {
  Button,
  message,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  InputNumber,
  Modal,
} from "antd";

import type { UserSprintItem } from "../../../common/types/pm";
import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface Props {
  userSprints: UserSprintItem[];
  loading?: boolean;

  onRefresh: () => void | Promise<void>;

  onRelease: (record: UserSprintItem) => void;
  readOnly?: boolean;
}

const normalizeStatus = (status?: string) => (status ?? "").toUpperCase();

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  REQUESTED: {
    label: "Đã gửi yêu cầu",
    color: "blue",
  },

  PENDING_APPROVAL: {
    label: "Chờ Dev phản hồi",
    color: "gold",
  },

  ASSIGNED: {
    label: "Đang tham gia",
    color: "green",
  },

  RELEASED: {
    label: "Đã kết thúc",
    color: "default",
  },
  DECLINED: {
    label: "Dev đã từ chối",

    color: "red",
  },
};

export const SprintAllocationTable: React.FC<Props> = ({
  userSprints,
  loading = false,
  readOnly = false,
  onRefresh,
  onRelease,
}) => {
  // ==========================================
  // ACTION LOADING
  // ==========================================

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [retryTarget, setRetryTarget] = useState<any | null>(null);

  const [retryPercentage, setRetryPercentage] = useState<number | null>(null);

  const [retryLoading, setRetryLoading] = useState(false);

  // ==========================================
  // SUBMIT FOR APPROVAL
  // ==========================================

  const handleSubmitApproval = async (record: UserSprintItem) => {
    try {
      setActionLoadingId(record.id);

      await pmApi.submitAllocationForApproval(record.id);

      message.success("Đã gửi yêu cầu để phê duyệt.");

      await onRefresh();
    } catch (error: any) {
      console.error("Lỗi gửi phê duyệt:", error);

      const errorData = error?.response?.data;

      message.error(errorData?.message ?? "Không thể gửi yêu cầu phê duyệt.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==========================================
  // CANCEL REQUEST
  // ==========================================

  const handleCancelRequest = (record: UserSprintItem) => {
    Modal.confirm({
      title: "Hủy yêu cầu phân bổ?",

      content: `Yêu cầu phân bổ ${
        record.user?.fullName ?? "nhân sự này"
      } sẽ bị hủy.`,

      okText: "Hủy yêu cầu",

      okType: "danger",

      cancelText: "Quay lại",

      async onOk() {
        try {
          setActionLoadingId(record.id);

          await pmApi.cancelAllocationRequest(record.id);

          message.success("Đã hủy yêu cầu phân bổ.");

          await onRefresh();
        } catch (error: any) {
          console.error("Lỗi hủy allocation:", error);

          const errorData = error?.response?.data;

          message.error(errorData?.message ?? "Không thể hủy yêu cầu.");
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };
  // ==========================================
  // RETRY INVITATION
  // ==========================================

  const handleRetryInvitation = async () => {
    if (!retryTarget) {
      return;
    }

    if (
      retryPercentage === null ||
      retryPercentage <= 0 ||
      retryPercentage > 100
    ) {
      message.warning("Allocation phải nằm trong khoảng 1% - 100%.");
      return;
    }

    try {
      setRetryLoading(true);

      await pmApi.retrySprintInvitation(retryTarget.id, retryPercentage);

      message.success("Đã gửi lại lời mời Sprint.");

      setRetryTarget(null);
      setRetryPercentage(null);

      await onRefresh();
    } catch (error: any) {
      console.error("Lỗi gửi lại lời mời Sprint:", error);

      const errorData = error?.response?.data;

      message.error(errorData?.message ?? "Không thể gửi lại lời mời Sprint.");
    } finally {
      setRetryLoading(false);
    }
  };
  // ==========================================
  // TABLE COLUMNS
  // ==========================================

  const columns = [
    // ========================================
    // USER
    // ========================================

    {
      title: "Nhân viên",
      key: "user",

      render: (_: unknown, record: UserSprintItem) => (
        <div>
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {record.user?.fullName ?? "N/A"}
          </div>

          <Text type="secondary">{record.user?.email ?? "Không có email"}</Text>
        </div>
      ),
    },

    // ========================================
    // ALLOCATION
    // ========================================

    {
      title: "Công suất",
      dataIndex: "percitant",
      key: "percitant",
      width: 300,

      render: (value: number) => {
        const percentage = Number(value ?? 0);

        return (
          <div
            style={{
              width: 220,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text type="secondary">Allocation</Text>

              <Text strong>{percentage}%</Text>
            </div>

            <Progress percent={percentage} showInfo={false} size="small" />
          </div>
        );
      },
    },

    // ========================================
    // STATUS
    // ========================================

    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",

      render: (status: string) => {
        const normalizedStatus = normalizeStatus(status);

        const config = STATUS_CONFIG[normalizedStatus] ?? {
          label: status,
          color: "default",
        };

        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },

    // ========================================
    // PM ACTION
    // ========================================

    {
      title: "Thao tác (PM)",
      key: "action",

      render: (_: unknown, record: UserSprintItem) => {
        if (readOnly) {
          return <Text type="secondary">Chỉ đọc</Text>;
        }
        const status = normalizeStatus(record.status);

        // ------------------------------------
        // REQUESTED
        // ------------------------------------

        if (status === "REQUESTED") {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                loading={actionLoadingId === record.id}
                onClick={() => {
                  void handleSubmitApproval(record);
                }}
              >
                Gửi lời mời
              </Button>

              <Button
                danger
                size="small"
                disabled={actionLoadingId === record.id}
                onClick={() => handleCancelRequest(record)}
              >
                Hủy
              </Button>
            </Space>
          );
        }

        // ------------------------------------
        // PENDING APPROVAL
        // ------------------------------------

        if (status === "PENDING_APPROVAL") {
          return <Text type="warning"> Đang chờ Dev phản hồi</Text>;
        }

        // ------------------------------------
        // ASSIGNED
        // ------------------------------------
        if (status === "DECLINED") {
          return (
            <Space direction="vertical" size={4}>
              <Text type="danger">Dev đã từ chối</Text>

              <Button
                size="small"
                onClick={() => {
                  setRetryTarget(record);

                  setRetryPercentage(Number(record.percitant ?? 0));
                }}
              >
                Gửi lại lời mời
              </Button>
            </Space>
          );
        }

        if (status === "ASSIGNED") {
          return (
            <Button
              danger
              size="small"
              onClick={() => {
                onRelease(record);
              }}
            >
              Giải phóng
            </Button>
          );
        }

        // ------------------------------------
        // RELEASED
        // ------------------------------------

        if (status === "RELEASED") {
          return <Text type="secondary">Đã kết thúc</Text>;
        }

        return "-";
      },
    },
  ];

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <Table
        columns={columns}
        dataSource={userSprints}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
        }}
      />

      <Modal
        title="Gửi lại lời mời Sprint"
        open={Boolean(retryTarget)}
        onCancel={() => {
          setRetryTarget(null);
          setRetryPercentage(null);
        }}
        okText="Gửi lại"
        cancelText="Hủy"
        confirmLoading={retryLoading}
        onOk={() => {
          void handleRetryInvitation();
        }}
        destroyOnHidden
      >
        <Space
          direction="vertical"
          size={12}
          style={{
            width: "100%",
          }}
        >
          <Text>
            Nhân sự: <Text strong>{retryTarget?.user?.fullName ?? "N/A"}</Text>
          </Text>

          {retryTarget?.responseReason && (
            <Text type="secondary">
              Lý do từ chối: {retryTarget.responseReason}
            </Text>
          )}

          <div>
            <Text strong>Allocation mới</Text>

            <div style={{ marginTop: 8 }}>
              <InputNumber
                min={1}
                max={100}
                value={retryPercentage}
                onChange={(value) => {
                  setRetryPercentage(value);
                }}
                addonAfter="%"
                style={{
                  width: "100%",
                }}
              />
            </div>
          </div>
        </Space>
      </Modal>
    </>
  );
};
