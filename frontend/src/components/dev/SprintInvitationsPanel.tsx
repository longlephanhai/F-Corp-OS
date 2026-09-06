import { useCallback, useEffect, useState } from "react";

import {
  Button,
  Card,
  Empty,
  Input,
  List,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";

import { CheckOutlined, CloseOutlined, TeamOutlined } from "@ant-design/icons";

import { devApi, type SprintInvitationItem } from "../../api/dev";

import { socket } from "../../config/socket";

const { Text, Title } = Typography;

export const SprintInvitationsPanel = () => {
  const [loading, setLoading] = useState(false);

  const [invitations, setInvitations] = useState<SprintInvitationItem[]>([]);

  const [actionId, setActionId] = useState<string | null>(null);

  const [declineTarget, setDeclineTarget] =
    useState<SprintInvitationItem | null>(null);

  const [declineReason, setDeclineReason] = useState("");

  // ========================================
  // LOAD
  // ========================================

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await devApi.getMySprintInvitations();

      const data = response.data?.data ?? [];

      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Không tải được Sprint invitations:", error);

      message.error("Không thể tải lời mời Sprint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  // ========================================
  // REALTIME REFRESH
  // ========================================

  useEffect(() => {
    const handleInvitation = () => {
      void loadInvitations();
    };

    socket.on("sprint_allocation_invitation", handleInvitation);

    return () => {
      socket.off("sprint_allocation_invitation", handleInvitation);
    };
  }, [loadInvitations]);

  // ========================================
  // ACCEPT
  // ========================================

  const handleAccept = (invitation: SprintInvitationItem) => {
    Modal.confirm({
      title: "Chấp nhận lời mời Sprint?",

      content:
        `Bạn sẽ tham gia ${invitation.sprintName} ` +
        `với ${invitation.percentage}% công suất.`,

      okText: "Chấp nhận",

      cancelText: "Để sau",

      onOk: async () => {
        try {
          setActionId(invitation.allocationId);

          await devApi.respondSprintInvitation(
            invitation.allocationId,
            "ACCEPT",
          );

          message.success("Đã chấp nhận lời mời Sprint.");

          await loadInvitations();
        } catch (error: any) {
          const errorData = error?.response?.data;

          const code = errorData?.code ?? errorData?.error?.code;

          if (code === "INVITATION_CAPACITY_CHANGED") {
            message.warning(
              errorData?.message ?? "Capacity của bạn đã thay đổi.",
            );

            return;
          }

          message.error(errorData?.message ?? "Không thể chấp nhận lời mời.");
        } finally {
          setActionId(null);
        }
      },
    });
  };

  // ========================================
  // DECLINE
  // ========================================

  const handleDecline = async () => {
    if (!declineTarget) {
      return;
    }

    const reason = declineReason.trim();

    if (!reason) {
      message.warning("Vui lòng nhập lý do từ chối.");

      return;
    }

    try {
      setActionId(declineTarget.allocationId);

      await devApi.respondSprintInvitation(
        declineTarget.allocationId,

        "DECLINE",

        reason,
      );

      message.success("Đã từ chối lời mời Sprint.");

      setDeclineTarget(null);

      setDeclineReason("");

      await loadInvitations();
    } catch (error: any) {
      const errorData = error?.response?.data;

      message.error(errorData?.message ?? "Không thể từ chối lời mời.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <Card
        title={
          <Space>
            <TeamOutlined />

            <span>Lời mời tham gia Sprint</span>

            {invitations.length > 0 && (
              <Tag color="gold">{invitations.length} đang chờ</Tag>
            )}
          </Space>
        }
        style={{
          marginBottom: 24,
        }}
      >
        <Spin spinning={loading}>
          {invitations.length === 0 ? (
            <Empty
              description="Bạn không có lời mời Sprint đang chờ"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={invitations}
              renderItem={(invitation) => (
                <List.Item
                  actions={[
                    <Button
                      key="accept"
                      type="primary"
                      icon={<CheckOutlined />}
                      loading={actionId === invitation.allocationId}
                      onClick={() => handleAccept(invitation)}
                    >
                      Chấp nhận
                    </Button>,

                    <Button
                      key="decline"
                      danger
                      icon={<CloseOutlined />}
                      disabled={actionId === invitation.allocationId}
                      onClick={() => {
                        setDeclineTarget(invitation);

                        setDeclineReason("");
                      }}
                    >
                      Từ chối
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Title
                          level={5}
                          style={{
                            margin: 0,
                          }}
                        >
                          {invitation.sprintName}
                        </Title>

                        <Tag color="blue">{invitation.percentage}%</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text>{invitation.projectName}</Text>

                        <Text type="secondary">
                          {invitation.startDate
                            ? new Date(invitation.startDate).toLocaleDateString(
                                "vi-VN",
                              )
                            : "?"}
                          {" → "}
                          {invitation.endDate
                            ? new Date(invitation.endDate).toLocaleDateString(
                                "vi-VN",
                              )
                            : "?"}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="Từ chối lời mời Sprint"
        open={Boolean(declineTarget)}
        onCancel={() => {
          setDeclineTarget(null);

          setDeclineReason("");
        }}
        onOk={() => {
          void handleDecline();
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,

          loading: Boolean(actionId),
        }}
      >
        <Space
          direction="vertical"
          style={{
            width: "100%",
          }}
        >
          <Text>Hãy cho PM biết lý do để họ có thể tìm nhân sự thay thế.</Text>

          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="Ví dụ: Tôi đang full capacity trong thời gian Sprint này..."
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
          />
        </Space>
      </Modal>
    </>
  );
};
