import React, { useEffect, useState } from "react";

import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

type Trend = "IMPROVING" | "STABLE" | "DECLINING" | "NO_DATA";

interface SprintTrendItem {
  sprintId: string;

  sprintName: string;

  startDate: string | null;

  endDate: string | null;

  scope: {
    planned: number;

    delivered: number;

    carriedOver: number;

    removed: number;

    deliveryRate: number;

    carryOverRate: number;

    removedScopeRate: number;
  };

  resources: {
    totalParticipants: number;

    totalAllocatedFte: number;

    averageHardSkill: number | null;

    averageSoftSkill: number | null;
  };
}

interface TrendData {
  totalSprints: number;

  metrics: SprintTrendItem[];

  summary: {
    averageDeliveryRate: number;

    averageCarryOverRate: number;

    averageRemovedScopeRate: number;

    averageAllocatedFte: number;

    deliveryTrend: Trend;

    carryOverTrend: Trend;

    overallTrend: Trend;
  };
}

interface Props {
  projectId: string;
}

const renderTrendTag = (trend: Trend) => {
  if (trend === "IMPROVING") {
    return (
      <Tag color="green" icon={<ArrowUpOutlined />}>
        Improving
      </Tag>
    );
  }

  if (trend === "DECLINING") {
    return (
      <Tag color="red" icon={<ArrowDownOutlined />}>
        Declining
      </Tag>
    );
  }

  if (trend === "STABLE") {
    return (
      <Tag color="blue" icon={<ArrowRightOutlined />}>
        Stable
      </Tag>
    );
  }

  return <Tag>Chưa đủ dữ liệu</Tag>;
};

export const SprintTrendPanel: React.FC<Props> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);

  const [limit, setLimit] = useState(5);

  const [data, setData] = useState<TrendData | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const response = await pmApi.getProjectSprintTrends(projectId, limit);

        const result = response?.data?.data ?? response?.data ?? null;

        setData(result);
      } catch (error) {
        console.error("Không load được Sprint trends:", error);

        message.error("Không thể tải dữ liệu lịch sử Sprint.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [projectId, limit]);

  const metrics = data?.metrics ?? [];

  const summary = data?.summary;

  const columns = [
    {
      title: "Sprint",

      key: "sprint",

      width: 180,

      render: (_: unknown, record: SprintTrendItem) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.sprintName}</Text>

          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            {record.startDate
              ? dayjs(record.startDate).format("DD/MM/YYYY")
              : "?"}

            {" → "}

            {record.endDate ? dayjs(record.endDate).format("DD/MM/YYYY") : "?"}
          </Text>
        </Space>
      ),
    },

    {
      title: "Delivery",

      key: "delivery",

      width: 200,

      render: (_: unknown, record: SprintTrendItem) => (
        <div
          style={{
            width: 150,
          }}
        >
          <Text>
            {record.scope.delivered}/{record.scope.planned} Task
          </Text>

          <Progress size="small" percent={record.scope.deliveryRate} />
        </div>
      ),
    },

    {
      title: "Carry-over",

      key: "carryOver",

      width: 180,

      render: (_: unknown, record: SprintTrendItem) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.scope.carryOverRate >= 30 ? "red" : "blue"}>
            {record.scope.carriedOver} Task
          </Tag>

          <Text type="secondary">{record.scope.carryOverRate}%</Text>
        </Space>
      ),
    },

    {
      title: "Removed",

      key: "removed",

      width: 130,

      render: (_: unknown, record: SprintTrendItem) => (
        <Text>
          {record.scope.removed} ({record.scope.removedScopeRate}
          %)
        </Text>
      ),
    },

    {
      title: "Resource",

      key: "resource",

      width: 170,

      render: (_: unknown, record: SprintTrendItem) => (
        <Space direction="vertical" size={2}>
          <Text>{record.resources.totalParticipants} members</Text>

          <Text type="secondary">{record.resources.totalAllocatedFte} FTE</Text>
        </Space>
      ),
    },

    {
      title: "Review",

      key: "review",

      width: 160,

      render: (_: unknown, record: SprintTrendItem) => (
        <Space direction="vertical" size={2}>
          <Text>
            Hard: <strong>{record.resources.averageHardSkill ?? "-"}</strong>
          </Text>

          <Text>
            Soft: <strong>{record.resources.averageSoftSkill ?? "-"}</strong>
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Sprint Historical Comparison"
      extra={
        <Select
          value={limit}
          onChange={setLimit}
          style={{
            width: 150,
          }}
          options={[
            {
              value: 3,

              label: "3 Sprint gần nhất",
            },

            {
              value: 5,

              label: "5 Sprint gần nhất",
            },

            {
              value: 10,

              label: "10 Sprint gần nhất",
            },
          ]}
        />
      }
    >
      <Spin spinning={loading}>
        {metrics.length === 0 ? (
          <Empty description="Chưa có Sprint COMPLETED để so sánh" />
        ) : (
          <Space
            direction="vertical"
            size={18}
            style={{
              width: "100%",
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Avg Delivery"
                    value={summary?.averageDeliveryRate ?? 0}
                    suffix="%"
                  />

                  {renderTrendTag(summary?.deliveryTrend ?? "NO_DATA")}
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Avg Carry-over"
                    value={summary?.averageCarryOverRate ?? 0}
                    suffix="%"
                  />

                  {renderTrendTag(summary?.carryOverTrend ?? "NO_DATA")}
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Avg Removed Scope"
                    value={summary?.averageRemovedScopeRate ?? 0}
                    suffix="%"
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Avg FTE"
                    value={summary?.averageAllocatedFte ?? 0}
                  />

                  <div
                    style={{
                      marginTop: 6,
                    }}
                  >
                    {renderTrendTag(summary?.overallTrend ?? "NO_DATA")}
                  </div>
                </Card>
              </Col>
            </Row>

            {summary?.overallTrend === "DECLINING" && (
              <Alert
                type="warning"
                showIcon
                title="Hiệu suất Sprint đang có xu hướng giảm"
                description="Delivery/Carry-over của các Sprint gần đây đang xấu đi. PM nên kiểm tra lại scope planning, dependency và capacity."
              />
            )}

            {summary?.overallTrend === "IMPROVING" && (
              <Alert
                type="success"
                showIcon
                title="Hiệu suất Sprint đang cải thiện"
                description="Các Sprint gần đây cho thấy xu hướng Delivery tốt hơn và/hoặc Carry-over giảm."
              />
            )}

            <Table
              rowKey="sprintId"
              columns={columns}
              dataSource={metrics}
              pagination={false}
              scroll={{
                x: 1050,
              }}
            />
          </Space>
        )}
      </Spin>
    </Card>
  );
};
