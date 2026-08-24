import React, { useMemo } from "react";

import { Alert, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import type { TaskItem } from "../../../common/types/pm";

const { Text, Title } = Typography;

interface Props {
  tasks: TaskItem[];
}

type RiskLevel = "SAFE" | "WARNING" | "HIGH" | "CRITICAL";

interface TaskRiskItem {
  task: TaskItem;
  level: RiskLevel;
  reasons: string[];
}

const normalizeStatus = (status?: string) => (status ?? "TODO").toUpperCase();

const normalizePriority = (priority?: string) =>
  (priority ?? "MEDIUM").toUpperCase();

const calculateTaskRisk = (task: TaskItem): TaskRiskItem => {
  const reasons: string[] = [];

  const status = normalizeStatus(task.status);

  const priority = normalizePriority(task.priority);

  const progress = Number(task.progress ?? 0);

  const today = dayjs();

  const endDate = task.endDate ? dayjs(task.endDate) : null;

  // ==========================================
  // DONE
  // ==========================================

  if (status === "DONE") {
    return {
      task,
      level: "SAFE",
      reasons: ["Task đã hoàn thành"],
    };
  }

  // ==========================================
  // BLOCKED
  // ==========================================

  if (status === "BLOCKED") {
    reasons.push("Task đang bị Blocked");
  }

  // ==========================================
  // OVERDUE
  // ==========================================

  if (endDate && today.isAfter(endDate, "day")) {
    reasons.push("Task đã quá hạn");
  }

  // ==========================================
  // NO OWNER
  // ==========================================

  if (!task.userId) {
    reasons.push("Task chưa có owner");
  }

  // ==========================================
  // CRITICAL PRIORITY
  // ==========================================

  if (priority === "CRITICAL") {
    reasons.push("Priority Critical");
  }

  // ==========================================
  // NEAR DEADLINE
  // ==========================================

  if (endDate && !today.isAfter(endDate, "day")) {
    const remainingDays = endDate.diff(today, "day");

    if (remainingDays <= 2 && progress < 80) {
      reasons.push(
        `Còn ${Math.max(remainingDays, 0)} ngày nhưng tiến độ mới ${progress}%`,
      );
    }

    if (remainingDays <= 5 && progress < 50) {
      reasons.push(`Tiến độ thấp (${progress}%) khi deadline đang gần`);
    }
  }

  // ==========================================
  // DETERMINE LEVEL
  // ==========================================

  const isBlocked = status === "BLOCKED";

  const isOverdue = Boolean(endDate && today.isAfter(endDate, "day"));

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

export const SprintRiskPanel: React.FC<Props> = ({ tasks }) => {
  const analysis = useMemo(() => {
    const taskRisks = tasks.map(calculateTaskRisk);

    const critical = taskRisks.filter((item) => item.level === "CRITICAL");

    const high = taskRisks.filter((item) => item.level === "HIGH");

    const warning = taskRisks.filter((item) => item.level === "WARNING");

    const safe = taskRisks.filter((item) => item.level === "SAFE");

    const blocked = tasks.filter(
      (task) => normalizeStatus(task.status) === "BLOCKED",
    );

    const overdue = tasks.filter((task) => {
      if (normalizeStatus(task.status) === "DONE") {
        return false;
      }

      if (!task.endDate) {
        return false;
      }

      return dayjs().isAfter(dayjs(task.endDate), "day");
    });

    const noOwner = tasks.filter(
      (task) => !task.userId && normalizeStatus(task.status) !== "DONE",
    );

    return {
      taskRisks,

      critical,
      high,
      warning,
      safe,

      blocked,
      overdue,
      noOwner,

      riskCount: critical.length + high.length + warning.length,
    };
  }, [tasks]);

  const riskyTasks = analysis.taskRisks
    .filter((item) => item.level !== "SAFE")
    .sort((a, b) => {
      const priority: Record<RiskLevel, number> = {
        CRITICAL: 1,
        HIGH: 2,
        WARNING: 3,
        SAFE: 4,
      };

      return priority[a.level] - priority[b.level];
    });

  return (
    <Card
      style={{
        marginBottom: 20,
      }}
    >
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
          Tự động phát hiện Task Blocked, quá hạn, thiếu owner hoặc có nguy cơ
          không kịp deadline.
        </Text>
      </div>

      <Row
        gutter={[16, 16]}
        style={{
          marginBottom: 18,
        }}
      >
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Task rủi ro"
              value={analysis.riskCount}
              suffix={`/ ${tasks.length}`}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Blocked" value={analysis.blocked.length} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Quá hạn" value={analysis.overdue.length} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Chưa có owner" value={analysis.noOwner.length} />
          </Card>
        </Col>
      </Row>

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

      {riskyTasks.length > 0 ? (
        <Space
          direction="vertical"
          size="middle"
          style={{
            width: "100%",
          }}
        >
          {riskyTasks.map(({ task, level, reasons }) => (
            <Card key={task.id} size="small">
              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  gap: 16,

                  alignItems: "flex-start",
                }}
              >
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
                  </Space>

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
          ))}
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
