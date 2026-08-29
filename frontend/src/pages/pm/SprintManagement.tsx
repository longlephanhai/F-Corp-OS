import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Button,
  message,
  Modal,
  Segmented,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";

import { useParams } from "react-router-dom";

import type {
  TaskDependencyStatus,
  TaskItem,
  TeamMember,
  UserSprintItem,
} from "../../common/types/pm";

import { pmApi } from "../../api/pm";

import { SprintResourceSummary } from "../../components/pm/sprints/SprintResourceSummary";
import { TaskCarryOverHistoryModal } from "../../components/pm/sprints/TaskCarryOverHistoryModal";

import { SprintAllocationTable } from "../../components/pm/sprints/SprintAllocationTable";

import { AssignResourceModal } from "../../components/pm/sprints/AssignResourceModal";

import { SprintTaskTable } from "../../components/pm/sprints/SprintTaskTable";

import { CreateTaskModal } from "../../components/pm/sprints/CreateTaskModal";

import { TaskMatchingDrawer } from "../../components/pm/sprints/TaskMatchingDrawer";

import { ReleaseReviewModal } from "../../components/pm/sprints/ReleaseReviewModal";

import { SprintTaskKanban } from "../../components/pm/sprints/SprintTaskKanban";

import { SprintRiskPanel } from "../../components/pm/sprints/SprintRiskPanel";

import { TaskDependenciesModal } from "../../components/pm/sprints/TaskDependenciesModal";
import { EditTaskModal } from "../../components/pm/sprints/EditTaskModal";
import { CarryOverTaskModal } from "../../components/pm/sprints/CarryOverTaskModal";

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

  const [sprintInfo, setSprintInfo] = useState<any>(null);

  const sprintStatus = (sprintInfo?.status ?? "").toString().toLowerCase();

  const isReadOnly =
    sprintStatus === "completed" || sprintStatus === "cancelled";

  const [userSprints, setUserSprints] = useState<UserSprintItem[]>([]);

  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [historyTask, setHistoryTask] = useState<TaskItem | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
  const [carryOverTask, setCarryOverTask] = useState<TaskItem | null>(null);

  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskItem | null>(null);

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);

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
  const handleViewCarryOverHistory = (task: TaskItem) => {
    setHistoryTask(task);

    setIsHistoryOpen(true);
  };

  const handleCarryOverTask = (task: TaskItem) => {
    setCarryOverTask(task);

    setIsCarryOverOpen(true);
  };
  const handleDeleteTask = (task: TaskItem) => {
    Modal.confirm({
      title: "Xóa Task?",

      width: 620,

      content: (
        <div>
          <p>
            Bạn có chắc muốn lưu trữ Task <strong>{task.title}</strong>?
          </p>

          <p
            style={{
              marginBottom: 0,
            }}
          >
            Task sẽ không còn xuất hiện trong Sprint nhưng dữ liệu vẫn được giữ
            trong hệ thống.
          </p>
        </div>
      ),

      okText: "Xóa Task",

      okButtonProps: {
        danger: true,
      },

      cancelText: "Hủy",

      onOk: async () => {
        try {
          await pmApi.deleteTask(task.id);

          message.success("Đã lưu trữ Task.");

          await fetchSprintData();
        } catch (error: any) {
          console.error("Không thể xóa Task:", error);

          const errorData = error?.response?.data;

          const code = errorData?.code ?? errorData?.error?.code;

          // ==================================
          // DOWNSTREAM DEPENDENCY
          // ==================================

          if (code === "TASK_HAS_DEPENDENTS") {
            const dependentTasks = errorData?.dependentTasks ?? [];

            Modal.warning({
              title: "Không thể xóa Task",

              width: 650,

              content: (
                <Space
                  direction="vertical"
                  size={6}
                  style={{
                    width: "100%",
                  }}
                >
                  <Text>Task này đang là prerequisite của Task khác.</Text>

                  {dependentTasks.map((dependent: any) => (
                    <Text key={dependent.taskId}>
                      • <strong>{dependent.title}</strong>
                      {" — "}
                      {dependent.status}
                      {" · "}
                      {dependent.progress}%
                    </Text>
                  ))}

                  <Text type="secondary">
                    Hãy xóa dependency trước rồi mới xóa Task.
                  </Text>
                </Space>
              ),
            });

            return;
          }

          if (code === "DONE_TASK_CANNOT_DELETE") {
            Modal.warning({
              title: "Task đã hoàn thành",

              content:
                "Task DONE được giữ lại làm lịch sử và không thể bị xóa.",
            });

            return;
          }

          if (code === "SPRINT_READ_ONLY") {
            Modal.warning({
              title: "Sprint chỉ đọc",

              content:
                "Sprint đã hoàn thành hoặc đã hủy nên không thể xóa Task.",
            });

            return;
          }

          message.error(errorData?.message ?? "Không thể xóa Task.");
        }
      },
    });
  };
  const handleEditTask = (task: TaskItem) => {
    setEditTask(task);

    setIsEditTaskModalOpen(true);
  };
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
      setSprintInfo(null);
      setTasks([]);

      setTeamMembers([]);

      setDependencyStatusMap({});

      return;
    }

    setLoading(true);

    try {
      const [resSprint, resUsers, resTasks, resTeam] = await Promise.all([
        pmApi.getSprintById(sprintId),

        pmApi.getSprintUsers(sprintId),

        pmApi.getSprintTasks(sprintId),

        pmApi.getMyTeam(),
      ]);

      // ==================================
      // NORMALIZE RESPONSE
      // ==================================
      const sprintData = resSprint?.data?.data ?? resSprint?.data ?? null;

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
      setSprintInfo(sprintData);
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
        <div
          style={{
            marginTop: 8,
          }}
        >
          <Tag
            color={
              sprintStatus === "active"
                ? "processing"
                : sprintStatus === "upcoming"
                  ? "blue"
                  : sprintStatus === "completed"
                    ? "green"
                    : "default"
            }
          >
            {(sprintInfo?.status ?? "UNKNOWN").toString().toUpperCase()}
          </Tag>
        </div>
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

      {isReadOnly && (
        <Alert
          type={sprintStatus === "completed" ? "success" : "warning"}
          showIcon
          title={
            sprintStatus === "completed"
              ? "Sprint đã hoàn thành — chế độ chỉ đọc"
              : "Sprint đã bị hủy — chế độ chỉ đọc"
          }
          description="Task, Dependency và Allocation của Sprint này không còn được phép thay đổi."
          style={{
            marginBottom: 20,
          }}
        />
      )}

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
                    disabled={isReadOnly}
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    + Gán nhân viên vào Sprint
                  </Button>
                </div>

                {/* ALLOCATION TABLE */}

                <SprintAllocationTable
                  userSprints={userSprints}
                  loading={loading}
                  readOnly={isReadOnly}
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
                    readOnly={isReadOnly}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    canCarryOver={sprintStatus === "active"}
                    onCarryOverTask={handleCarryOverTask}
                    onViewCarryOverHistory={handleViewCarryOverHistory}
                  />
                ) : (
                  <SprintTaskKanban
                    tasks={tasks}
                    loading={loading}
                    readOnly={isReadOnly}
                    dependencyStatusMap={dependencyStatusMap}
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
        open={isAssignModalOpen && !isReadOnly}
        sprintId={sprintId}
        teamMembers={teamMembers}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={fetchSprintData}
      />

      {/* ====================================== */}
      {/* CREATE TASK */}
      {/* ====================================== */}

      <CreateTaskModal
        open={isTaskModalOpen && !isReadOnly}
        sprintId={sprintId}
        onClose={() => setIsTaskModalOpen(false)}
        onRefresh={() => {
          void fetchSprintData();
        }}
      />
      <EditTaskModal
        open={isEditTaskModalOpen && !isReadOnly}
        task={editTask}
        onClose={() => {
          setIsEditTaskModalOpen(false);

          setEditTask(null);
        }}
        onRefresh={fetchSprintData}
      />

      <CarryOverTaskModal
        open={isCarryOverOpen && !isReadOnly}
        task={carryOverTask}
        currentSprint={sprintInfo}
        onClose={() => {
          setIsCarryOverOpen(false);

          setCarryOverTask(null);
        }}
        onSuccess={fetchSprintData}
      />

      <TaskCarryOverHistoryModal
        open={isHistoryOpen}
        task={historyTask}
        onClose={() => {
          setIsHistoryOpen(false);

          setHistoryTask(null);
        }}
      />

      {/* ====================================== */}
      {/* TASK MATCHING */}
      {/* ====================================== */}

      <TaskMatchingDrawer
        open={isMatchingOpen && !isReadOnly}
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
        open={isReleaseModalOpen && !isReadOnly}
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
        open={isDependencyModalOpen && !isReadOnly}
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
