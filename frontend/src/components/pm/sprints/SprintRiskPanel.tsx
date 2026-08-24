import React, { useMemo } from "react";

import { Alert, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import type { TaskItem } from "../../../common/types/pm";

const { Text, Title } = Typography;

// ==========================================
// TYPES
// ==========================================

interface DependencyStatus {
  taskId: string;

  totalDependencies: number;

  unfinishedDependencies: number;

  isBlockedByDependency: boolean;
}

interface Props {
  tasks: TaskItem[];

  dependencyStatusMap?: Record<string, DependencyStatus>;
}

type RiskLevel = "SAFE" | "WARNING" | "HIGH" | "CRITICAL";

interface TaskRiskItem {
  task: TaskItem;

  level: RiskLevel;

  reasons: string[];
}

interface DisplayRiskItem extends TaskRiskItem {
  dependencyBlocked: boolean;

  unfinishedDependencies: number;
}

// ==========================================
// NORMALIZE
// ==========================================

const normalizeStatus = (status?: string) => (status ?? "TODO").toUpperCase();

const normalizePriority = (priority?: string) =>
  (priority ?? "MEDIUM").toUpperCase();

// ==========================================
// NORMAL TASK RISK
// ==========================================

const calculateTaskRisk = (task: TaskItem): TaskRiskItem => {
  const reasons: string[] = [];

  const status = normalizeStatus(task.status);

  const priority = normalizePriority(task.priority);

  const progress = Number(task.progress ?? 0);

  const today = dayjs();

  const endDate = task.endDate ? dayjs(task.endDate) : null;

  // ========================================
  // DONE
  // ========================================

  if (status === "DONE") {
    return {
      task,

      level: "SAFE",

      reasons: ["Task đã hoàn thành"],
    };
  }

  // ========================================
  // BLOCKED
  // ========================================

  if (status === "BLOCKED") {
    reasons.push("Task đang bị Blocked");
  }

  // ========================================
  // OVERDUE
  // ========================================

  const isOverdue = Boolean(endDate && today.isAfter(endDate, "day"));

  if (isOverdue) {
    reasons.push("Task đã quá hạn");
  }

  // ========================================
  // NO OWNER
  // ========================================

  if (!task.userId) {
    reasons.push("Task chưa có owner");
  }

  // ========================================
  // CRITICAL PRIORITY
  // ========================================

  if (priority === "CRITICAL") {
    reasons.push("Priority Critical");
  }

  // ========================================
  // NEAR DEADLINE
  // ========================================

  if (endDate && !isOverdue) {
    const remainingDays = endDate.diff(today, "day");

    if (remainingDays <= 2 && progress < 80) {
      reasons.push(
        `Còn ${Math.max(remainingDays, 0)} ngày nhưng tiến độ mới ${progress}%`,
      );
    } else if (remainingDays <= 5 && progress < 50) {
      reasons.push(`Tiến độ thấp (${progress}%) khi deadline đang gần`);
    }
  }

  // ========================================
  // DETERMINE LEVEL
  // ========================================

  const isBlocked = status === "BLOCKED";

  const isCriticalPriority = priority === "CRITICAL";

  if (isOverdue && (isBlocked || isCriticalPriority)) {
    return {
      task,

      level: "CRITICAL",

      reasons,
    };
  }

  if (isBlocked || isOverdue) {
    return {
      task,

      level: "HIGH",

      reasons,
    };
  }

  if (reasons.length > 0) {
    return {
      task,

      level: "WARNING",

      reasons,
    };
  }

  return {
    task,

    level: "SAFE",

    reasons: ["Task đang ổn định"],
  };
};

// ==========================================
// RISK TAG
// ==========================================

const getRiskTag = (level: RiskLevel) => {
  switch (level) {
    case "CRITICAL":
      return (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          Critical
        </Tag>
      );

    case "HIGH":
      return (
        <Tag color="volcano" icon={<WarningOutlined />}>
          High Risk
        </Tag>
      );

    case "WARNING":
      return (
        <Tag color="gold" icon={<ClockCircleOutlined />}>
          Warning
        </Tag>
      );

    default:
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Safe
        </Tag>
      );
  }
};

// ==========================================
// COMPONENT
// ==========================================

export const SprintRiskPanel: React.FC<Props> = ({
  tasks,

  dependencyStatusMap = {},
}) => {
  // ========================================
  // ANALYSIS
  // ========================================

  const analysis = useMemo(() => {
    // ====================================
    // NORMAL TASK RISKS
    // ====================================

    const normalTaskRisks = tasks.map(calculateTaskRisk);

    // ====================================
    // MERGE DEPENDENCY RISK
    // ====================================

    const taskRisks: DisplayRiskItem[] = normalTaskRisks.map((risk) => {
      const dependencyStatus = dependencyStatusMap[risk.task.id];

      const dependencyBlocked =
        dependencyStatus?.isBlockedByDependency ?? false;

      const unfinishedDependencies =
        dependencyStatus?.unfinishedDependencies ?? 0;

      // Copy để không mutate
      // calculateTaskRisk result.
      let level = risk.level;

      let reasons = [...risk.reasons];

      // ==================================
      // DEPENDENCY RISK
      // ==================================

      if (dependencyBlocked) {
        // Nếu task trước đó SAFE
        // thì Dependency Risk ít nhất
        // phải nâng thành WARNING.
        if (level === "SAFE") {
          level = "WARNING";

          // bỏ reason "Task đang ổn định"
          reasons = [];
        }

        reasons.push(
          `Đang chờ ${unfinishedDependencies} dependency hoàn thành`,
        );
      }

      return {
        task: risk.task,

        level,

        reasons,

        dependencyBlocked,

        unfinishedDependencies,
      };
    });

    // ====================================
    // LEVEL GROUPS
    // ====================================

    const critical = taskRisks.filter((item) => item.level === "CRITICAL");

    const high = taskRisks.filter((item) => item.level === "HIGH");

    const warning = taskRisks.filter((item) => item.level === "WARNING");

    const safe = taskRisks.filter((item) => item.level === "SAFE");

    // ====================================
    // DIRECT BLOCKED
    // ====================================

    const blocked = tasks.filter(
      (task) => normalizeStatus(task.status) === "BLOCKED",
    );

    // ====================================
    // OVERDUE
    // ====================================

    const overdue = tasks.filter((task) => {
      if (normalizeStatus(task.status) === "DONE") {
        return false;
      }

      if (!task.endDate) {
        return false;
      }

      return dayjs().isAfter(dayjs(task.endDate), "day");
    });

    // ====================================
    // NO OWNER
    // ====================================

    const noOwner = tasks.filter(
      (task) => !task.userId && normalizeStatus(task.status) !== "DONE",
    );

    // ====================================
    // DEPENDENCY BLOCKED
    // ====================================

    const dependencyBlocked = taskRisks.filter(
      (item) => item.dependencyBlocked,
    );

    // ====================================
    // UNIQUE RISK COUNT
    // ====================================
    //
    // Không cộng:
    // blocked + overdue + dependency
    // vì một task có thể nằm nhiều nhóm.
    //
    // Dùng level != SAFE để mỗi task
    // chỉ được count một lần.
    // ====================================

    const riskCount = taskRisks.filter((item) => item.level !== "SAFE").length;

    return {
      taskRisks,

      critical,

      high,

      warning,

      safe,

      blocked,

      overdue,

      noOwner,

      dependencyBlocked,

      riskCount,
    };
  }, [
    tasks,

    // QUAN TRỌNG:
    // dependency thay đổi phải tính lại.
    dependencyStatusMap,
  ]);

  // ========================================
  // SORT RISK
  // ========================================

  const riskyTasks = useMemo(() => {
    const priority: Record<RiskLevel, number> = {
      CRITICAL: 1,

      HIGH: 2,

      WARNING: 3,

      SAFE: 4,
    };

    return analysis.taskRisks
      .filter((item) => item.level !== "SAFE")
      .sort((a, b) => priority[a.level] - priority[b.level]);
  }, [analysis.taskRisks]);

  // ========================================
  // UI
  // ========================================

  return (
    <Card
      style={{
        marginBottom: 20,
      }}
    >
      {/* ==================================== */}
      {/* HEADER */}
      {/* ==================================== */}

      <div
        style={{
          marginBottom: 16,
        }}
      >
        <Title
          level={5}
          style={{
            margin: 0,
          }}
        >
          Sprint Risk Monitor
        </Title>

        <Text type="secondary">
          Tự động phát hiện Task Blocked, quá hạn, thiếu owner, gần deadline
          hoặc đang bị chặn bởi Task Dependency.
        </Text>
      </div>

      {/* ==================================== */}
      {/* KPI */}
      {/* ==================================== */}

      <Row
        gutter={[12, 12]}
        style={{
          marginBottom: 18,
        }}
      >
        <Col flex="1 1 180px">
          <Card size="small">
            <Statistic
              title="Task rủi ro"
              value={analysis.riskCount}
              suffix={`/ ${tasks.length}`}
            />
          </Card>
        </Col>

        <Col flex="1 1 180px">
          <Card size="small">
            <Statistic title="Blocked" value={analysis.blocked.length} />
          </Card>
        </Col>

        <Col flex="1 1 180px">
          <Card size="small">
            <Statistic title="Quá hạn" value={analysis.overdue.length} />
          </Card>
        </Col>

        <Col flex="1 1 180px">
          <Card size="small">
            <Statistic title="Chưa có owner" value={analysis.noOwner.length} />
          </Card>
        </Col>

        <Col flex="1 1 180px">
          <Card size="small">
            <Statistic
              title="Dependency Risk"
              value={analysis.dependencyBlocked.length}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ==================================== */}
      {/* CRITICAL ALERT */}
      {/* ==================================== */}

      {analysis.critical.length > 0 && (
        <Alert
          type="error"
          showIcon
          title={`${analysis.critical.length} Task Critical cần xử lý ngay`}
          description="Task quá hạn kết hợp Blocked hoặc Priority Critical."
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* ==================================== */}
      {/* DEPENDENCY ALERT */}
      {/* ==================================== */}

      {analysis.dependencyBlocked.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`${analysis.dependencyBlocked.length} Task đang bị chặn bởi Dependency`}
          description="Các prerequisite Task phải hoàn thành trước khi những Task phụ thuộc có thể tiếp tục."
          style={{
            marginBottom: 16,
          }}
        />
      )}

      {/* ==================================== */}
      {/* RISK TASK LIST */}
      {/* ==================================== */}

      {riskyTasks.length > 0 ? (
        <Space
          direction="vertical"
          size="middle"
          style={{
            width: "100%",
          }}
        >
          {riskyTasks.map(
            ({
              task,

              level,

              reasons,

              dependencyBlocked,

              unfinishedDependencies,
            }) => (
              <Card key={task.id} size="small">
                <div
                  style={{
                    display: "flex",

                    justifyContent: "space-between",

                    gap: 16,

                    alignItems: "flex-start",
                  }}
                >
                  {/* LEFT */}

                  <div>
                    <Space
                      wrap
                      style={{
                        marginBottom: 6,
                      }}
                    >
                      <Text strong>{task.title ?? "Task chưa đặt tên"}</Text>

                      {getRiskTag(level)}

                      {task.priority && <Tag>{task.priority}</Tag>}

                      {/* ================= */}
                      {/* DEPENDENCY TAG */}
                      {/* ================= */}

                      {dependencyBlocked && (
                        <Tag color="orange" icon={<LockOutlined />}>
                          Dependency Risk
                          {" · "}
                          Chờ {unfinishedDependencies} task
                        </Tag>
                      )}
                    </Space>

                    {/* =================== */}
                    {/* REASONS */}
                    {/* =================== */}

                    <Space direction="vertical" size={2}>
                      {reasons.map((reason, index) => (
                        <Text
                          key={`${task.id}-${index}`}
                          type={
                            level === "CRITICAL" || level === "HIGH"
                              ? "danger"
                              : "secondary"
                          }
                        >
                          • {reason}
                        </Text>
                      ))}
                    </Space>
                  </div>

                  {/* RIGHT */}

                  <div
                    style={{
                      minWidth: 90,

                      textAlign: "right",
                    }}
                  >
                    <Text type="secondary">Progress</Text>

                    <div>
                      <Text strong>{Number(task.progress ?? 0)}%</Text>
                    </div>
                  </div>
                </div>
              </Card>
            ),
          )}
        </Space>
      ) : (
        <Alert
          type="success"
          showIcon
          title="Sprint hiện không có Task rủi ro"
        />
      )}
    </Card>
  );
};
