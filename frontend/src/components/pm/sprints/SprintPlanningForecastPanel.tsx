import React, { useEffect, useState } from "react";

import {
  Alert,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { pmApi } from "../../../api/pm";

const { Text } = Typography;

interface Props {
  sprintId: string;

  sprintStatus?: string;
}

export const SprintPlanningForecastPanel: React.FC<Props> = ({
  sprintId,
  sprintStatus,
}) => {
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<any>(null);

  const normalizedStatus = (sprintStatus ?? "").toString().toLowerCase();

  useEffect(() => {
    if (!sprintId || normalizedStatus !== "upcoming") {
      setData(null);

      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const response = await pmApi.getSprintPlanningForecast(sprintId);

        setData(response?.data?.data ?? response?.data ?? null);
      } catch (error: any) {
        console.error("Không tải được Sprint Planning Forecast:", error);

        const code =
          error?.response?.data?.code ?? error?.response?.data?.error?.code;

        if (code !== "SPRINT_FORECAST_NOT_UPCOMING") {
          message.error("Không thể tải Planning Forecast.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sprintId, normalizedStatus]);

  if (normalizedStatus !== "upcoming") {
    return null;
  }

  const health = data?.planningHealth;

  const scope = data?.scope;

  const capacity = data?.capacity;

  const history = data?.history;

  const forecast = data?.forecast;

  const getHealthTag = () => {
    if (health === "READY") {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Ready
        </Tag>
      );
    }

    if (health === "HIGH_RISK") {
      return (
        <Tag color="red" icon={<WarningOutlined />}>
          High Risk
        </Tag>
      );
    }

    return (
      <Tag color="gold" icon={<ExclamationCircleOutlined />}>
        Cần chú ý
      </Tag>
    );
  };

  return (
    <Card
      title="Sprint Planning Forecast"
      extra={data ? getHealthTag() : null}
      style={{
        marginBottom: 20,
      }}
    >
      <Spin spinning={loading}>
        {data && (
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
                    title="Planned Task"
                    value={scope?.plannedTasks ?? 0}
                  />

                  <Text type="secondary">
                    {scope?.unassignedTasks ?? 0} chưa owner
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Committed FTE"
                    value={capacity?.committedFte ?? 0}
                  />

                  <Text type="secondary">
                    {capacity?.committedPercent ?? 0}% allocation
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Forecast Delivery"
                    value={forecast?.expectedDeliverableTasks ?? "-"}
                    suffix={
                      forecast?.expectedDeliverableTasks !== null
                        ? "Task"
                        : undefined
                    }
                  />

                  <Text type="secondary">Historical throughput</Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} xl={6}>
                <Card size="small">
                  <Statistic
                    title="Additional FTE"
                    value={forecast?.additionalFteNeeded ?? "-"}
                  />

                  <Text type="secondary">Forecast gap</Text>
                </Card>
              </Col>
            </Row>

            {/* ================================= */}
            {/* FORECAST COVERAGE */}
            {/* ================================= */}

            <Card size="small" title="Capacity Coverage">
              {forecast?.forecastCoverage !== null ? (
                <>
                  <Progress
                    percent={forecast?.forecastCoverage ?? 0}
                    status={
                      (forecast?.forecastCoverage ?? 0) < 70
                        ? "exception"
                        : (forecast?.forecastCoverage ?? 0) < 100
                          ? "normal"
                          : "success"
                    }
                  />

                  <Space wrap>
                    <Text type="secondary">
                      Expected:{" "}
                      <strong>{forecast?.expectedDeliverableTasks}</strong> /{" "}
                      {scope?.plannedTasks} Task
                    </Text>

                    {(forecast?.forecastTaskGap ?? 0) > 0 && (
                      <Tag color="red">
                        Thiếu capacity cho khoảng {forecast?.forecastTaskGap}{" "}
                        Task
                      </Tag>
                    )}
                  </Space>
                </>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  title="Chưa đủ dữ liệu để forecast capacity"
                  description="Cần ít nhất 2 Sprint COMPLETED có dữ liệu Delivery và Resource Allocation."
                />
              )}
            </Card>

            {/* ================================= */}
            {/* HISTORICAL BASELINE */}
            {/* ================================= */}

            <Card size="small" title="Historical Baseline">
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="History"
                    value={history?.completedSprints ?? 0}
                    suffix="Sprint"
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Task / FTE"
                    value={history?.throughputPerFte ?? "-"}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Avg Delivery"
                    value={history?.averageDeliveryRate ?? "-"}
                    suffix={
                      history?.averageDeliveryRate !== null ? "%" : undefined
                    }
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Statistic
                    title="Avg Carry-over"
                    value={history?.averageCarryOverRate ?? "-"}
                    suffix={
                      history?.averageCarryOverRate !== null ? "%" : undefined
                    }
                  />
                </Col>
              </Row>
            </Card>

            {/* ================================= */}
            {/* WARNINGS */}
            {/* ================================= */}

            {data?.warnings?.length > 0 && (
              <Space
                direction="vertical"
                size={8}
                style={{
                  width: "100%",
                }}
              >
                {data.warnings.map((warning: string, index: number) => (
                  <Alert
                    key={index}
                    type={health === "HIGH_RISK" ? "error" : "warning"}
                    showIcon
                    title={warning}
                  />
                ))}
              </Space>
            )}

            {/* ================================= */}
            {/* RECOMMENDATIONS */}
            {/* ================================= */}

            {data?.recommendations?.length > 0 && (
              <Card size="small" title="PM Recommendations">
                <Space direction="vertical" size={6}>
                  {data.recommendations.map(
                    (recommendation: string, index: number) => (
                      <Text key={index}>• {recommendation}</Text>
                    ),
                  )}
                </Space>
              </Card>
            )}
          </Space>
        )}
      </Spin>
    </Card>
  );
};
