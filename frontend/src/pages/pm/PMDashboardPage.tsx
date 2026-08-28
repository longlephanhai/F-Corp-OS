import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

import { pmApi } from "../../api/pm";

import { summarizeTaskRisks } from "../../utils/pm/taskRisk";

import type {
  ProjectItem,
  TaskItem,
  UserSprintItem,
} from "../../common/types/pm";

const { Title, Text } = Typography;

// ==========================================
// TYPES
// ==========================================

type ProjectHealth = "HEALTHY" | "WARNING" | "CRITICAL" | "NO_ACTIVE_SPRINT";

interface SprintApiItem {
  id: string;

  name?: string;

  startDate?: string;
  endDate?: string;

  start_date?: string;
  end_date?: string;

  status?: string;
}

interface ProjectDashboardItem {
  id: string;

  name: string;

  description?: string;

  status?: string;

  startDate?: string;
  endDate?: string;

  totalSprints: number;

  activeSprints: number;

  totalTasks: number;

  unassignedTasks: number;

  activeMembers: number;

  activeEffort: number;

  pendingAllocations: number;

  pendingEffort: number;

  // ========================================
  // TASK RISK
  // ========================================

  riskTasks: number;

  blockedTasks: number;

  overdueTasks: number;

  criticalRiskTasks: number;

  highRiskTasks: number;

  // ========================================
  // DEPENDENCY RISK
  // ========================================

  dependencyRiskTasks: number;

  unfinishedDependencies: number;

  // ========================================
  // HEALTH
  // ========================================

  health: ProjectHealth;

  healthReasons: string[];
}

// ==========================================
// NORMALIZE
// ==========================================

const normalizeStatus = (status?: string) =>
  (status ?? "").toString().toUpperCase();

// ==========================================
// ACTIVE SPRINT
// ==========================================
//
// Sprint lifecycle hiện đã được quản lý
// bằng status thật.
//
// Không dùng ngày để suy luận ACTIVE nữa.
//
// Sprint quá deadline nhưng status vẫn ACTIVE
// vẫn phải xuất hiện trên Dashboard để PM
// nhìn thấy overdue/risk.
// ==========================================

const isActiveSprint = (sprint: SprintApiItem) =>
  normalizeStatus(sprint.status) === "ACTIVE";

// ==========================================
// PROJECT HEALTH ENGINE
// ==========================================

const calculateProjectHealth = ({
  activeSprints,

  totalTasks,

  unassignedTasks,

  activeMembers,

  pendingAllocations,

  riskTasks,

  blockedTasks,

  overdueTasks,

  criticalRiskTasks,

  highRiskTasks,

  dependencyRiskTasks,

  unfinishedDependencies,
}: {
  activeSprints: number;

  totalTasks: number;

  unassignedTasks: number;

  activeMembers: number;

  pendingAllocations: number;

  riskTasks: number;

  blockedTasks: number;

  overdueTasks: number;

  criticalRiskTasks: number;

  highRiskTasks: number;

  dependencyRiskTasks: number;

  unfinishedDependencies: number;
}): {
  health: ProjectHealth;

  reasons: string[];
} => {
  // ========================================
  // NO ACTIVE SPRINT
  // ========================================

  if (activeSprints === 0) {
    return {
      health: "NO_ACTIVE_SPRINT",

      reasons: ["Không có Sprint đang chạy"],
    };
  }

  // ========================================
  // CRITICAL
  // ========================================

  const criticalReasons: string[] = [];

  if (criticalRiskTasks > 0) {
    criticalReasons.push(`${criticalRiskTasks} Task Critical`);
  }

  if (totalTasks > 0 && activeMembers === 0) {
    criticalReasons.push("Có task đang chạy nhưng chưa có resource active");
  }

  if (totalTasks > 0 && unassignedTasks === totalTasks) {
    criticalReasons.push("Toàn bộ task của Active Sprint chưa có owner");
  }

  if (criticalReasons.length > 0) {
    return {
      health: "CRITICAL",

      reasons: criticalReasons,
    };
  }

  // ========================================
  // WARNING
  // ========================================

  const warningReasons: string[] = [];

  if (dependencyRiskTasks > 0) {
    warningReasons.push(`${dependencyRiskTasks} task đang chờ dependency`);
  }

  if (unfinishedDependencies > 0) {
    warningReasons.push(
      `${unfinishedDependencies} prerequisite chưa hoàn thành`,
    );
  }

  if (totalTasks === 0) {
    warningReasons.push("Active Sprint chưa có task");
  }

  if (blockedTasks > 0) {
    warningReasons.push(`${blockedTasks} task Blocked`);
  }

  if (overdueTasks > 0) {
    warningReasons.push(`${overdueTasks} task quá hạn`);
  }

  if (highRiskTasks > 0) {
    warningReasons.push(`${highRiskTasks} task High Risk`);
  }

  if (riskTasks > 0 && highRiskTasks === 0) {
    warningReasons.push(`${riskTasks} task cần theo dõi`);
  }

  if (unassignedTasks > 0) {
    warningReasons.push(`${unassignedTasks} task chưa có owner`);
  }

  if (pendingAllocations > 0) {
    warningReasons.push(`${pendingAllocations} allocation đang chờ`);
  }

  if (warningReasons.length > 0) {
    return {
      health: "WARNING",

      reasons: warningReasons,
    };
  }

  // ========================================
  // HEALTHY
  // ========================================

  return {
    health: "HEALTHY",

    reasons: ["Project đang vận hành ổn định"],
  };
};

// ==========================================
// HEALTH TAG
// ==========================================

const getHealthTag = (health: ProjectHealth) => {
  if (health === "CRITICAL") {
    return (
      <Tag color="red" icon={<ExclamationCircleOutlined />}>
        Rủi ro cao
      </Tag>
    );
  }

  if (health === "WARNING") {
    return (
      <Tag color="gold" icon={<ExclamationCircleOutlined />}>
        Cần chú ý
      </Tag>
    );
  }

  if (health === "HEALTHY") {
    return (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Ổn định
      </Tag>
    );
  }

  return <Tag>Không có Active Sprint</Tag>;
};

// ==========================================
// DEPENDENCY SUMMARY
// ==========================================

const loadTaskDependencySummary = async (tasks: TaskItem[]) => {
  const unfinishedTasks = tasks.filter((task) => {
    const status = (task.status ?? "").toString().toUpperCase();

    const progress = Number(task.progress ?? 0);

    return status !== "DONE" || progress < 100;
  });

  if (unfinishedTasks.length === 0) {
    return {
      dependencyRiskTasks: 0,

      unfinishedDependencies: 0,
    };
  }

  const statuses = await Promise.all(
    unfinishedTasks.map(async (task) => {
      try {
        const response = await pmApi.getTaskDependencyStatus(task.id);

        const data = response?.data?.data ?? response?.data;

        return {
          isBlockedByDependency: Boolean(data?.isBlockedByDependency),

          unfinishedDependencies: Number(data?.unfinishedDependencies ?? 0),
        };
      } catch (error) {
        console.error(
          `[PM DASHBOARD] Không load dependency status Task ${task.id}`,
          error,
        );

        // Một Task lỗi dependency API
        // không được làm toàn Dashboard fail.
        return {
          isBlockedByDependency: false,

          unfinishedDependencies: 0,
        };
      }
    }),
  );

  return {
    dependencyRiskTasks: statuses.filter(
      (status) => status.isBlockedByDependency,
    ).length,

    unfinishedDependencies: statuses.reduce(
      (total, status) => total + status.unfinishedDependencies,
      0,
    ),
  };
};

// ==========================================
// PAGE
// ==========================================

export const PMDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<ProjectDashboardItem[]>([]);

  // ========================================
  // FETCH DASHBOARD
  // ========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // ==================================
      // PROJECTS
      // ==================================

      const projectsResponse = await pmApi.getMyProjects();

      const projectList: ProjectItem[] =
        projectsResponse?.data?.data ?? projectsResponse?.data ?? [];

      // ==================================
      // EACH PROJECT
      // ==================================

      const projectRows = await Promise.all(
        projectList.map(async (project): Promise<ProjectDashboardItem> => {
          // ==========================
          // SPRINTS
          // ==========================

          const sprintResponse = await pmApi.getSprintsByProject(project.id);

          const sprints: SprintApiItem[] =
            sprintResponse?.data?.data ?? sprintResponse?.data ?? [];

          const activeSprints = sprints.filter(isActiveSprint);

          // ==========================
          // LOAD ACTIVE SPRINT DATA
          // ==========================

          const activeSprintDetails = await Promise.all(
            activeSprints.map(async (sprint) => {
              try {
                const [taskResponse, allocationResponse] = await Promise.all([
                  pmApi.getSprintTasks(sprint.id),

                  pmApi.getSprintUsers(sprint.id),
                ]);

                const tasks: TaskItem[] =
                  taskResponse?.data?.data ?? taskResponse?.data ?? [];

                const allocations: UserSprintItem[] =
                  allocationResponse?.data?.data ??
                  allocationResponse?.data ??
                  [];

                return {
                  sprint,

                  tasks,

                  allocations,
                };
              } catch (error) {
                console.error(
                  `[PM DASHBOARD] Không load được Sprint ${sprint.id}`,
                  error,
                );

                // Một Sprint lỗi không được
                // làm toàn Dashboard fail.
                return {
                  sprint,

                  tasks: [] as TaskItem[],

                  allocations: [] as UserSprintItem[],
                };
              }
            }),
          );

          // ==========================
          // ALL ACTIVE TASKS
          // ==========================

          const activeTasks = activeSprintDetails.flatMap((item) => item.tasks);

          // ==========================
          // TASK RISK ENGINE
          // ==========================

          const taskRisk = summarizeTaskRisks(activeTasks);

          // ==========================
          // DEPENDENCY RISK
          // ==========================

          const dependencyRisk = await loadTaskDependencySummary(activeTasks);

          // ==========================
          // TASK SUMMARY
          // ==========================

          const totalTasks = activeTasks.length;

          const unassignedTasks = activeTasks.filter(
            (task) => !task.userId && normalizeStatus(task.status) !== "DONE",
          ).length;

          // ==========================
          // ALLOCATION
          // ==========================

          const assignedAllocations = activeSprintDetails.flatMap((item) =>
            item.allocations.filter(
              (allocation) => normalizeStatus(allocation.status) === "ASSIGNED",
            ),
          );

          const pendingAllocations = activeSprintDetails.flatMap((item) =>
            item.allocations.filter((allocation) => {
              const status = normalizeStatus(allocation.status);

              return status === "REQUESTED" || status === "PENDING_APPROVAL";
            }),
          );

          // ==========================
          // UNIQUE ACTIVE USERS
          // ==========================

          const activeUserIds = new Set(
            assignedAllocations.map(
              (allocation) =>
                allocation.userId ?? allocation.user?.id ?? allocation.id,
            ),
          );

          const activeMembers = activeUserIds.size;

          // ==========================
          // ACTIVE EFFORT
          // ==========================

          const activeEffort = assignedAllocations.reduce(
            (total, allocation) => total + Number(allocation.percitant ?? 0),
            0,
          );

          // ==========================
          // PENDING EFFORT
          // ==========================

          const pendingEffort = pendingAllocations.reduce(
            (total, allocation) => total + Number(allocation.percitant ?? 0),
            0,
          );

          // ==========================
          // HEALTH
          // ==========================

          const { health, reasons } = calculateProjectHealth({
            activeSprints: activeSprints.length,

            totalTasks,

            unassignedTasks,

            activeMembers,

            pendingAllocations: pendingAllocations.length,

            riskTasks: taskRisk.riskCount,

            blockedTasks: taskRisk.blockedCount,

            overdueTasks: taskRisk.overdueCount,

            criticalRiskTasks: taskRisk.criticalCount,

            highRiskTasks: taskRisk.highCount,

            dependencyRiskTasks: dependencyRisk.dependencyRiskTasks,

            unfinishedDependencies: dependencyRisk.unfinishedDependencies,
          });

          // ==========================
          // PROJECT RESULT
          // ==========================

          return {
            id: project.id,

            name: project.name,

            description: project.description,

            status: project.status,

            startDate: project.startDate,

            endDate: project.endDate,

            totalSprints: sprints.length,

            activeSprints: activeSprints.length,

            totalTasks,

            unassignedTasks,

            activeMembers,

            activeEffort,

            pendingAllocations: pendingAllocations.length,

            pendingEffort,

            // =======================
            // NORMAL RISK
            // =======================

            riskTasks: taskRisk.riskCount,

            blockedTasks: taskRisk.blockedCount,

            overdueTasks: taskRisk.overdueCount,

            criticalRiskTasks: taskRisk.criticalCount,

            highRiskTasks: taskRisk.highCount,

            // =======================
            // DEPENDENCY RISK
            // =======================

            dependencyRiskTasks: dependencyRisk.dependencyRiskTasks,

            unfinishedDependencies: dependencyRisk.unfinishedDependencies,

            // =======================
            // HEALTH
            // =======================

            health,

            healthReasons: reasons,
          };
        }),
      );

      setProjects(projectRows);
    } catch (error) {
      console.error("Lỗi tải PM Dashboard:", error);

      message.error("Không thể tải dữ liệu Dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  // ========================================
  // GLOBAL SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const activeProjects = projects.filter(
      (project) => normalizeStatus(project.status) === "ACTIVE",
    ).length;

    const riskProjects = projects.filter(
      (project) =>
        project.health === "CRITICAL" || project.health === "WARNING",
    ).length;

    const criticalProjects = projects.filter(
      (project) => project.health === "CRITICAL",
    ).length;

    const activeSprints = projects.reduce(
      (total, project) => total + project.activeSprints,
      0,
    );

    const unassignedTasks = projects.reduce(
      (total, project) => total + project.unassignedTasks,
      0,
    );

    const pendingAllocations = projects.reduce(
      (total, project) => total + project.pendingAllocations,
      0,
    );

    const riskTasks = projects.reduce(
      (total, project) => total + project.riskTasks,
      0,
    );

    const blockedTasks = projects.reduce(
      (total, project) => total + project.blockedTasks,
      0,
    );

    const overdueTasks = projects.reduce(
      (total, project) => total + project.overdueTasks,
      0,
    );

    // ====================================
    // DEPENDENCY SUMMARY
    // ====================================

    const dependencyRiskTasks = projects.reduce(
      (total, project) => total + Number(project.dependencyRiskTasks ?? 0),
      0,
    );

    const unfinishedDependencies = projects.reduce(
      (total, project) => total + Number(project.unfinishedDependencies ?? 0),
      0,
    );

    return {
      totalProjects: projects.length,

      activeProjects,

      riskProjects,

      criticalProjects,

      activeSprints,

      unassignedTasks,

      pendingAllocations,

      riskTasks,

      blockedTasks,

      overdueTasks,

      dependencyRiskTasks,

      unfinishedDependencies,
    };
  }, [projects]);

  // ========================================
  // SORT
  // CRITICAL lên trước
  // ========================================

  const sortedProjects = useMemo(() => {
    const priority: Record<ProjectHealth, number> = {
      CRITICAL: 1,

      WARNING: 2,

      HEALTHY: 3,

      NO_ACTIVE_SPRINT: 4,
    };

    return [...projects].sort(
      (a, b) => priority[a.health] - priority[b.health],
    );
  }, [projects]);

  // ========================================
  // TABLE COLUMNS
  // ========================================

  const columns = [
    // ======================================
    // PROJECT
    // ======================================

    {
      title: "Project",

      key: "project",

      width: 260,

      render: (_: unknown, record: ProjectDashboardItem) => (
        <Space direction="vertical" size={2}>
          <Space>
            <FolderOpenOutlined />

            <Text strong>{record.name}</Text>
          </Space>

          {record.description && (
            <Text
              type="secondary"
              ellipsis
              style={{
                maxWidth: 240,
              }}
            >
              {record.description}
            </Text>
          )}

          {(record.startDate || record.endDate) && (
            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {record.startDate ?? "N/A"}

              {" → "}

              {record.endDate ?? "N/A"}
            </Text>
          )}
        </Space>
      ),
    },

    // ======================================
    // SPRINT
    // ======================================

    {
      title: "Sprint",

      key: "sprint",

      width: 150,

      render: (_: unknown, record: ProjectDashboardItem) => (
        <Space direction="vertical" size={2}>
          <Text>
            <strong>{record.activeSprints}</strong> đang chạy
          </Text>

          <Text type="secondary">{record.totalSprints} tổng Sprint</Text>
        </Space>
      ),
    },

    // ======================================
    // TASK
    // ======================================

    {
      title: "Task",

      key: "task",

      width: 190,

      render: (_: unknown, record: ProjectDashboardItem) => {
        const coverage =
          record.totalTasks > 0
            ? Math.round(
                ((record.totalTasks - record.unassignedTasks) /
                  record.totalTasks) *
                  100,
              )
            : 0;

        return (
          <div
            style={{
              width: 150,
            }}
          >
            <Text>{record.totalTasks} task</Text>

            {record.unassignedTasks > 0 && (
              <div
                style={{
                  marginTop: 4,
                }}
              >
                <Tag color="orange">{record.unassignedTasks} thiếu owner</Tag>
              </div>
            )}

            {record.totalTasks > 0 && (
              <Progress
                percent={coverage}
                size="small"
                showInfo={false}
                status={coverage < 70 ? "exception" : undefined}
              />
            )}
          </div>
        );
      },
    },

    // ======================================
    // RISK
    // ======================================

    {
      title: "Risk",

      key: "risk",

      width: 180,

      render: (_: unknown, record: ProjectDashboardItem) => {
        if (record.riskTasks === 0) {
          return <Tag color="green">Không có</Tag>;
        }

        return (
          <Space direction="vertical" size={3}>
            <Tag color="gold">{record.riskTasks} task risk</Tag>

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

    // ======================================
    // DEPENDENCY
    // ======================================

    {
      title: "Dependency",

      key: "dependency",

      width: 190,

      render: (_: unknown, record: ProjectDashboardItem) => {
        if (record.dependencyRiskTasks === 0) {
          return <Tag color="green">Không bị khóa</Tag>;
        }

        return (
          <Space direction="vertical" size={3}>
            <Tag color="orange">{record.dependencyRiskTasks} Task bị khóa</Tag>

            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {record.unfinishedDependencies} prerequisite chưa xong
            </Text>
          </Space>
        );
      },
    },

    // ======================================
    // RESOURCE
    // ======================================

    {
      title: "Resource",

      key: "resource",

      width: 180,

      render: (_: unknown, record: ProjectDashboardItem) => (
        <Space direction="vertical" size={2}>
          <Text>
            <TeamOutlined /> <strong>{record.activeMembers}</strong> active
          </Text>

          <Text type="secondary">
            Effort: <strong>{record.activeEffort}%</strong>
          </Text>
        </Space>
      ),
    },

    // ======================================
    // PENDING
    // ======================================

    {
      title: "Pending",

      key: "pending",

      width: 150,

      render: (_: unknown, record: ProjectDashboardItem) =>
        record.pendingAllocations > 0 ? (
          <Space direction="vertical" size={2}>
            <Tag color="gold">{record.pendingAllocations} yêu cầu</Tag>

            <Text
              type="secondary"
              style={{
                fontSize: 12,
              }}
            >
              {record.pendingEffort}% reserved
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Không có</Text>
        ),
    },

    // ======================================
    // HEALTH
    // ======================================

    {
      title: "Health",

      key: "health",

      width: 280,

      render: (_: unknown, record: ProjectDashboardItem) => (
        <Space direction="vertical" size={4}>
          {getHealthTag(record.health)}

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

    // ======================================
    // ACTION
    // ======================================

    {
      title: "Thao tác",

      key: "action",

      width: 120,

      render: (_: unknown, record: ProjectDashboardItem) => (
        <Button
          type="link"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/pm/projects/${record.id}`)}
        >
          Mở
        </Button>
      ),
    },
  ];

  // ========================================
  // UI
  // ========================================

  return (
    <div>
      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <Card
        style={{
          marginBottom: 20,
        }}
      >
        <Space direction="vertical" size={4}>
          <Title
            level={2}
            style={{
              margin: 0,
            }}
          >
            PM Dashboard
          </Title>

          <Text type="secondary">
            Tổng quan Project, Sprint, Task, Risk, Dependency và Resource cần PM
            chú ý.
          </Text>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* ================================ */}
        {/* PROJECT KPI */}
        {/* ================================ */}

        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 16,
          }}
        >
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Project của tôi"
                value={summary.totalProjects}
                prefix={<ProjectOutlined />}
              />

              <Text type="secondary">
                {summary.activeProjects} project active
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic title="Active Sprint" value={summary.activeSprints} />

              <Text type="secondary">Đang thực hiện</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Project có rủi ro"
                value={summary.riskProjects}
              />

              {summary.criticalProjects > 0 && (
                <Tag
                  color="red"
                  style={{
                    marginTop: 6,
                  }}
                >
                  {summary.criticalProjects} critical
                </Tag>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="Allocation chờ"
                value={summary.pendingAllocations}
                suffix="yêu cầu"
              />
            </Card>
          </Col>
        </Row>

        {/* ================================ */}
        {/* TASK RISK KPI */}
        {/* ================================ */}

        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 16,
          }}
        >
          <Col xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic
                title="Task chưa owner"
                value={summary.unassignedTasks}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic title="Task rủi ro" value={summary.riskTasks} />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic title="Blocked" value={summary.blockedTasks} />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic title="Overdue" value={summary.overdueTasks} />
            </Card>
          </Col>
        </Row>

        {/* ================================ */}
        {/* DEPENDENCY KPI */}
        {/* ================================ */}

        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 20,
          }}
        >
          <Col xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic
                title="Dependency Risk"
                value={summary.dependencyRiskTasks}
              />

              <Text type="secondary">
                {summary.unfinishedDependencies} prerequisite chưa hoàn thành
              </Text>
            </Card>
          </Col>
        </Row>

        {/* ================================ */}
        {/* CRITICAL ALERT */}
        {/* ================================ */}

        {summary.criticalProjects > 0 && (
          <Alert
            type="error"
            showIcon
            title={`${summary.criticalProjects} Project đang có rủi ro cao`}
            description="Kiểm tra Project được đánh dấu Critical bên dưới trước."
            style={{
              marginBottom: 20,
            }}
          />
        )}

        {/* ================================ */}
        {/* DEPENDENCY ALERT */}
        {/* ================================ */}

        {summary.dependencyRiskTasks > 0 && (
          <Alert
            type="warning"
            showIcon
            title={`${summary.dependencyRiskTasks} Task đang bị khóa bởi Dependency`}
            description={`${summary.unfinishedDependencies} prerequisite vẫn chưa hoàn thành trong các Active Sprint.`}
            style={{
              marginBottom: 20,
            }}
          />
        )}

        {/* ================================ */}
        {/* BLOCKED / OVERDUE ALERT */}
        {/* ================================ */}

        {(summary.blockedTasks > 0 || summary.overdueTasks > 0) && (
          <Alert
            type="warning"
            showIcon
            title="Có Task cần PM xử lý"
            description={
              <Space wrap>
                {summary.blockedTasks > 0 && (
                  <Tag color="red">{summary.blockedTasks} Blocked</Tag>
                )}

                {summary.overdueTasks > 0 && (
                  <Tag color="volcano">{summary.overdueTasks} Overdue</Tag>
                )}
              </Space>
            }
            style={{
              marginBottom: 20,
            }}
          />
        )}

        {/* ================================ */}
        {/* PROJECT TABLE */}
        {/* ================================ */}

        <Card
          title="Tình trạng Project"
          extra={
            <Button onClick={() => navigate("/pm/projects")}>
              Xem danh sách Project
            </Button>
          }
        >
          {sortedProjects.length > 0 ? (
            <Table
              columns={columns}
              dataSource={sortedProjects}
              rowKey="id"
              pagination={{
                pageSize: 8,

                showSizeChanger: false,
              }}
              scroll={{
                x: 1550,
              }}
            />
          ) : (
            !loading && <Empty description="PM chưa có Project" />
          )}
        </Card>
      </Spin>
    </div>
  );
};
