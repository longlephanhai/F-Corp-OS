import React, { useState } from "react";
import {
  Modal,
  List,
  Tag,
  Button,
  Input,
  message,
  Divider,
  Avatar,
  Empty,
} from "antd";
import {
  LinkOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import type { TeamMember } from "../../../common/types/pm";
import { SkillRadarChart } from "./SkillRadarChart";
import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onRefresh: () => void; // Gọi lại hàm này để load lại bảng sau khi duyệt
}

// ---- Cấu hình trạng thái bằng chứng: gom màu + icon về một chỗ ----
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Chờ duyệt",
    color: "gold",
    icon: <ClockCircleFilled />,
  },
  verified: {
    label: "Đã duyệt",
    color: "green",
    icon: <CheckCircleFilled />,
  },
  rejected: {
    label: "Từ chối",
    color: "red",
    icon: <CloseCircleFilled />,
  },
};

const EVIDENCE_TYPE_LABEL: Record<string, string> = {
  certification: "Chứng chỉ",
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
  const pendingCount = allEvidences.filter(
    (e) => e.status === "pending",
  ).length;

  const handleVerify = async (evidenceId: string) => {
    try {
      // Gọi API với status: 'verified'
      await pmApi.verifyEvidence(evidenceId, { status: "verified" });
      message.success("Đã duyệt bằng chứng thành công! (Điểm tin cậy đã tăng)");
      onRefresh(); // Load lại data
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
      // Gọi API với status: 'rejected' kèm lý do
      await pmApi.verifyEvidence(evidenceId, {
        status: "rejected",
        rejectReason,
      });
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
        <div className="flex items-center gap-3 py-1">
          <Avatar
            size={44}
            style={{ backgroundColor: "#4f46e5", fontWeight: 600 }}
          >
            {getInitials(member.fullName)}
          </Avatar>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              {member.fullName}
            </div>
            <div className="text-xs text-gray-400 font-normal">
              Hồ sơ năng lực & bằng chứng
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      styles={{ body: { paddingTop: 8 } }}
    >
      <div className="flex flex-col md:flex-row gap-5 mt-3">
        {/* Cột trái: Biểu đồ */}
        <div className="w-full md:w-[42%] bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 className="text-center font-semibold text-gray-700 text-sm mb-3">
            Ma trận kỹ năng
          </h3>
          <SkillRadarChart skills={member.userSkills} />
        </div>

        {/* Cột phải: Danh sách bằng chứng */}
        <div className="w-full md:w-[58%]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 text-sm">
              Bằng chứng / Chứng chỉ
            </h3>
            {pendingCount > 0 && (
              <Tag color="gold" className="rounded-full border-0 font-medium">
                {pendingCount} đang chờ duyệt
              </Tag>
            )}
          </div>

          <List
            className="max-h-[420px] overflow-y-auto pr-1 -mr-1"
            dataSource={allEvidences}
            locale={{
              emptyText: (
                <Empty description="Chưa có bằng chứng nào được nộp" />
              ),
            }}
            renderItem={(item) => {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
              return (
                <List.Item className="!p-0 !border-0 mb-3 block">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition">
                    <div className="flex justify-between items-start gap-2 mb-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Tag color="blue" className="rounded-full border-0 m-0">
                          {item.skillName}
                        </Tag>
                        <Tag
                          color={
                            item.evidenceType === "certification"
                              ? "purple"
                              : "cyan"
                          }
                          className="rounded-full border-0 m-0"
                        >
                          {EVIDENCE_TYPE_LABEL[item.evidenceType] ??
                            item.evidenceType}
                        </Tag>
                      </div>
                      <Tag
                        icon={cfg.icon}
                        color={cfg.color}
                        className="rounded-full border-0 m-0 flex items-center gap-1"
                      >
                        {cfg.label}
                      </Tag>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1 text-sm">
                      <LinkOutlined className="text-gray-400" />
                      <a
                        href={item.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 break-all"
                      >
                        {item.evidenceUrl}
                      </a>
                    </div>

                    {/* Nếu đang chờ duyệt thì hiện nút bấm */}
                    {item.status === "pending" && (
                      <>
                        <Divider className="!my-3" />
                        {rejectingId === item.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Lý do từ chối..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              size="small"
                              autoFocus
                              className="!rounded-lg"
                              onPressEnter={() => handleReject(item.id)}
                            />
                            <Button
                              type="primary"
                              danger
                              size="small"
                              className="!rounded-lg shrink-0"
                              onClick={() => handleReject(item.id)}
                            >
                              Chốt
                            </Button>
                            <Button
                              size="small"
                              className="!rounded-lg shrink-0"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="small"
                              danger
                              className="!rounded-lg"
                              onClick={() => setRejectingId(item.id)}
                            >
                              Từ chối
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              className="!rounded-lg !bg-gray-900 hover:!bg-gray-800 !border-0"
                              onClick={() => handleVerify(item.id)}
                            >
                              Duyệt hợp lệ
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
