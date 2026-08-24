import React, { useCallback, useEffect, useState } from "react";

import { Button, message, Tabs, Typography } from "antd";

import { useParams } from "react-router-dom";

import type {
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

const { Title, Text } = Typography;

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
  // ASSIGN RESOURCE MODAL
  // ==========================================

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // ==========================================
  // TASK
  // ==========================================

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [isMatchingOpen, setIsMatchingOpen] = useState(false);

  // ==========================================
  // RELEASE
  // ==========================================

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const [releaseUserSprintId, setReleaseUserSprintId] = useState<string | null>(
    null,
  );

  const [releaseDevName, setReleaseDevName] = useState("");

  // ==========================================
  // FETCH SPRINT DATA
  // ==========================================

  const fetchSprintData = useCallback(async () => {
    if (!sprintId) {
      setUserSprints([]);
      setTasks([]);
      setTeamMembers([]);

      return;
    }

    setLoading(true);

    try {
      const [resUsers, resTasks, resTeam] = await Promise.all([
        pmApi.getSprintUsers(sprintId),

        pmApi.getSprintTasks(sprintId),

        pmApi.getMyTeam(),
      ]);

      setUserSprints(resUsers?.data?.data ?? resUsers?.data ?? []);

      setTasks(resTasks?.data?.data ?? resTasks?.data ?? []);

      setTeamMembers(resTeam?.data?.data ?? resTeam?.data ?? []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Sprint:", error);

      message.error("Không thể tải dữ liệu Sprint.");
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    void fetchSprintData();
  }, [fetchSprintData]);

  // ==========================================
  // ALLOCATION STATUS
  // ==========================================

  // ==========================================
  // ACCEPT
  // ==========================================

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
      {/* HEADER */}

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

      {/* TABS */}

      <Tabs
        defaultActiveKey="allocation"
        items={[
          {
            key: "allocation",

            label: "Nhân sự tham gia (Allocation)",

            children: (
              <>
                {/* SUMMARY */}

                <SprintResourceSummary userSprints={userSprints} />

                {/* ACTION */}

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

          {
            key: "tasks",

            label: "Danh sách Tasks",

            children: (
              <SprintTaskTable
                tasks={tasks}
                loading={loading}
                onCreateTask={() => setIsTaskModalOpen(true)}
                onFindCandidate={handleFindCandidate}
                onRefresh={fetchSprintData}
              />
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
      {/* MATCHING */}
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
    </div>
  );
};
