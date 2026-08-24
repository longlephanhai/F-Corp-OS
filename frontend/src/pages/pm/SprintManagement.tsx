import React, { useCallback, useEffect, useState } from "react";

import { Button, message, Segmented, Tabs, Typography } from "antd";

import { useParams } from "react-router-dom";

import type {
  TaskDependencyStatus,
  TaskItem,
  TeamMember,
  UserSprintItem,
} from "../../common/types/pm";

import { pmApi } from "../../api/pm";

import { SprintResourceSummary } from "../../components/pm/sprints/SprintResourceSummary";

import { SprintAllocationTable } from "../../components/pm/sprints/SprintAllocationTable";

import { AssignResourceModal } from "../../components/pm/sprints/AssignResourceModal";

import { SprintTaskTable } from "../../components/pm/sprints/SprintTaskTable";

import { CreateTaskModal } from "../../components/pm/sprints/CreateTaskModal";

import { TaskMatchingDrawer } from "../../components/pm/sprints/TaskMatchingDrawer";

import { ReleaseReviewModal } from "../../components/pm/sprints/ReleaseReviewModal";

import { SprintTaskKanban } from "../../components/pm/sprints/SprintTaskKanban";

import { SprintRiskPanel } from "../../components/pm/sprints/SprintRiskPanel";

import { TaskDependenciesModal } from "../../components/pm/sprints/TaskDependenciesModal";

const { Title, Text } = Typography;

// ==========================================
// PAGE
// ==========================================

export const SprintManagementPage: React.FC = () => {
  const { sprintId } = useParams<{
    sprintId: string;
  }>();

  // ==========================================
  // DATA
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [userSprints, setUserSprints] = useState<UserSprintItem[]>([]);

  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // ==========================================
  // DEPENDENCY STATUS
  // ==========================================

  const [dependencyStatusMap, setDependencyStatusMap] = useState<
    Record<string, TaskDependencyStatus>
  >({});

  // ==========================================
  // ASSIGN RESOURCE MODAL
  // ==========================================

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // ==========================================
  // CREATE TASK
  // ==========================================

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // ==========================================
  // MATCHING
  // ==========================================

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [isMatchingOpen, setIsMatchingOpen] = useState(false);

  // ==========================================
  // DEPENDENCY MODAL
  // ==========================================

  const [dependencyTask, setDependencyTask] = useState<TaskItem | null>(null);

  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

  // ==========================================
  // RELEASE
  // ==========================================

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const [releaseUserSprintId, setReleaseUserSprintId] = useState<string | null>(
    null,
  );

  const [releaseDevName, setReleaseDevName] = useState("");

  // ==========================================
  // TASK VIEW
  // ==========================================

  const [taskViewMode, setTaskViewMode] = useState<"TABLE" | "KANBAN">("TABLE");

  // ==========================================
  // OPEN DEPENDENCY
  // ==========================================

  const handleOpenDependencies = (task: TaskItem) => {
    setDependencyTask(task);

    setIsDependencyModalOpen(true);
  };

  // ==========================================
  // LOAD DEPENDENCY STATUS
  // ==========================================

  const loadDependencyStatuses = useCallback(async (taskList: TaskItem[]) => {
    if (taskList.length === 0) {
      setDependencyStatusMap({});

      return;
    }

    const entries = await Promise.all(
      taskList.map(async (task) => {
        try {
          const response = await pmApi.getTaskDependencyStatus(task.id);

          const data = response?.data?.data ?? response?.data;

          const normalized: TaskDependencyStatus = {
            taskId: data?.taskId ?? task.id,

            totalDependencies: Number(data?.totalDependencies ?? 0),

            unfinishedDependencies: Number(data?.unfinishedDependencies ?? 0),

            isBlockedByDependency: Boolean(data?.isBlockedByDependency),
          };

          return [task.id, normalized] as const;
        } catch (error) {
          console.error(
            `Không load được dependency status task ${task.id}`,
            error,
          );

          const fallback: TaskDependencyStatus = {
            taskId: task.id,

            totalDependencies: 0,

            unfinishedDependencies: 0,

            isBlockedByDependency: false,
          };

          return [task.id, fallback] as const;
        }
      }),
    );

    setDependencyStatusMap(Object.fromEntries(entries));
  }, []);

  // ==========================================
  // FETCH SPRINT DATA
  // ==========================================

  const fetchSprintData = useCallback(async () => {
    if (!sprintId) {
      setUserSprints([]);

      setTasks([]);

      setTeamMembers([]);

      setDependencyStatusMap({});

      return;
    }

    setLoading(true);

    try {
      const [resUsers, resTasks, resTeam] = await Promise.all([
        pmApi.getSprintUsers(sprintId),

        pmApi.getSprintTasks(sprintId),

        pmApi.getMyTeam(),
      ]);

      // ==================================
      // NORMALIZE RESPONSE
      // ==================================

      const userSprintList = resUsers?.data?.data ?? resUsers?.data ?? [];

      const taskList = resTasks?.data?.data ?? resTasks?.data ?? [];

      const teamList = resTeam?.data?.data ?? resTeam?.data ?? [];

      const normalizedUserSprints = Array.isArray(userSprintList)
        ? userSprintList
        : [];

      const normalizedTasks = Array.isArray(taskList) ? taskList : [];

      const normalizedTeam = Array.isArray(teamList) ? teamList : [];

      // ==================================
      // SET DATA
      // ==================================

      setUserSprints(normalizedUserSprints);

      setTasks(normalizedTasks);

      setTeamMembers(normalizedTeam);

      // ==================================
      // DEPENDENCY STATUS
      // ==================================

      await loadDependencyStatuses(normalizedTasks);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Sprint:", error);

      message.error("Không thể tải dữ liệu Sprint.");
    } finally {
      setLoading(false);
    }
  }, [sprintId, loadDependencyStatuses]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void fetchSprintData();
  }, [fetchSprintData]);

  // ==========================================
  // RELEASE
  // ==========================================

  const handleOpenRelease = (record: UserSprintItem) => {
    setReleaseUserSprintId(record.id);

    setReleaseDevName(record.user?.fullName ?? "Nhân sự");

    setIsReleaseModalOpen(true);
  };

  // ==========================================
  // TASK MATCHING
  // ==========================================

  const handleFindCandidate = (task: TaskItem) => {
    setSelectedTask(task);

    setIsMatchingOpen(true);
  };

  // ==========================================
  // INVALID ROUTE
  // ==========================================

  if (!sprintId) {
    return (
      <div
        style={{
          padding: 24,
        }}
      >
        <Title level={4}>Không tìm thấy Sprint</Title>

        <Text type="secondary">URL hiện tại không chứa Sprint ID.</Text>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        padding: 24,

        background: "#fff",

        borderRadius: 8,
      }}
    >
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <Title
          level={3}
          style={{
            marginBottom: 4,
          }}
        >
          Quản lý Sprint
        </Title>

        <Text type="secondary">
          Sprint ID: <Text code>{sprintId}</Text>
        </Text>
      </div>

      {/* ====================================== */}
      {/* TABS */}
      {/* ====================================== */}

      <Tabs
        defaultActiveKey="allocation"
        items={[
          // ====================================
          // ALLOCATION TAB
          // ====================================

          {
            key: "allocation",

            label: "Nhân sự tham gia (Allocation)",

            children: (
              <>
                {/* RESOURCE SUMMARY */}

                <SprintResourceSummary userSprints={userSprints} />

                {/* ASSIGN ACTION */}

                <div
                  style={{
                    display: "flex",

                    justifyContent: "flex-end",

                    marginBottom: 16,
                  }}
                >
                  <Button
                    type="primary"
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    + Gán nhân viên vào Sprint
                  </Button>
                </div>

                {/* ALLOCATION TABLE */}

                <SprintAllocationTable
                  userSprints={userSprints}
                  loading={loading}
                  onRefresh={fetchSprintData}
                  onRelease={handleOpenRelease}
                />
              </>
            ),
          },

          // ====================================
          // TASK TAB
          // ====================================

          {
            key: "tasks",

            label: "Danh sách Tasks",

            children: (
              <>
                {/* ============================ */}
                {/* SPRINT RISK */}
                {/* ============================ */}

                <SprintRiskPanel
                  tasks={tasks}
                  // QUAN TRỌNG:
                  // truyền dependency status
                  // xuống Risk Monitor.
                  dependencyStatusMap={dependencyStatusMap}
                />

                {/* ============================ */}
                {/* VIEW MODE */}
                {/* ============================ */}

                <div
                  style={{
                    display: "flex",

                    justifyContent: "flex-end",

                    marginBottom: 16,
                  }}
                >
                  <Segmented
                    value={taskViewMode}
                    onChange={(value) =>
                      setTaskViewMode(value as "TABLE" | "KANBAN")
                    }
                    options={[
                      {
                        label: "Bảng",

                        value: "TABLE",
                      },

                      {
                        label: "Kanban",

                        value: "KANBAN",
                      },
                    ]}
                  />
                </div>

                {/* ============================ */}
                {/* TABLE / KANBAN */}
                {/* ============================ */}

                {taskViewMode === "TABLE" ? (
                  <SprintTaskTable
                    tasks={tasks}
                    loading={loading}
                    dependencyStatusMap={dependencyStatusMap}
                    onCreateTask={() => setIsTaskModalOpen(true)}
                    onFindCandidate={handleFindCandidate}
                    onManageDependencies={handleOpenDependencies}
                    onRefresh={fetchSprintData}
                  />
                ) : (
                  <SprintTaskKanban
                    tasks={tasks}
                    loading={loading}
                    onCreateTask={() => setIsTaskModalOpen(true)}
                    onFindCandidate={handleFindCandidate}
                    onRefresh={fetchSprintData}
                  />
                )}
              </>
            ),
          },
        ]}
      />

      {/* ====================================== */}
      {/* ASSIGN RESOURCE */}
      {/* ====================================== */}

      <AssignResourceModal
        open={isAssignModalOpen}
        sprintId={sprintId}
        teamMembers={teamMembers}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchSprintData}
      />

      {/* ====================================== */}
      {/* CREATE TASK */}
      {/* ====================================== */}

      <CreateTaskModal
        open={isTaskModalOpen}
        sprintId={sprintId}
        onClose={() => setIsTaskModalOpen(false)}
        onRefresh={() => {
          void fetchSprintData();
        }}
      />

      {/* ====================================== */}
      {/* TASK MATCHING */}
      {/* ====================================== */}

      <TaskMatchingDrawer
        open={isMatchingOpen}
        task={selectedTask}
        sprintId={sprintId}
        onClose={() => {
          setIsMatchingOpen(false);

          setSelectedTask(null);
        }}
        onAssigned={fetchSprintData}
      />

      {/* ====================================== */}
      {/* RELEASE REVIEW */}
      {/* ====================================== */}

      <ReleaseReviewModal
        open={isReleaseModalOpen}
        userSprintId={releaseUserSprintId}
        devName={releaseDevName}
        onClose={() => {
          setIsReleaseModalOpen(false);

          setReleaseUserSprintId(null);

          setReleaseDevName("");
        }}
        onRefresh={() => {
          void fetchSprintData();
        }}
      />

      {/* ====================================== */}
      {/* TASK DEPENDENCIES */}
      {/* ====================================== */}

      <TaskDependenciesModal
        open={isDependencyModalOpen}
        task={dependencyTask}
        tasks={tasks}
        // ====================================
        // REFRESH DEPENDENCY
        // ====================================
        //
        // Sau khi ADD / DELETE dependency,
        // không cần gọi lại toàn bộ Sprint.
        //
        // Chỉ refresh dependency status.
        //
        // Khi map này thay đổi:
        //
        // SprintTaskTable
        //   → khóa/mở status & progress
        //
        // SprintRiskPanel
        //   → cập nhật Dependency Risk
        //
        // ====================================

        onChanged={async () => {
          await loadDependencyStatuses(tasks);
        }}
        onClose={() => {
          setIsDependencyModalOpen(false);

          setDependencyTask(null);
        }}
      />
    </div>
  );
};
