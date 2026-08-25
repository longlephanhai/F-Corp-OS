import React, { useState } from "react";
import {
  Button,
  message,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
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
    label: "Chờ phê duyệt",
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
                Gửi phê duyệt
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
          return <Text type="warning">Đang chờ phê duyệt</Text>;
        }

        // ------------------------------------
        // ASSIGNED
        // ------------------------------------

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
  );
};
