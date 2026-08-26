import React, { useCallback, useEffect, useState } from "react";

import { Avatar, Button, Drawer, message, Progress, Table, Tag } from "antd";

import type { TaskCandidate, TaskItem } from "../../../common/types/pm";

import { CandidateCompareModal } from "../CandidateCompareModal";

import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;

  task: TaskItem | null;

  sprintId: string;

  onClose: () => void;

  onAssigned: () => void | Promise<void>;
}

export const TaskMatchingDrawer: React.FC<Props> = ({
  open,
  task,
  sprintId: _sprintId,
  onClose,
  onAssigned,
}) => {
  // ==========================================
  // STATE
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [candidates, setCandidates] = useState<TaskCandidate[]>([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [assignLoading, setAssignLoading] = useState(false);

  // ==========================================
  // LOAD MATCHING CANDIDATES
  // ==========================================

  const fetchMatchingCandidates = useCallback(async (taskId: string) => {
    setLoading(true);

    try {
      const response = await pmApi.getTaskCandidates(taskId);

      const data = response?.data?.data ?? response?.data ?? [];

      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Không thể tải danh sách ứng viên:", error);

      setCandidates([]);

      message.error("Không thể tải danh sách ứng viên phù hợp.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DRAWER OPEN
  // ==========================================

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setSelectedRowKeys([]);

    setIsCompareOpen(false);

    void fetchMatchingCandidates(task.id);
  }, [open, task, fetchMatchingCandidates]);

  // ==========================================
  // ASSIGN TASK
  // ==========================================

  const handleAssignTask = async (candidateId: string) => {
    if (!task) {
      return;
    }

    const candidate = candidates.find((item) => item.id === candidateId);

    if (!candidate) {
      message.error("Không tìm thấy thông tin nhân sự.");

      return;
    }

    // Backend candidate matching hiện chỉ
    // trả user ASSIGNED trong đúng Sprint.
    //
    // Check này chỉ để frontend phòng thủ.
    if (candidate.isAssignedToSprint === false) {
      message.warning("Nhân sự chưa được ASSIGNED vào Sprint này.");

      return;
    }

    try {
      setAssignLoading(true);

      await pmApi.updateTaskAssignee(task.id, candidate.id);

      message.success(`Đã giao Task cho ${candidate.fullName}.`);

      setIsCompareOpen(false);

      setSelectedRowKeys([]);

      await onAssigned();

      onClose();
    } catch (error: any) {
      console.error("Không thể gán Task:", error);

      const errorData = error?.response?.data;

      message.error(errorData?.message ?? "Không thể giao Task cho nhân sự.");
    } finally {
      setAssignLoading(false);
    }
  };

  // ==========================================
  // TABLE COLUMNS
  // ==========================================

  const columns = [
    // ========================================
    // CANDIDATE
    // ========================================

    {
      title: "Ứng viên",

      key: "user",

      width: 220,

      render: (_: unknown, record: TaskCandidate) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-blue-500">
            {record.fullName?.charAt(0)?.toUpperCase() ?? "U"}
          </Avatar>

          <div>
            <div className="font-semibold text-gray-800">{record.fullName}</div>

            <div className="text-xs text-gray-500">
              {record.title ?? "Chưa cập nhật vị trí"}
            </div>
          </div>
        </div>
      ),
    },

    // ========================================
    // MATCH SCORE
    // ========================================

    {
      title: "Độ phù hợp",

      dataIndex: "matchScore",

      key: "matchScore",

      width: 180,

      render: (score: number) => {
        const matchScore = Number(score ?? 0);

        return (
          <Progress
            percent={matchScore}
            size="small"
            status={
              matchScore >= 80
                ? "success"
                : matchScore >= 50
                  ? "active"
                  : "exception"
            }
          />
        );
      },
    },

    // ========================================
    // SPRINT ALLOCATION
    // ========================================

    {
      title: "Allocation Sprint",

      key: "sprintAllocation",

      width: 170,

      render: (_: unknown, record: TaskCandidate) => (
        <div>
          <Tag color="green">ASSIGNED</Tag>

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
            }}
          >
            Allocation:{" "}
            <strong>{Number(record.sprintAllocationPercent ?? 0)}%</strong>
          </div>
        </div>
      ),
    },

    // ========================================
    // EMPLOYEE STATUS
    // ========================================

    {
      title: "Trạng thái NV",

      key: "employeeStatus",

      width: 140,

      render: (_: unknown, record: TaskCandidate) => {
        const status = record.employeeStatus ?? record.status;

        switch (status) {
          case "AVAILABLE":
          case "available":
            return <Tag color="green">Available</Tag>;

          case "BENCH":
          case "bench":
            return <Tag color="gold">Bench</Tag>;

          case "IN_PROJECT":
          case "on_project":
            return <Tag color="blue">On Project</Tag>;

          default:
            return <Tag>{status ?? "Không xác định"}</Tag>;
        }
      },
    },

    // ========================================
    // SKILLS
    // ========================================

    {
      title: "Phân tích kỹ năng",

      key: "skills",

      width: 300,

      render: (_: unknown, record: TaskCandidate) => (
        <div>
          {record.matchedSkills?.length > 0 ? (
            record.matchedSkills.map((skill: string) => (
              <Tag color="green" key={`matched-${skill}`}>
                ✓ {skill}
              </Tag>
            ))
          ) : (
            <Tag>Chưa có kỹ năng phù hợp</Tag>
          )}

          {record.missingSkills?.map((skill: string) => (
            <Tag color="red" key={`missing-${skill}`}>
              ✗ Thiếu {skill}
            </Tag>
          ))}
        </div>
      ),
    },

    // ========================================
    // COST
    // ========================================

    {
      title: "Cost Rate",

      key: "costRate",

      width: 110,

      render: (_: unknown, record: TaskCandidate) => (
        <span>{Number(record.costRate ?? 0).toLocaleString()}</span>
      ),
    },

    // ========================================
    // ACTION
    // ========================================

    {
      title: "Hành động",

      key: "action",

      width: 150,

      fixed: "right" as const,

      render: (_: unknown, record: TaskCandidate) => {
        const isCurrentOwner = task?.userId === record.id;

        return (
          <Button
            type="primary"
            size="small"
            loading={assignLoading && !isCurrentOwner}
            disabled={isCurrentOwner || assignLoading}
            onClick={() => void handleAssignTask(record.id)}
          >
            {isCurrentOwner
              ? "Owner hiện tại"
              : task?.userId
                ? "Đổi Owner"
                : "Gán vào Task"}
          </Button>
        );
      },
    },
  ];

  // ==========================================
  // ROW SELECTION
  // ==========================================

  const rowSelection = {
    selectedRowKeys,

    onChange: (newSelectedRowKeys: React.Key[]) => {
      if (newSelectedRowKeys.length > 3) {
        message.warning("Chỉ được so sánh tối đa 3 ứng viên cùng lúc!");

        return;
      }

      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // ==========================================
  // SELECTED CANDIDATES
  // ==========================================

  const selectedCandidatesData = candidates.filter((candidate) =>
    selectedRowKeys.includes(candidate.id),
  );

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between pr-8">
            <div>
              <h3 className="m-0 text-lg font-bold">Gợi ý Nhân sự</h3>

              <span className="text-sm font-normal text-gray-500">
                Chỉ hiển thị nhân sự đã ASSIGNED vào Sprint và xếp hạng theo mức
                phù hợp kỹ năng.
              </span>
            </div>

            <Button
              type="primary"
              disabled={selectedRowKeys.length < 2}
              onClick={() => setIsCompareOpen(true)}
            >
              ⚖️ So sánh đã chọn ({selectedRowKeys.length})
            </Button>
          </div>
        }
        placement="right"
        size="large"
        onClose={onClose}
        open={open}
      >
        {/* ================================== */}
        {/* TASK REQUIREMENTS */}
        {/* ================================== */}

        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="mb-1 font-semibold text-blue-800">
            Yêu cầu của Task này:
          </div>

          <div className="text-sm text-gray-700">
            {task?.requiredSkills?.length ? (
              task.requiredSkills.map((req, index) => {
                const legacySkill = req as typeof req & {
                  skill?: string;
                  level?: number;
                };

                const skillName =
                  legacySkill.skill_id ?? legacySkill.skill ?? "Chưa xác định";

                const level = legacySkill.min_level ?? legacySkill.level;

                return (
                  <Tag key={`${skillName}-${index}`} color="blue">
                    {skillName}

                    {level !== undefined ? ` (Level ${level})` : ""}
                  </Tag>
                );
              })
            ) : (
              <span className="italic">Chưa có kỹ năng yêu cầu</span>
            )}
          </div>
        </div>

        {/* ================================== */}
        {/* ASSIGNED-ONLY NOTICE */}
        {/* ================================== */}

        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">
          Candidate Matching chỉ lấy nhân sự đang ở trạng thái{" "}
          <strong>ASSIGNED</strong> trong Sprint hiện tại.
        </div>

        {/* ================================== */}
        {/* TABLE */}
        {/* ================================== */}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={candidates}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{
            x: 1200,
          }}
          locale={{
            emptyText: "Sprint chưa có nhân sự ASSIGNED phù hợp để gán Task.",
          }}
          className="rounded-lg border border-gray-200"
        />
      </Drawer>

      {/* ==================================== */}
      {/* CANDIDATE COMPARE */}
      {/* ==================================== */}

      <CandidateCompareModal
        open={isCompareOpen}
        candidates={selectedCandidatesData}
        onClose={() => setIsCompareOpen(false)}
        onAssign={handleAssignTask}
      />
    </>
  );
};
