import React, { useEffect, useState } from "react";

import {
  Alert,
  Card,
  Col,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface Props {
  open: boolean;

  sprintId: string | null;

  sprintName?: string;

  onClose: () => void;
}

export const SprintRetrospectiveModal: React.FC<Props> = ({
  open,
  sprintId,
  sprintName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!open || !sprintId) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const response = await pmApi.getSprintRetrospective(sprintId);

        setData(response?.data?.data ?? response?.data ?? null);
      } catch (error) {
        console.error("Không load được Sprint retrospective:", error);

        message.error("Không thể tải Retrospective.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, sprintId]);

  const scope = data?.scope;

  const resources = data?.resources;

  return (
    <Modal
      title={`Sprint Retrospective${sprintName ? ` · ${sprintName}` : ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={850}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        {data && (
          <Space
            direction="vertical"
            size={16}
            style={{
              width: "100%",
            }}
          >
            <Card size="small" title="Scope Delivery">
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic title="Planned" value={scope?.planned ?? 0} />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic title="Delivered" value={scope?.delivered ?? 0} />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Carry-over"
                    value={scope?.carriedOver ?? 0}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic title="Removed" value={scope?.removed ?? 0} />
                </Col>
              </Row>

              <div
                style={{
                  marginTop: 18,
                }}
              >
                <Text>Delivery Rate</Text>

                <Progress percent={scope?.deliveryRate ?? 0} />
              </div>

              <div>
                <Text>Carry-over Rate</Text>

                <Progress
                  percent={scope?.carryOverRate ?? 0}
                  status={
                    (scope?.carryOverRate ?? 0) >= 30 ? "exception" : "normal"
                  }
                />
              </div>
            </Card>

            <Card size="small" title="Resource Summary">
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Participants"
                    value={resources?.totalParticipants ?? 0}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Allocated FTE"
                    value={resources?.totalAllocatedFte ?? 0}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Hard Skill"
                    value={resources?.averageHardSkill ?? "-"}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Soft Skill"
                    value={resources?.averageSoftSkill ?? "-"}
                  />
                </Col>
              </Row>
            </Card>

            {data.observations?.length > 0 && (
              <Card size="small" title="Observations">
                <Space direction="vertical" size={8}>
                  {data.observations.map(
                    (observation: string, index: number) => (
                      <Alert
                        key={index}
                        type="warning"
                        showIcon
                        title={observation}
                      />
                    ),
                  )}
                </Space>
              </Card>
            )}

            <Card size="small" title="Scope Breakdown">
              <Space wrap>
                <Tag color="green">Delivered {scope?.delivered ?? 0}</Tag>

                <Tag color="blue">Carry-over {scope?.carriedOver ?? 0}</Tag>

                <Tag color="red">Removed {scope?.removed ?? 0}</Tag>

                <Tag color="gold">Remaining {scope?.remaining ?? 0}</Tag>
              </Space>
            </Card>
          </Space>
        )}
      </Spin>
    </Modal>
  );
};
