import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";

import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

import {
  pmActionCenterApi,
  type PmActionCategory,
  type PmActionCenterData,
  type PmActionCenterItem,
} from "../../api/pm-action-center";

const { Text, Title } = Typography;

type FilterValue = "ALL" | PmActionCategory;

const CATEGORY_LABEL: Record<PmActionCategory, string> = {
  CRITICAL: "Khẩn cấp",

  APPROVAL: "Chờ xử lý",

  RESOURCE: "Nhân sự",

  MONITORING: "Theo dõi",
};

const SEVERITY_COLOR = {
  CRITICAL: "red",

  HIGH: "volcano",

  MEDIUM: "gold",

  LOW: "blue",
} as const;

export const PMActionCenterPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<PmActionCenterData | null>(null);

  const [filter, setFilter] = useState<FilterValue>("ALL");

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response = await pmActionCenterApi.getActionCenter();

      setData(response.data?.data ?? null);
    } catch (error: any) {
      console.error("Không tải được PM Action Center:", error);

      message.error(
        error?.response?.data?.message ??
          "Không thể tải danh sách việc cần xử lý.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const all = data?.items ?? [];

    if (filter === "ALL") {
      return all;
    }

    return all.filter((item) => item.category === filter);
  }, [data, filter]);

  const openItem = (item: PmActionCenterItem) => {
    if (item.sprintId) {
      navigate(`/pm/sprints/${item.sprintId}`);

      return;
    }

    navigate(`/pm/projects/${item.projectId}`);
  };

  const summary = data?.summary;

  return (
    <Space
      direction="vertical"
      size={20}
      style={{
        width: "100%",
      }}
    >
      {/* HEADER */}

      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <Title
            level={2}
            style={{
              marginBottom: 4,
            }}
          >
            Việc cần xử lý
          </Title>

          <Text type="secondary">
            Các vấn đề PM nên ưu tiên xử lý trên những dự án đang quản lý.
          </Text>
        </Col>

        <Col>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void load()}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* SUMMARY */}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng việc cần xử lý"
              value={summary?.totalActions ?? 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khẩn cấp"
              value={summary?.critical ?? 0}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={summary?.approvals ?? 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Vấn đề nhân sự"
              value={summary?.resourceIssues ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* CONTEXT */}

      {summary && (
        <Alert
          type={summary.totalActions > 0 ? "warning" : "success"}
          showIcon
          message={
            summary.totalActions > 0
              ? `Bạn đang có ${summary.totalActions} việc cần chú ý trên ${summary.managedProjects} dự án.`
              : "Hiện không có vấn đề cần xử lý."
          }
          description={
            `${summary.activeSprints} Sprint đang chạy • ` +
            `${summary.upcomingSprints} Sprint sắp tới`
          }
        />
      )}

      {/* FILTER */}

      <Segmented
        value={filter}
        onChange={(value) => setFilter(value as FilterValue)}
        options={[
          {
            label: "Tất cả",
            value: "ALL",
          },

          {
            label: `Khẩn cấp (${summary?.critical ?? 0})`,
            value: "CRITICAL",
          },

          {
            label: `Chờ xử lý (${summary?.approvals ?? 0})`,
            value: "APPROVAL",
          },

          {
            label: `Nhân sự (${summary?.resourceIssues ?? 0})`,
            value: "RESOURCE",
          },

          {
            label: `Theo dõi (${summary?.monitoring ?? 0})`,
            value: "MONITORING",
          },
        ]}
      />

      {/* ITEMS */}

      <Card>
        <Spin spinning={loading}>
          {items.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <CheckCircleOutlined
                    style={{
                      fontSize: 28,
                    }}
                  />

                  <Text type="secondary">
                    Không có việc cần xử lý trong nhóm này.
                  </Text>
                </Space>
              }
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="open"
                      type="link"
                      onClick={() => openItem(item)}
                    >
                      {item.actionLabel}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        status={
                          item.severity === "CRITICAL"
                            ? "error"
                            : item.severity === "HIGH"
                              ? "warning"
                              : "processing"
                        }
                      />
                    }
                    title={
                      <Space wrap>
                        <Text strong>{item.title}</Text>

                        <Tag color={SEVERITY_COLOR[item.severity]}>
                          {item.severity}
                        </Tag>

                        <Tag>{CATEGORY_LABEL[item.category]}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text>{item.description}</Text>

                        <Text type="secondary">
                          {item.projectName}

                          {item.sprintName ? ` • ${item.sprintName}` : ""}
                        </Text>

                        {item.dueDate && (
                          <Text type="secondary">
                            Mốc thời gian:{" "}
                            {new Date(item.dueDate).toLocaleDateString("vi-VN")}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </Space>
  );
};
