import React, { useCallback, useState, useEffect } from "react";
import {
  Drawer,
  Table,
  Button,
  Progress,
  Tag,
  Avatar,
  message,
  Tooltip,
  Modal,
  InputNumber,
} from "antd";
import type { TaskCandidate, TaskItem } from "../../../common/types/pm";
import { CandidateCompareModal } from "../CandidateCompareModal";
import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;
  task: TaskItem | null;

  // Sprint hiện tại mà PM đang quản lý
  sprintId: string;

  onClose: () => void;

  // Refresh lại Sprint sau khi tạo allocation
  onAssigned: () => void | Promise<void>;
}

export const TaskMatchingDrawer: React.FC<Props> = ({
  open,
  task,
  sprintId,
  onClose,
  onAssigned,
}) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TaskCandidate[]>([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState<TaskCandidate | null>(null);

  const [allocationPercent, setAllocationPercent] = useState<number>(100);

  const [assignLoading, setAssignLoading] = useState(false);

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  // --- STATE MỚI CHO TÍNH NĂNG SO SÁNH ---
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const fetchMatchingCandidates = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const response = await pmApi.getTaskCandidates(taskId);
      setCandidates(response.data.data ?? []);
    } catch (error) {
      console.error("Không thể tải danh sách ứng viên:", error);
      setCandidates([]);
      message.error("Không thể tải danh sách ứng viên phù hợp.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API tìm ứng viên mỗi khi Drawer mở ra.
  useEffect(() => {
    if (!open || !task) {
      return;
    }

    const requestTimer = window.setTimeout(() => {
      void fetchMatchingCandidates(task.id);
    }, 0);

    const resetSelectionTimer = window.setTimeout(
      () => setSelectedRowKeys([]),
      0,
    );

    return () => {
      window.clearTimeout(requestTimer);
      window.clearTimeout(resetSelectionTimer);
    };
  }, [fetchMatchingCandidates, open, task]);

  const handleCandidateAction = async (devId: string) => {
    const candidate = candidates.find((item) => item.id === devId);

    if (!candidate) {
      message.error("Không tìm thấy thông tin ứng viên.");

      return;
    }

    // ==========================================
    // CASE 1:
    // USER ĐÃ ASSIGNED VÀO SPRINT
    //
    // => GÁN TASK THẬT
    // ==========================================

    if (candidate.canAssignToTask) {
      if (!task) {
        return;
      }

      try {
        setAssignLoading(true);

        await pmApi.updateTaskAssignee(task.id, candidate.id);

        message.success(`Đã giao Task cho ${candidate.fullName}.`);

        setIsCompareOpen(false);

        await onAssigned();

        onClose();
      } catch (error: any) {
        console.error("Không thể gán Task:", error);

        const errorData = error?.response?.data;

        message.error(errorData?.message ?? "Không thể giao Task cho nhân sự.");
      } finally {
        setAssignLoading(false);
      }

      return;
    }

    // ==========================================
    // CASE 2:
    // ĐANG CÓ REQUEST/PENDING
    // ==========================================

    if (candidate.hasPendingRequest) {
      message.info("Nhân sự này đang có yêu cầu phân bổ trong Sprint.");

      return;
    }

    // ==========================================
    // CASE 3:
    // HẾT CAPACITY
    // ==========================================

    if (!candidate.canRequestAllocation) {
      message.warning("Nhân sự hiện không còn capacity để phân bổ vào Sprint.");

      return;
    }

    // ==========================================
    // CASE 4:
    // CHƯA THUỘC SPRINT
    //
    // => MỞ MODAL REQUEST ALLOCATION
    // ==========================================

    setSelectedCandidate(candidate);

    setAllocationPercent(Math.min(100, candidate.availableCapacity));

    setIsAllocationModalOpen(true);
  };

  const handleAssignTask = async (candidateId: string) => {
    if (!task) {
      return;
    }

    try {
      setAssignLoading(true);

      await pmApi.updateTaskAssignee(task.id, candidateId);

      message.success("Đã giao Task cho nhân sự.");

      setIsCompareOpen(false);

      await onAssigned();

      onClose();
    } catch (error: any) {
      console.error("Không thể gán Task:", error);

      message.error(error?.response?.data?.message ?? "Không thể giao Task.");
    } finally {
      setAssignLoading(false);
    }
  };
  const handleSubmitAllocation = async () => {
    if (!selectedCandidate) {
      message.error("Chưa chọn nhân sự.");
      return;
    }

    if (
      !allocationPercent ||
      allocationPercent < 1 ||
      allocationPercent > 100
    ) {
      message.warning("Công suất tham gia phải từ 1% đến 100%.");
      return;
    }
    if (allocationPercent > selectedCandidate.availableCapacity) {
      message.warning(
        `Nhân sự chỉ còn ${selectedCandidate.availableCapacity}% capacity.`,
      );

      return;
    }
    try {
      setAssignLoading(true);

      await pmApi.assignUserToSprint(
        sprintId,
        selectedCandidate.id,
        allocationPercent,
      );

      message.success(
        `Đã gửi yêu cầu phân bổ ${selectedCandidate.fullName} với ${allocationPercent}% công suất.`,
      );

      setIsAllocationModalOpen(false);
      setSelectedCandidate(null);
      setAllocationPercent(100);

      // đóng modal compare nếu đang mở
      setIsCompareOpen(false);

      // refresh bảng Allocation bên Sprint
      await onAssigned();

      // đóng drawer matching
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi gửi yêu cầu phân bổ:", error);

      const errorData = error?.response?.data;

      // ======================================
      // BỊ TRÙNG REQUEST TRONG CÙNG SPRINT
      // ======================================

      if (errorData?.code === "DUPLICATE_ALLOCATION") {
        message.warning("Nhân sự này đã có yêu cầu phân bổ trong Sprint.");

        return;
      }

      // ======================================
      // VƯỢT QUÁ CAPACITY
      // ======================================

      if (errorData?.code === "OVER_ALLOCATION") {
        Modal.warning({
          title: "Không đủ capacity",

          content: (
            <div className="mt-3 space-y-2">
              <div>
                Đang được phân bổ:{" "}
                <strong>{errorData.currentAllocation}%</strong>
              </div>

              <div>
                Yêu cầu thêm: <strong>{errorData.requestedAllocation}%</strong>
              </div>

              <div>
                Sau khi phân bổ:{" "}
                <strong className="text-red-500">
                  {errorData.afterAllocation}%
                </strong>
              </div>

              <div>
                Capacity còn lại:{" "}
                <strong className="text-green-600">
                  {errorData.availableCapacity}%
                </strong>
              </div>

              <div className="pt-2 text-gray-500">
                Hãy giảm % phân bổ hoặc chọn nhân sự khác.
              </div>
            </div>
          ),
        });

        return;
      }

      message.error(
        errorData?.message ?? "Không thể gửi yêu cầu phân bổ nhân sự.",
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const columns = [
    {
      title: "Ứng viên",
      key: "user",
      render: (_: unknown, record: TaskCandidate) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-blue-500">{record.fullName.charAt(0)}</Avatar>
          <div>
            <div className="font-semibold text-gray-800">{record.fullName}</div>
            <div className="text-xs text-gray-500">{record.title}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Độ phù hợp (Match %)",
      dataIndex: "matchScore",
      key: "matchScore",
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={
            score >= 80 ? "success" : score >= 50 ? "active" : "exception"
          }
        />
      ),
    },
    {
      title: "Capacity",

      key: "capacity",

      width: 140,

      render: (_: unknown, record: TaskCandidate) => (
        <div>
          <Progress
            percent={record.usedCapacity}
            size="small"
            showInfo={false}
            status={record.usedCapacity >= 100 ? "exception" : "active"}
          />

          <div
            style={{
              fontSize: 12,
            }}
          >
            Còn <strong>{record.availableCapacity}%</strong>
          </div>
        </div>
      ),
    },
    {
      title: "Trong Sprint",

      key: "sprintAllocation",

      width: 150,

      render: (_: unknown, record: TaskCandidate) => {
        switch (record.currentSprintAllocationStatus) {
          case "assigned":
            return (
              <Tag color="green">
                Assigned {record.currentSprintAllocationPercent}%
              </Tag>
            );

          case "requested":
            return <Tag color="blue">Requested</Tag>;

          case "pending_approval":
            return <Tag color="gold">Chờ duyệt</Tag>;

          default:
            return <Tag>Chưa tham gia</Tag>;
        }
      },
    },
    {
      title: "Phân tích Kỹ năng",
      key: "skills",
      render: (_: unknown, record: TaskCandidate) => (
        <div>
          {record.matchedSkills.map((sk: string) => (
            <Tag color="green" key={sk}>
              ✓ {sk}
            </Tag>
          ))}
          {record.missingSkills.map((sk: string) => (
            <Tag color="red" key={sk}>
              ✗ Thiếu {sk}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Hành động",

      key: "action",

      width: 170,

      render: (_: unknown, record: TaskCandidate) => {
        const isCurrentOwner = task?.userId === record.id;

        return (
          <Button
            type="primary"
            size="small"
            loading={assignLoading}
            disabled={isCurrentOwner}
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

  // --- CẤU HÌNH CHECKBOX CHO BẢNG ---
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

  // Lấy data của các ứng viên được tick chọn
  const selectedCandidatesData = candidates.filter((c) =>
    selectedRowKeys.includes(c.id),
  );

  return (
    <>
      <Drawer
        title={
          <div className="flex justify-between items-center pr-8">
            <div>
              <h3 className="text-lg font-bold m-0">Gợi ý Nhân sự</h3>
              <span className="text-sm text-gray-500 font-normal">
                Quyết định chọn người dựa trên mức độ phù hợp kỹ năng
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
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="font-semibold text-blue-800 mb-1">
            Yêu cầu của Task này:
          </div>
          <div className="text-sm text-gray-700">
            {task?.requiredSkills?.length ? (
              task.requiredSkills.map((req, idx) => {
                const legacySkill = req as typeof req & {
                  skill?: string;
                  level?: number;
                };
                const skillName =
                  legacySkill.skill_id ?? legacySkill.skill ?? "Chưa xác định";
                const level = legacySkill.min_level ?? legacySkill.level;

                return (
                  <Tag key={`${skillName}-${idx}`} color="blue">
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

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={candidates}
          loading={loading}
          rowKey="id"
          pagination={false}
          className="border border-gray-200 rounded-lg"
        />
      </Drawer>

      <CandidateCompareModal
        open={isCompareOpen}
        candidates={selectedCandidatesData}
        onClose={() => setIsCompareOpen(false)}
        onAssign={handleAssignTask}
      />

      <Modal
        title="Yêu cầu phân bổ nhân sự"
        open={isAllocationModalOpen}
        onCancel={() => {
          if (assignLoading) return;

          setIsAllocationModalOpen(false);
          setSelectedCandidate(null);
          setAllocationPercent(100);
        }}
        onOk={() => void handleSubmitAllocation()}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        confirmLoading={assignLoading}
        destroyOnClose
      >
        {selectedCandidate && (
          <div className="space-y-5 py-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Nhân sự</div>

              <div className="mt-1 font-semibold text-gray-900">
                {selectedCandidate.fullName}
              </div>

              <div className="text-sm text-gray-500">
                {selectedCandidate.title}
              </div>

              <div className="mt-2">
                <Tag color="blue">Match {selectedCandidate.matchScore}%</Tag>
              </div>
            </div>

            <div>
              <div className="mb-2 font-medium text-gray-700">
                Công suất tham gia Sprint (%)
              </div>

              <InputNumber
                min={1}
                max={selectedCandidate?.availableCapacity ?? 100}
                value={allocationPercent}
                onChange={(value) => setAllocationPercent(value ?? 100)}
                addonAfter="%"
                className="w-full"
              />
              <div
                style={{
                  marginTop: 8,
                }}
              >
                <span>
                  Capacity khả dụng:{" "}
                  <strong>{selectedCandidate?.availableCapacity ?? 0}%</strong>
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Ví dụ: 50% nghĩa là nhân sự dành khoảng một nửa công suất cho
                Sprint này.
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Yêu cầu sẽ được tạo ở trạng thái <strong>REQUESTED</strong>.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
