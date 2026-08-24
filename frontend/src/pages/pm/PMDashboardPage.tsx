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
import dayjs from "dayjs";

import { pmApi } from "../../api/pm";

import type {
  ProjectItem,
  TaskItem,
  UserSprintItem,
} from "../../common/types/pm";

const { Title, Text } = Typography;

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

  health: ProjectHealth;
  healthReasons: string[];
}

const normalizeStatus = (status?: string) => (status ?? "").toUpperCase();

const isActiveSprint = (sprint: SprintApiItem) => {
  const normalized = normalizeStatus(sprint.status);

  if (normalized === "COMPLETED" || normalized === "CANCELLED") {
    return false;
  }

  const startDate = sprint.startDate ?? sprint.start_date;

  const endDate = sprint.endDate ?? sprint.end_date;

  const now = dayjs();

  if (startDate && now.isBefore(dayjs(startDate))) {
    return false;
  }

  if (endDate && now.isAfter(dayjs(endDate))) {
    return false;
  }

  return true;
};

const calculateProjectHealth = ({
  activeSprints,
  totalTasks,
  unassignedTasks,
  activeMembers,
  pendingAllocations,
}: {
  activeSprints: number;
  totalTasks: number;
  unassignedTasks: number;
  activeMembers: number;
  pendingAllocations: number;
}): {
  health: ProjectHealth;
  reasons: string[];
} => {
  if (activeSprints === 0) {
    return {
      health: "NO_ACTIVE_SPRINT",
      reasons: ["Không có Sprint đang chạy"],
    };
  }

  const criticalReasons: string[] = [];

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

  const warningReasons: string[] = [];

  if (totalTasks === 0) {
    warningReasons.push("Active Sprint chưa có task");
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

  return {
    health: "HEALTHY",
    reasons: ["Project đang vận hành ổn định"],
  };
};

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

export const PMDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<ProjectDashboardItem[]>([]);

  // ==========================================
  // FETCH DASHBOARD
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const projectsResponse = await pmApi.getMyProjects();

      const projectList: ProjectItem[] =
        projectsResponse?.data?.data ?? projectsResponse?.data ?? [];

      const projectRows = await Promise.all(
        projectList.map(async (project): Promise<ProjectDashboardItem> => {
          const sprintResponse = await pmApi.getSprintsByProject(project.id);

          const sprints: SprintApiItem[] =
            sprintResponse?.data?.data ?? sprintResponse?.data ?? [];

          const activeSprints = sprints.filter(isActiveSprint);

          // Chỉ lấy chi tiết những Sprint
          // đang hoạt động.
          const activeSprintDetails = await Promise.all(
            activeSprints.map(async (sprint) => {
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
            }),
          );

          // ==============================
          // TASK
          // ==============================

          const totalTasks = activeSprintDetails.reduce(
            (total, item) => total + item.tasks.length,
            0,
          );

          const unassignedTasks = activeSprintDetails.reduce(
            (total, item) =>
              total + item.tasks.filter((task) => !task.userId).length,
            0,
          );

          // ==============================
          // ACTIVE ALLOCATION
          // ==============================

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

          const activeUserIds = new Set(
            assignedAllocations.map(
              (allocation) =>
                allocation.userId ?? allocation.user?.id ?? allocation.id,
            ),
          );

          const activeMembers = activeUserIds.size;

          const activeEffort = assignedAllocations.reduce(
            (total, allocation) => total + Number(allocation.percitant ?? 0),
            0,
          );

          const pendingEffort = pendingAllocations.reduce(
            (total, allocation) => total + Number(allocation.percitant ?? 0),
            0,
          );

          // ==============================
          // HEALTH
          // ==============================

          const { health, reasons } = calculateProjectHealth({
            activeSprints: activeSprints.length,

            totalTasks,

            unassignedTasks,

            activeMembers,

            pendingAllocations: pendingAllocations.length,
          });

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

  // ==========================================
  // SUMMARY
  // ==========================================

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

    const activeEffort = projects.reduce(
      (total, project) => total + project.activeEffort,
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

      activeEffort,

      activeFte: activeEffort / 100,
    };
  }, [projects]);

  // ==========================================
  // SORT
  // ==========================================

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

  // ==========================================
  // TABLE
  // ==========================================

  const columns = [
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

    {
      title: "Task",
      key: "task",
      width: 180,

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
              width: 140,
            }}
          >
            <Space>
              <Text>{record.totalTasks} task</Text>

              {record.unassignedTasks > 0 && (
                <Tag color="red">{record.unassignedTasks} thiếu owner</Tag>
              )}
            </Space>

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

    {
      title: "Health",
      key: "health",
      width: 250,

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

  return (
    <div>
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <Card
        bordered={false}
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
            Tổng quan Project, Sprint, Task và Resource cần PM chú ý.
          </Text>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* ==================================== */}
        {/* PROJECT KPI */}
        {/* ==================================== */}

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

        {/* ==================================== */}
        {/* RESOURCE KPI */}
        {/* ==================================== */}

        <Row
          gutter={[16, 16]}
          style={{
            marginBottom: 20,
          }}
        >
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Task chưa owner"
                value={summary.unassignedTasks}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Active Effort"
                value={summary.activeEffort}
                suffix="%"
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Active FTE"
                value={summary.activeFte}
                precision={1}
                suffix="FTE"
              />
            </Card>
          </Col>
        </Row>

        {/* ==================================== */}
        {/* ALERT */}
        {/* ==================================== */}

        {summary.criticalProjects > 0 && (
          <Alert
            type="error"
            showIcon
            title={`${summary.criticalProjects} Project đang có rủi ro cao`}
            description="Kiểm tra các Project được đánh dấu đỏ bên dưới trước."
            style={{
              marginBottom: 20,
            }}
          />
        )}

        {/* ==================================== */}
        {/* PROJECT TABLE */}
        {/* ==================================== */}

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
                x: 1200,
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
