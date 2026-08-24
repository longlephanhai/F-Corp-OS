import React, { useEffect, useMemo, useState } from "react";

import {
  Button,
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
} from "antd";

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FundProjectionScreenOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { pmApi } from "../../../api/pm";

import type { TaskItem, UserSprintItem } from "../../../common/types/pm";
import { summarizeTaskRisks } from "../../../utils/pm/taskRisk";

const { Text, Title } = Typography;

interface SprintItem {
  id: string;

  name?: string;

  startDate?: string;
  endDate?: string;

  start_date?: string;
  end_date?: string;

  status?: string;
}

type SprintTimelineStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

type HealthStatus =
  | "HEALTHY"
  | "WARNING"
  | "CRITICAL"
  | "PLANNED"
  | "COMPLETED";

type HealthFilter = "ALL" | "ACTIVE" | "RISK" | "UPCOMING" | "COMPLETED";

interface SprintHealthItem {
  id: string;

  name: string;

  startDate: string | null;
  endDate: string | null;

  sprintStatus: SprintTimelineStatus;

  totalTasks: number;

  assignedTasks: number;

  unassignedTasks: number;

  taskCoverage: number;

  activeMembers: number;

  activeEffort: number;

  pendingRequests: number;

  pendingEffort: number;

  riskTasks: number;

  blockedTasks: number;

  overdueTasks: number;

  criticalRiskTasks: number;

  highRiskTasks: number;

  healthStatus: HealthStatus;

  healthReasons: string[];
}
interface Props {
  sprints: SprintItem[];

  loading?: boolean;

  onOpenSprint: (sprintId: string) => void;
}

const normalizeStatus = (status?: string) => (status ?? "").toUpperCase();

// ==========================================
// TIMELINE STATUS
// ==========================================

const getSprintTimelineStatus = (sprint: SprintItem): SprintTimelineStatus => {
  const startDate = sprint.startDate ?? sprint.start_date;

  const endDate = sprint.endDate ?? sprint.end_date;

  const normalizedStatus = normalizeStatus(sprint.status);

  if (normalizedStatus === "COMPLETED") {
    return "COMPLETED";
  }

  if (endDate && dayjs().isAfter(dayjs(endDate))) {
    return "COMPLETED";
  }

  if (startDate && dayjs().isBefore(dayjs(startDate))) {
    return "UPCOMING";
  }

  return "ACTIVE";
};

// ==========================================
// HEALTH ENGINE
// ==========================================

const calculateHealth = ({
  sprintStatus,

  totalTasks,

  unassignedTasks,

  taskCoverage,

  activeMembers,

  pendingRequests,

  riskTasks,

  blockedTasks,

  overdueTasks,

  criticalRiskTasks,

  highRiskTasks,
}: {
  sprintStatus: SprintTimelineStatus;

  totalTasks: number;

  unassignedTasks: number;

  taskCoverage: number;

  activeMembers: number;

  pendingRequests: number;

  riskTasks: number;

  blockedTasks: number;

  overdueTasks: number;

  criticalRiskTasks: number;

  highRiskTasks: number;
}): {
  healthStatus: HealthStatus;

  healthReasons: string[];
} => {
  // ========================================
  // COMPLETED
  // ========================================

  if (sprintStatus === "COMPLETED") {
    return {
      healthStatus: "COMPLETED",

      healthReasons: ["Sprint đã kết thúc"],
    };
  }

  // ========================================
  // UPCOMING
  // ========================================

  if (sprintStatus === "UPCOMING") {
    const reasons: string[] = [];

    if (totalTasks === 0) {
      reasons.push("Chưa có task được chuẩn bị");
    }

    if (unassignedTasks > 0) {
      reasons.push(`${unassignedTasks} task chưa có owner`);
    }

    if (pendingRequests > 0) {
      reasons.push(`${pendingRequests} allocation đang chờ`);
    }

    return {
      healthStatus: "PLANNED",

      healthReasons: reasons.length > 0 ? reasons : ["Sprint đã sẵn sàng"],
    };
  }

  // ========================================
  // ACTIVE — CRITICAL
  // ========================================

  const criticalReasons: string[] = [];

  if (criticalRiskTasks > 0) {
    criticalReasons.push(`${criticalRiskTasks} Task Critical`);
  }

  if (totalTasks > 0 && activeMembers === 0) {
    criticalReasons.push("Có task nhưng chưa có nhân sự active");
  }

  if (totalTasks > 0 && unassignedTasks === totalTasks) {
    criticalReasons.push("Toàn bộ task chưa có owner");
  }

  if (criticalReasons.length > 0) {
    return {
      healthStatus: "CRITICAL",

      healthReasons: criticalReasons,
    };
  }

  // ========================================
  // ACTIVE — WARNING
  // ========================================

  const warningReasons: string[] = [];

  if (totalTasks === 0) {
    warningReasons.push("Sprint đang chạy nhưng chưa có task");
  }

  if (blockedTasks > 0) {
    warningReasons.push(`${blockedTasks} task đang Blocked`);
  }

  if (overdueTasks > 0) {
    warningReasons.push(`${overdueTasks} task đã quá hạn`);
  }

  if (highRiskTasks > 0) {
    warningReasons.push(`${highRiskTasks} task High Risk`);
  }

  if (riskTasks > 0 && highRiskTasks === 0) {
    warningReasons.push(`${riskTasks} task cần theo dõi`);
  }

  if (totalTasks > 0 && taskCoverage < 70) {
    warningReasons.push(`Task coverage chỉ ${taskCoverage}%`);
  }

  if (unassignedTasks > 0) {
    warningReasons.push(`${unassignedTasks} task chưa có owner`);
  }

  if (pendingRequests > 0) {
    warningReasons.push(`${pendingRequests} allocation đang chờ phê duyệt`);
  }

  if (warningReasons.length > 0) {
    return {
      healthStatus: "WARNING",

      healthReasons: warningReasons,
    };
  }

  return {
    healthStatus: "HEALTHY",

    healthReasons: ["Task và resource đang ổn định"],
  };
};

// ==========================================
// HEALTH TAG
// ==========================================

const getHealthTag = (status: HealthStatus) => {
  switch (status) {
    case "HEALTHY":
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Ổn định
        </Tag>
      );

    case "WARNING":
      return (
        <Tag color="gold" icon={<ExclamationCircleOutlined />}>
          Cần chú ý
        </Tag>
      );

    case "CRITICAL":
      return (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          Rủi ro cao
        </Tag>
      );

    case "PLANNED":
      return <Tag color="blue">Chuẩn bị</Tag>;

    case "COMPLETED":
      return <Tag>Đã kết thúc</Tag>;

    default:
      return <Tag>-</Tag>;
  }
};

// ==========================================
// SPRINT TAG
// ==========================================

const getSprintStatusTag = (status: SprintTimelineStatus) => {
  if (status === "ACTIVE") {
    return <Tag color="processing">Đang chạy</Tag>;
  }

  if (status === "UPCOMING") {
    return <Tag color="blue">Sắp tới</Tag>;
  }

  return <Tag color="green">Đã hoàn thành</Tag>;
};

// ==========================================
// SORT PRIORITY
// ==========================================

const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  CRITICAL: 1,
  WARNING: 2,
  HEALTHY: 3,
  PLANNED: 4,
  COMPLETED: 5,
};

export const ProjectHealthPanel: React.FC<Props> = ({
  sprints,
  loading = false,
  onOpenSprint,
}) => {
  const [healthLoading, setHealthLoading] = useState(false);

  const [healthRows, setHealthRows] = useState<SprintHealthItem[]>([]);

  const [healthFilter, setHealthFilter] = useState<HealthFilter>("ALL");

  // ==========================================
  // LOAD HEALTH
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadHealth = async () => {
      if (!sprints || sprints.length === 0) {
        setHealthRows([]);
        return;
      }

      try {
        setHealthLoading(true);

        const rows = await Promise.all(
          sprints.map(async (sprint): Promise<SprintHealthItem> => {
            let tasks: TaskItem[] = [];

            let allocations: UserSprintItem[] = [];

            // ======================================
            // TASKS
            // ======================================

            try {
              const tasksResponse = await pmApi.getSprintTasks(sprint.id);

              const taskData =
                tasksResponse?.data?.data ?? tasksResponse?.data ?? [];

              tasks = Array.isArray(taskData) ? taskData : [];
            } catch (error) {
              console.error(
                `[PROJECT HEALTH] Không load được tasks của Sprint ${sprint.id}`,
                error,
              );

              tasks = [];
            }

            // ======================================
            // ALLOCATIONS
            // ======================================

            try {
              const allocationsResponse = await pmApi.getSprintUsers(sprint.id);

              const allocationData =
                allocationsResponse?.data?.data ??
                allocationsResponse?.data ??
                [];

              allocations = Array.isArray(allocationData) ? allocationData : [];
            } catch (error) {
              console.error(
                `[PROJECT HEALTH] Không load được allocation của Sprint ${sprint.id}`,
                error,
              );

              allocations = [];
            }

            // ======================================
            // TASK
            // ======================================

            const totalTasks = tasks.length;

            const assignedTasks = tasks.filter((task) =>
              Boolean(task.userId),
            ).length;

            const unassignedTasks = totalTasks - assignedTasks;

            const taskCoverage =
              totalTasks > 0
                ? Math.round((assignedTasks / totalTasks) * 100)
                : 0;

            // ======================================
            // TASK RISK
            // ======================================

            const taskRisk = summarizeTaskRisks(tasks);

            // ======================================
            // RESOURCE
            // ======================================

            const activeAllocations = allocations.filter(
              (allocation) => normalizeStatus(allocation.status) === "ASSIGNED",
            );

            const pendingAllocations = allocations.filter((allocation) => {
              const status = normalizeStatus(allocation.status);

              return status === "REQUESTED" || status === "PENDING_APPROVAL";
            });

            const uniqueActiveUsers = new Set(
              activeAllocations.map(
                (allocation) =>
                  allocation.userId ?? allocation.user?.id ?? allocation.id,
              ),
            );

            const activeMembers = uniqueActiveUsers.size;

            const activeEffort = activeAllocations.reduce(
              (total, allocation) => total + Number(allocation.percitant ?? 0),
              0,
            );

            const pendingRequests = pendingAllocations.length;

            const pendingEffort = pendingAllocations.reduce(
              (total, allocation) => total + Number(allocation.percitant ?? 0),
              0,
            );

            // ======================================
            // TIMELINE
            // ======================================

            const sprintStatus = getSprintTimelineStatus(sprint);

            // ======================================
            // HEALTH
            // ======================================

            const { healthStatus, healthReasons } = calculateHealth({
              sprintStatus,

              totalTasks,

              unassignedTasks,

              taskCoverage,

              activeMembers,

              pendingRequests,

              riskTasks: taskRisk.riskCount,

              blockedTasks: taskRisk.blockedCount,

              overdueTasks: taskRisk.overdueCount,

              criticalRiskTasks: taskRisk.criticalCount,

              highRiskTasks: taskRisk.highCount,
            });

            // ======================================
            // RESULT
            // ======================================

            return {
              id: sprint.id,

              name: sprint.name ?? "Sprint chưa đặt tên",

              startDate: sprint.startDate ?? sprint.start_date ?? null,

              endDate: sprint.endDate ?? sprint.end_date ?? null,

              sprintStatus,

              totalTasks,

              assignedTasks,

              unassignedTasks,

              taskCoverage,

              activeMembers,

              activeEffort,

              pendingRequests,

              pendingEffort,

              riskTasks: taskRisk.riskCount,

              blockedTasks: taskRisk.blockedCount,

              overdueTasks: taskRisk.overdueCount,

              criticalRiskTasks: taskRisk.criticalCount,

              highRiskTasks: taskRisk.highCount,

              healthStatus,

              healthReasons,
            };
          }),
        );

        if (!cancelled) {
          setHealthRows(rows);
        }
      } catch (error) {
        console.error("[PROJECT HEALTH] Lỗi tổng:", error);
      } finally {
        if (!cancelled) {
          setHealthLoading(false);
        }
      }
    };

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, [sprints]);

  // ==========================================
  // ACTIVE SUMMARY
  // Chỉ KPI của sprint đang chạy
  // ==========================================

  const summary = useMemo(() => {
    const activeSprints = healthRows.filter(
      (item) => item.sprintStatus === "ACTIVE",
    );

    const riskSprints = activeSprints.filter(
      (item) =>
        item.healthStatus === "WARNING" || item.healthStatus === "CRITICAL",
    );

    const criticalSprints = activeSprints.filter(
      (item) => item.healthStatus === "CRITICAL",
    );

    const unassignedTasks = activeSprints.reduce(
      (total, item) => total + item.unassignedTasks,
      0,
    );

    const activeEffort = activeSprints.reduce(
      (total, item) => total + item.activeEffort,
      0,
    );

    return {
      totalSprints: healthRows.length,

      activeSprints: activeSprints.length,

      riskSprints: riskSprints.length,

      criticalSprints: criticalSprints.length,

      unassignedTasks,

      activeEffort,
    };
  }, [healthRows]);

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredRows = useMemo(() => {
    let result = [...healthRows];

    if (healthFilter === "ACTIVE") {
      result = result.filter((item) => item.sprintStatus === "ACTIVE");
    }

    if (healthFilter === "RISK") {
      result = result.filter(
        (item) =>
          item.sprintStatus === "ACTIVE" &&
          (item.healthStatus === "WARNING" || item.healthStatus === "CRITICAL"),
      );
    }

    if (healthFilter === "UPCOMING") {
      result = result.filter((item) => item.sprintStatus === "UPCOMING");
    }

    if (healthFilter === "COMPLETED") {
      result = result.filter((item) => item.sprintStatus === "COMPLETED");
    }

    result.sort(
      (a, b) =>
        HEALTH_PRIORITY[a.healthStatus] - HEALTH_PRIORITY[b.healthStatus],
    );

    return result;
  }, [healthRows, healthFilter]);

  // ==========================================
  // TABLE
  // ==========================================

  const columns = [
    {
      title: "Sprint",
      key: "sprint",
      width: 220,

      render: (_: unknown, record: SprintHealthItem) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.name}</Text>

          <Text
            type="secondary"
            style={{
              fontSize: 12,
            }}
          >
            {record.startDate
              ? dayjs(record.startDate).format("DD/MM/YYYY")
              : "N/A"}

            {" → "}

            {record.endDate
              ? dayjs(record.endDate).format("DD/MM/YYYY")
              : "N/A"}
          </Text>
        </Space>
      ),
    },

    {
      title: "Timeline",
      key: "timeline",
      width: 130,

      render: (_: unknown, record: SprintHealthItem) =>
        getSprintStatusTag(record.sprintStatus),
    },

    {
      title: "Task Coverage",

      key: "tasks",

      width: 230,

      render: (_: unknown, record: SprintHealthItem) => (
        <div
          style={{
            width: 190,
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              marginBottom: 4,
            }}
          >
            <Text type="secondary">
              {record.assignedTasks}/{record.totalTasks} có owner
            </Text>

            <Text strong>{record.taskCoverage}%</Text>
          </div>

          <Progress
            percent={record.taskCoverage}
            showInfo={false}
            size="small"
            status={
              record.totalTasks > 0 && record.taskCoverage < 70
                ? "exception"
                : undefined
            }
          />

          {record.unassignedTasks > 0 && (
            <Text
              type="danger"
              style={{
                fontSize: 12,
              }}
            >
              {record.unassignedTasks} task chưa có owner
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Task Risk",
      key: "taskRisk",
      width: 180,

      render: (_: unknown, record: SprintHealthItem) => {
        if (record.sprintStatus === "COMPLETED") {
          return <Text type="secondary">Không áp dụng</Text>;
        }

        if (record.riskTasks === 0) {
          return <Tag color="green">Không có rủi ro</Tag>;
        }

        return (
          <Space direction="vertical" size={3}>
            <Tag color="gold">{record.riskTasks} risk</Tag>

            {record.blockedTasks > 0 && (
              <Tag color="red">{record.blockedTasks} Blocked</Tag>
            )}

            {record.overdueTasks > 0 && (
              <Tag color="volcano">{record.overdueTasks} Overdue</Tag>
            )}

            {record.criticalRiskTasks > 0 && (
              <Tag color="red">{record.criticalRiskTasks} Critical</Tag>
            )}
          </Space>
        );
      },
    },

    {
      title: "Resource",
      key: "resource",
      width: 190,

      render: (_: unknown, record: SprintHealthItem) => {
        const isUpcoming = record.sprintStatus === "UPCOMING";

        const isCompleted = record.sprintStatus === "COMPLETED";

        if (isCompleted) {
          return <Text type="secondary">Sprint đã kết thúc</Text>;
        }

        return (
          <Space direction="vertical" size={2}>
            <Text>
              <TeamOutlined /> <strong>{record.activeMembers}</strong>{" "}
              {isUpcoming ? "allocated" : "active"}
            </Text>

            <Text type="secondary">
              {isUpcoming ? "Planned effort" : "Active effort"}:{" "}
              <strong>{record.activeEffort}%</strong>
            </Text>
          </Space>
        );
      },
    },

    {
      title: "Pending",
      key: "pending",
      width: 160,

      render: (_: unknown, record: SprintHealthItem) => {
        if (record.sprintStatus === "COMPLETED") {
          return <Text type="secondary">Không áp dụng</Text>;
        }

        if (record.pendingRequests === 0) {
          return <Text type="secondary">Không có</Text>;
        }

        return (
          <Space direction="vertical" size={1}>
            <Tag color="gold">{record.pendingRequests} yêu cầu</Tag>

            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {record.pendingEffort}% reserved
            </Text>
          </Space>
        );
      },
    },

    {
      title: "Health",
      key: "health",
      width: 250,

      render: (_: unknown, record: SprintHealthItem) => (
        <Space direction="vertical" size={4}>
          {getHealthTag(record.healthStatus)}

          {record.healthReasons.map((reason, index) => (
            <Text
              key={`${record.id}-${index}`}
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              • {reason}
            </Text>
          ))}
        </Space>
      ),
    },

    {
      title: "Thao tác",
      key: "action",
      width: 120,

      render: (_: unknown, record: SprintHealthItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => onOpenSprint(record.id)}
        >
          Quản lý
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FundProjectionScreenOutlined />

          <Title
            level={4}
            style={{
              margin: 0,
            }}
          >
            Project Health
          </Title>
        </Space>
      }
      extra={
        <Select
          value={healthFilter}
          onChange={setHealthFilter}
          style={{
            width: 170,
          }}
          options={[
            {
              value: "ALL",
              label: "Tất cả Sprint",
            },

            {
              value: "ACTIVE",
              label: "Đang chạy",
            },

            {
              value: "RISK",
              label: "Có rủi ro",
            },

            {
              value: "UPCOMING",
              label: "Sắp tới",
            },

            {
              value: "COMPLETED",

              label: "Đã kết thúc",
            },
          ]}
        />
      }
      style={{
        marginBottom: 24,
      }}
    >
      <Spin spinning={loading || healthLoading}>
        {healthRows.length > 0 ? (
          <>
            {/* ================================= */}
            {/* ACTIVE SPRINT KPI */}
            {/* ================================= */}

            <div
              style={{
                marginBottom: 8,
              }}
            >
              <Text type="secondary">
                KPI bên dưới chỉ tính các Sprint đang chạy tại thời điểm hiện
                tại.
              </Text>
            </div>

            <Row
              gutter={[16, 16]}
              style={{
                marginBottom: 20,
              }}
            >
              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title="Sprint đang chạy"
                    value={summary.activeSprints}
                    suffix={`/ ${summary.totalSprints}`}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title="Sprint có rủi ro"
                    value={summary.riskSprints}
                  />

                  {summary.criticalSprints > 0 && (
                    <Tag
                      color="red"
                      style={{
                        marginTop: 6,
                      }}
                    >
                      {summary.criticalSprints} critical
                    </Tag>
                  )}
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title="Task chưa owner"
                    value={summary.unassignedTasks}
                  />

                  <Text type="secondary">Chỉ Active Sprint</Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small">
                  <Statistic
                    title="Active Effort"
                    value={summary.activeEffort}
                    suffix="%"
                  />

                  <Text type="secondary">Chỉ Active Sprint</Text>
                </Card>
              </Col>
            </Row>

            {/* ================================= */}
            {/* TABLE */}
            {/* ================================= */}

            <Table
              columns={columns}
              dataSource={filteredRows}
              rowKey="id"
              pagination={false}
              scroll={{
                x: 1300,
              }}
            />
          </>
        ) : (
          !healthLoading && <Empty description="Dự án chưa có Sprint" />
        )}
      </Spin>
    </Card>
  );
};
