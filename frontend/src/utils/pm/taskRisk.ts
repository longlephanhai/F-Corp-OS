import dayjs, { type Dayjs } from "dayjs";

import type { TaskItem } from "../../common/types/pm";

export type TaskRiskLevel = "SAFE" | "WARNING" | "HIGH" | "CRITICAL";

export interface TaskRiskResult {
  task: TaskItem;

  level: TaskRiskLevel;

  reasons: string[];

  isBlocked: boolean;

  isOverdue: boolean;

  hasNoOwner: boolean;

  isCriticalPriority: boolean;
}

export interface TaskRiskSummary {
  analyses: TaskRiskResult[];

  riskCount: number;

  criticalCount: number;

  highCount: number;

  warningCount: number;

  safeCount: number;

  blockedCount: number;

  overdueCount: number;

  noOwnerCount: number;
}

const normalizeStatus = (status?: string) => (status ?? "TODO").toUpperCase();

const normalizePriority = (priority?: string) =>
  (priority ?? "MEDIUM").toUpperCase();

export const analyzeTaskRisk = (
  task: TaskItem,
  now: Dayjs = dayjs(),
): TaskRiskResult => {
  const reasons: string[] = [];

  const status = normalizeStatus(task.status);

  const priority = normalizePriority(task.priority);

  const progress = Number(task.progress ?? 0);

  const endDate = task.endDate ? dayjs(task.endDate) : null;

  const isDone = status === "DONE";

  const isBlocked = !isDone && status === "BLOCKED";

  const isOverdue = Boolean(!isDone && endDate && now.isAfter(endDate, "day"));

  const hasNoOwner = !isDone && !task.userId;

  const isCriticalPriority = !isDone && priority === "CRITICAL";

  // ==========================================
  // DONE
  // ==========================================

  if (isDone) {
    return {
      task,

      level: "SAFE",

      reasons: ["Task đã hoàn thành"],

      isBlocked: false,

      isOverdue: false,

      hasNoOwner: false,

      isCriticalPriority: false,
    };
  }

  // ==========================================
  // BLOCKED
  // ==========================================

  if (isBlocked) {
    reasons.push("Task đang bị Blocked");
  }

  // ==========================================
  // OVERDUE
  // ==========================================

  if (isOverdue) {
    reasons.push("Task đã quá hạn");
  }

  // ==========================================
  // OWNER
  // ==========================================

  if (hasNoOwner) {
    reasons.push("Task chưa có owner");
  }

  // ==========================================
  // PRIORITY
  // ==========================================

  if (isCriticalPriority) {
    reasons.push("Priority Critical");
  }

  // ==========================================
  // DEADLINE RISK
  // ==========================================

  if (endDate && !isOverdue) {
    const remainingDays = endDate.diff(now, "day");

    if (remainingDays <= 2 && progress < 80) {
      reasons.push(
        `Còn ${Math.max(remainingDays, 0)} ngày nhưng tiến độ mới ${progress}%`,
      );
    } else if (remainingDays <= 5 && progress < 50) {
      reasons.push(`Tiến độ thấp (${progress}%) khi deadline đang gần`);
    }
  }

  // ==========================================
  // CRITICAL
  // ==========================================

  if (isOverdue && (isBlocked || isCriticalPriority)) {
    return {
      task,

      level: "CRITICAL",

      reasons,

      isBlocked,

      isOverdue,

      hasNoOwner,

      isCriticalPriority,
    };
  }

  // ==========================================
  // HIGH
  // ==========================================

  if (isBlocked || isOverdue) {
    return {
      task,

      level: "HIGH",

      reasons,

      isBlocked,

      isOverdue,

      hasNoOwner,

      isCriticalPriority,
    };
  }

  // ==========================================
  // WARNING
  // ==========================================

  if (reasons.length > 0) {
    return {
      task,

      level: "WARNING",

      reasons,

      isBlocked,

      isOverdue,

      hasNoOwner,

      isCriticalPriority,
    };
  }

  // ==========================================
  // SAFE
  // ==========================================

  return {
    task,

    level: "SAFE",

    reasons: ["Task đang ổn định"],

    isBlocked,

    isOverdue,

    hasNoOwner,

    isCriticalPriority,
  };
};

export const summarizeTaskRisks = (
  tasks: TaskItem[],
  now: Dayjs = dayjs(),
): TaskRiskSummary => {
  const analyses = tasks.map((task) => analyzeTaskRisk(task, now));

  const criticalCount = analyses.filter(
    (item) => item.level === "CRITICAL",
  ).length;

  const highCount = analyses.filter((item) => item.level === "HIGH").length;

  const warningCount = analyses.filter(
    (item) => item.level === "WARNING",
  ).length;

  const safeCount = analyses.filter((item) => item.level === "SAFE").length;

  const blockedCount = analyses.filter((item) => item.isBlocked).length;

  const overdueCount = analyses.filter((item) => item.isOverdue).length;

  const noOwnerCount = analyses.filter((item) => item.hasNoOwner).length;

  return {
    analyses,

    criticalCount,

    highCount,

    warningCount,

    safeCount,

    blockedCount,

    overdueCount,

    noOwnerCount,

    riskCount: criticalCount + highCount + warningCount,
  };
};
