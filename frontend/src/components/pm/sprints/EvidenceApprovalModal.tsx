import React, { useState } from "react";
import { Modal, List, Tag, Button, Input, message, Divider } from "antd";
import type { TeamMember } from "../../../common/types/pm";
import { SkillRadarChart } from "./SkillRadarChart";
import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onRefresh: () => void; // Gọi lại hàm này để load lại bảng sau khi duyệt
}

export const EvidenceApprovalModal: React.FC<Props> = ({
  open,
  member,
  onClose,
  onRefresh,
}) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  if (!member) return null;

  // Lọc ra TẤT CẢ bằng chứng của người này (gộp từ tất cả các skills)
  const allEvidences = member.userSkills.flatMap((sk) =>
    sk.evidences.map((ev) => ({ ...ev, skillName: sk.skill.name })),
  );

  const handleVerify = async (evidenceId: string) => {
    try {
      await pmApi.verifyEvidence(evidenceId);
      message.success("Đã duyệt bằng chứng thành công! (Điểm tin cậy đã tăng)");
      onRefresh(); // Cập nhật lại UI gốc
    } catch (error) {
      message.error("Lỗi khi duyệt bằng chứng");
    }
  };

  const handleReject = async (evidenceId: string) => {
    if (!rejectReason.trim()) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await pmApi.rejectEvidence(evidenceId, rejectReason);
      message.success("Đã từ chối bằng chứng!");
      setRejectingId(null);
      setRejectReason("");
      onRefresh();
    } catch (error) {
      message.error("Lỗi khi từ chối bằng chứng");
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-bold">
          Hồ sơ năng lực: {member.fullName}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Cột trái: Biểu đồ */}
        <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-center font-semibold text-gray-700 mb-2">
            Ma trận kỹ năng
          </h3>
          <SkillRadarChart skills={member.userSkills} />
        </div>

        {/* Cột phải: Danh sách bằng chứng */}
        <div className="w-full md:w-1/2">
          <h3 className="font-semibold text-gray-700 mb-2">
            Danh sách Bằng chứng / Chứng chỉ
          </h3>
          <List
            className="max-h-[400px] overflow-y-auto pr-2"
            dataSource={allEvidences}
            locale={{ emptyText: "Chưa có bằng chứng nào được nộp" }}
            renderItem={(item) => (
              <List.Item className="bg-white border border-gray-200 rounded-lg mb-3 p-4 block hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Tag color="blue">{item.skillName}</Tag>
                    <Tag
                      color={
                        item.evidenceType === "certification"
                          ? "purple"
                          : "cyan"
                      }
                    >
                      {item.evidenceType}
                    </Tag>
                  </div>
                  <Tag
                    color={
                      item.status === "pending"
                        ? "orange"
                        : item.status === "verified"
                          ? "green"
                          : "red"
                    }
                  >
                    {item.status.toUpperCase()}
                  </Tag>
                </div>

                <div className="mb-3">
                  <span className="text-sm text-gray-500">Link đính kèm: </span>
                  <a
                    href={item.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 break-all"
                  >
                    {item.evidenceUrl}
                  </a>
                </div>

                {/* Nếu đang chờ duyệt thì hiện nút bấm */}
                {item.status === "pending" && (
                  <>
                    <Divider className="my-2" />
                    {rejectingId === item.id ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Lý do từ chối..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          size="small"
                        />
                        <Button
                          type="primary"
                          danger
                          size="small"
                          onClick={() => handleReject(item.id)}
                        >
                          Chốt
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setRejectingId(null)}
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="small"
                          danger
                          onClick={() => setRejectingId(item.id)}
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleVerify(item.id)}
                        >
                          Duyệt hợp lệ
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </List.Item>
            )}
          />
        </div>
      </div>
    </Modal>
  );
};
