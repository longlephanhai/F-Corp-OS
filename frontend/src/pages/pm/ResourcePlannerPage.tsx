import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
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
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { pmApi } from "../../api/pm";

const {
  Title,
  Text,
} = Typography;

type AllocationStatus =
  | "requested"
  | "pending_approval"
  | "assigned"
  | "released"
  | string;

type CapacityStatus =
  | "AVAILABLE"
  | "NEAR_FULL"
  | "FULL"
  | "OVER_ALLOCATED";

interface ResourceAllocation {
  id: string;

  percitant: number;

  status:
    AllocationStatus;

  sprintId: string;

  sprintName:
    string | null;

  sprintStartDate:
    string | null;

  sprintEndDate:
    string | null;

  projectId:
    string | null;

  projectName:
    string | null;
}

interface ResourcePlannerItem {
  id: string;

  fullName: string;

  email: string;

  title:
    string | null;

  employeeStatus:
    string;

  assignedAllocation:
    number;

  pendingAllocation:
    number;

  usedCapacity:
    number;

  availableCapacity:
    number;

  capacityStatus:
    CapacityStatus;

  allocations:
    ResourceAllocation[];
}

interface ResourcePlannerSummary {
  totalResources: number;

  availableResources: number;

  nearFullResources: number;

  fullResources: number;

  overAllocatedResources:
    number;

  totalUsedFte: number;
}

interface ResourcePlannerData {
  generatedAt: string;

  summary:
    ResourcePlannerSummary;

  resources:
    ResourcePlannerItem[];
}

const normalizeStatus = (
  status?: string,
) =>
  (status ?? "").toUpperCase();

const getAllocationStatusTag = (
  status: string,
) => {
  const normalized =
    normalizeStatus(status);

  if (
    normalized === "ASSIGNED"
  ) {
    return (
      <Tag color="green">
        Assigned
      </Tag>
    );
  }

  if (
    normalized ===
    "PENDING_APPROVAL"
  ) {
    return (
      <Tag color="gold">
        Chờ duyệt
      </Tag>
    );
  }

  if (
    normalized === "REQUESTED"
  ) {
    return (
      <Tag color="blue">
        Requested
      </Tag>
    );
  }

  return <Tag>{status}</Tag>;
};

const getCapacityTag = (
  status: CapacityStatus,
) => {
  switch (status) {
    case "AVAILABLE":
      return (
        <Tag color="green">
          Available
        </Tag>
      );

    case "NEAR_FULL":
      return (
        <Tag color="gold">
          Sắp full
        </Tag>
      );

    case "FULL":
      return (
        <Tag color="red">
          Full Capacity
        </Tag>
      );

    case "OVER_ALLOCATED":
      return (
        <Tag color="volcano">
          Over Allocated
        </Tag>
      );

    default:
      return <Tag>-</Tag>;
  }
};

export const ResourcePlannerPage:
  React.FC = () => {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    plannerData,
    setPlannerData,
  ] =
    useState<ResourcePlannerData | null>(
      null,
    );

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      CapacityStatus | "ALL"
    >("ALL");

  // ==========================================
  // FETCH
  // ==========================================

  const fetchPlanner =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await pmApi.getResourcePlanner();

        const data =
          response?.data?.data ??
          response?.data;

        setPlannerData(data);
      } catch (error) {
        console.error(
          "Lỗi tải Resource Planner:",
          error,
        );

        message.error(
          "Không thể tải dữ liệu tài nguyên.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void fetchPlanner();
  }, [fetchPlanner]);

  // ==========================================
  // FILTER
  // ==========================================

  const filteredResources =
    useMemo(() => {
      const resources =
        plannerData?.resources ??
        [];

      const normalizedKeyword =
        keyword
          .trim()
          .toLowerCase();

      return resources.filter(
        (resource) => {
          const matchesKeyword =
            !normalizedKeyword ||
            resource.fullName
              ?.toLowerCase()
              .includes(
                normalizedKeyword,
              ) ||
            resource.email
              ?.toLowerCase()
              .includes(
                normalizedKeyword,
              ) ||
            resource.title
              ?.toLowerCase()
              .includes(
                normalizedKeyword,
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            resource.capacityStatus ===
              statusFilter;

          return (
            matchesKeyword &&
            matchesStatus
          );
        },
      );
    }, [
      plannerData,
      keyword,
      statusFilter,
    ]);

  // ==========================================
  // COLUMNS
  // ==========================================

  const columns = [
    {
      title: "Nhân sự",
      key: "resource",
      width: 260,

      render: (
        _: unknown,
        record:
          ResourcePlannerItem,
      ) => (
        <div>
          <Space size={8}>
            <TeamOutlined />

            <Text strong>
              {record.fullName}
            </Text>
          </Space>

          <div
            style={{
              marginTop: 4,
            }}
          >
            <Text type="secondary">
              {record.email}
            </Text>
          </div>

          {record.title && (
            <div>
              <Text type="secondary">
                {record.title}
              </Text>
            </div>
          )}
        </div>
      ),
    },

    {
      title: "Capacity",
      key: "capacity",
      width: 260,

      render: (
        _: unknown,
        record:
          ResourcePlannerItem,
      ) => (
        <div
          style={{
            width: 210,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: 4,
            }}
          >
            <Text>
              Used
            </Text>

            <Text strong>
              {
                record.usedCapacity
              }
              %
            </Text>
          </div>

          <Progress
            percent={Math.min(
              record.usedCapacity,
              100,
            )}
            status={
              record.usedCapacity >=
              100
                ? "exception"
                : "active"
            }
            showInfo={false}
          />

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginTop: 5,
            }}
          >
            <Text type="secondary">
              Available
            </Text>

            <Text
              strong
              type={
                record.availableCapacity ===
                0
                  ? "danger"
                  : undefined
              }
            >
              {
                record.availableCapacity
              }
              %
            </Text>
          </div>
        </div>
      ),
    },

    {
      title:
        "Confirmed / Reserved",

      key: "breakdown",

      width: 190,

      render: (
        _: unknown,
        record:
          ResourcePlannerItem,
      ) => (
        <Space
          direction="vertical"
          size={4}
        >
          <Text>
            Assigned:{" "}
            <strong>
              {
                record.assignedAllocation
              }
              %
            </strong>
          </Text>

          <Text>
            Pending:{" "}
            <strong>
              {
                record.pendingAllocation
              }
              %
            </strong>
          </Text>
        </Space>
      ),
    },

    {
      title:
        "Allocation hiện tại",

      key: "allocations",

      render: (
        _: unknown,
        record:
          ResourcePlannerItem,
      ) => {
        if (
          record.allocations
            .length === 0
        ) {
          return (
            <Text type="secondary">
              Chưa có allocation
            </Text>
          );
        }

        return (
          <Space
            direction="vertical"
            size={8}
            style={{
              width: "100%",
            }}
          >
            {record.allocations.map(
              (allocation) => (
                <Card
                  key={
                    allocation.id
                  }
                  size="small"
                  styles={{
                    body: {
                      padding: 10,
                    },
                  }}
                >
                  <Space
                    direction="vertical"
                    size={3}
                  >
                    <Space wrap>
                      <Text strong>
                        {allocation.projectName ??
                          "Project"}
                      </Text>

                      <Text type="secondary">
                        /
                      </Text>

                      <Text>
                        {allocation.sprintName ??
                          "Sprint"}
                      </Text>
                    </Space>

                    <Space wrap>
                      <Tag color="blue">
                        {
                          allocation.percitant
                        }
                        %
                      </Tag>

                      {getAllocationStatusTag(
                        allocation.status,
                      )}
                    </Space>
                  </Space>
                </Card>
              ),
            )}
          </Space>
        );
      },
    },

    {
      title: "Tình trạng",
      key: "status",
      width: 150,

      render: (
        _: unknown,
        record:
          ResourcePlannerItem,
      ) =>
        getCapacityTag(
          record.capacityStatus,
        ),
    },
  ];

  const summary =
    plannerData?.summary;

  return (
    <div
      style={{
        padding: 24,
        background: "#fff",
        borderRadius: 8,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: 24,
        }}
      >
        <Title
          level={3}
          style={{
            marginBottom: 4,
          }}
        >
          Resource Planner
        </Title>

        <Text type="secondary">
          Theo dõi capacity hiện
          tại của đội và các
          allocation đang chiếm
          tài nguyên.
        </Text>
      </div>

      {/* SUMMARY */}

      <Spin spinning={loading}>
        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 24,
          }}
        >
          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card>
              <Statistic
                title="Tổng nhân sự"
                value={
                  summary
                    ?.totalResources ??
                  0
                }
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card>
              <Statistic
                title="Available"
                value={
                  summary
                    ?.availableResources ??
                  0
                }
                suffix="người"
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card>
              <Statistic
                title="Sắp full"
                value={
                  summary
                    ?.nearFullResources ??
                  0
                }
                suffix="người"
              />
            </Card>
          </Col>

          <Col
            xs={24}
            sm={12}
            xl={6}
          >
            <Card>
              <Statistic
                title="Full Capacity"
                value={
                  summary
                    ?.fullResources ??
                  0
                }
                suffix="người"
              />
            </Card>
          </Col>
        </Row>

        {/* OVER ALLOCATION WARNING */}

        {(summary?.overAllocatedResources ??
          0) > 0 && (
          <Alert
            type="error"
            showIcon
            title={`${summary?.overAllocatedResources} nhân sự đang bị over-allocation.`}
            style={{
              marginBottom: 20,
            }}
          />
        )}

        {/* FTE */}

        <Card
          size="small"
          style={{
            marginBottom: 20,
          }}
        >
          <Space>
            <Text type="secondary">
              Tổng capacity đang
              được reserve:
            </Text>

            <Text strong>
              {(
                summary
                  ?.totalUsedFte ??
                0
              ).toFixed(1)}{" "}
              FTE
            </Text>
          </Space>
        </Card>

        {/* FILTER */}

        <Card
          size="small"
          style={{
            marginBottom: 16,
          }}
        >
          <Space
            wrap
            size="middle"
          >
            <Input
              allowClear
              prefix={
                <SearchOutlined />
              }
              placeholder="Tìm tên, email, chức danh..."
              value={keyword}
              onChange={(event) =>
                setKeyword(
                  event.target.value,
                )
              }
              style={{
                width: 300,
              }}
            />

            <Select
              value={statusFilter}
              onChange={
                setStatusFilter
              }
              style={{
                width: 180,
              }}
              options={[
                {
                  value: "ALL",
                  label:
                    "Tất cả capacity",
                },

                {
                  value:
                    "AVAILABLE",
                  label:
                    "Available",
                },

                {
                  value:
                    "NEAR_FULL",
                  label:
                    "Sắp full",
                },

                {
                  value: "FULL",
                  label:
                    "Full Capacity",
                },

                {
                  value:
                    "OVER_ALLOCATED",
                  label:
                    "Over Allocated",
                },
              ]}
            />
          </Space>
        </Card>

        {/* TABLE */}

        {filteredResources.length >
          0 ? (
          <Table
            columns={columns}
            dataSource={
              filteredResources
            }
            rowKey="id"
            loading={loading}
            scroll={{
              x: 1200,
            }}
            pagination={{
              pageSize: 8,
              showSizeChanger:
                false,
            }}
          />
        ) : (
          !loading && (
            <Empty
              description="Không tìm thấy nhân sự phù hợp"
            />
          )
        )}
      </Spin>
    </div>
  );
};