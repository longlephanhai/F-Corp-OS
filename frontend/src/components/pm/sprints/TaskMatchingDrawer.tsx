import React, { useCallback, useState, useEffect } from "react";
import {
  Drawer,
  Table,
  Button,
  Progress,
  Tag,
  Avatar,
  message,
  Tooltip, // <-- Đã thêm Tooltip vào đây
} from "antd";
import type { TaskCandidate, TaskItem } from "../../../common/types/pm";
import { CandidateCompareModal } from "../CandidateCompareModal";
import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;
  task: TaskItem | null;
  onClose: () => void;
}

export const TaskMatchingDrawer: React.FC<Props> = ({
  open,
  task,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TaskCandidate[]>([]);

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

  const handleAssign = (devId: string) => {
    message.success(`Đã gửi yêu cầu gán Dev ${devId} vào Task này!`);
    // Chỗ này sau sẽ gọi pmApi.assignUserToSprint / Task
    setIsCompareOpen(false);
    onClose();
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
      render: (_: unknown, record: TaskCandidate) => (
        // --- ĐÃ CẬP NHẬT TOOLTIP VÀ UI CHO NÚT ASSIGN THEO YÊU CẦU ---
        <Tooltip
          title={
            record.status === "on_project"
              ? "Dev này đang vướng dự án khác chưa xong 100%. Không thể điều động!"
              : ""
          }
          color="red"
          placement="top"
        >
          <Button
            type="primary"
            size="small"
            disabled={record.status === "on_project"} // Khóa nút nếu đang bận
            className={
              record.status === "on_project"
                ? "bg-gray-300 text-gray-500"
                : "bg-green-600 hover:bg-green-700 border-none"
            }
            onClick={() => handleAssign(record.id)}
          >
            {record.status === "on_project" ? "Đang kẹt dự án" : "Gán Nhân Sự"}
          </Button>
        </Tooltip>
      ),
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
        width={850}
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
        onAssign={handleAssign}
      />
    </>
  );
};
