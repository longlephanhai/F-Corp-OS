import React, { useMemo } from "react";
import { Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";

import type { UserSprintItem } from "../../../common/types/pm";

const { Text, Title } = Typography;

interface Props {
  userSprints: UserSprintItem[];
}

const normalizeStatus = (status?: string) => (status ?? "").toUpperCase();

export const SprintResourceSummary: React.FC<Props> = ({ userSprints }) => {
  const summary = useMemo(() => {
    const active = userSprints.filter(
      (item) => normalizeStatus(item.status) === "ASSIGNED",
    );

    const pending = userSprints.filter((item) => {
      const status = normalizeStatus(item.status);

      return status === "REQUESTED" || status === "PENDING_APPROVAL";
    });

    const released = userSprints.filter(
      (item) => normalizeStatus(item.status) === "RELEASED",
    );

    const activeEffort = active.reduce(
      (total, item) => total + Number(item.percitant ?? 0),
      0,
    );

    const pendingEffort = pending.reduce(
      (total, item) => total + Number(item.percitant ?? 0),
      0,
    );

    return {
      activeMembers: active.length,
      activeEffort,
      activeFte: activeEffort / 100,
      pendingRequests: pending.length,
      pendingEffort,
      released: released.length,
    };
  }, [userSprints]);

  return (
    <Card style={{ marginBottom: 20 }}>
      <Space
        direction="vertical"
        size={4}
        style={{
          width: "100%",
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Tổng quan tài nguyên Sprint
        </Title>

        <Text type="secondary">
          Tình trạng phân bổ nhân sự hiện tại của Sprint
        </Text>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Đang tham gia"
              value={summary.activeMembers}
              suffix="nhân sự"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Active Effort"
              value={summary.activeEffort}
              suffix="%"
            />

            <Text type="secondary">Tổng allocation hiện tại</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Active FTE"
              value={summary.activeFte}
              precision={1}
              suffix="FTE"
            />

            <Text type="secondary">100% = 1 FTE</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Chờ xử lý"
              value={summary.pendingRequests}
              suffix="yêu cầu"
            />

            {summary.pendingRequests > 0 && (
              <Tag color="gold" style={{ marginTop: 8 }}>
                Pending effort: {summary.pendingEffort}%
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      {summary.released > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">
            Đã kết thúc: {summary.released} allocation
          </Text>
        </div>
      )}
    </Card>
  );
};
