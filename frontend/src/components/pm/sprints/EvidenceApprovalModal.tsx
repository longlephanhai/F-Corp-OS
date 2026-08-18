import React, { useState } from "react";
import {
  Modal,
  Tag,
  Button,
  Input,
  message,
  Avatar,
  Empty,
  Typography,
  Space,
  Collapse,
} from "antd";
import {
  LinkOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { TeamMember } from "../../../common/types/pm";
import { SkillRadarChart } from "./SkillRadarChart";
import { pmApi } from "../../../api/pm";

const { Link } = Typography;

interface Props {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onRefresh: () => void;
}

// Cấu hình trạng thái bằng chứng
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleFilled /> },
  verified: { label: "Đã duyệt", color: "green", icon: <CheckCircleFilled /> },
  rejected: { label: "Từ chối", color: "red", icon: <CloseCircleFilled /> },
};

const EVIDENCE_TYPE_LABEL: Record<string, string> = {
  certification: "Chứng chỉ",
  project_link: "Link dự án",
  peer_review: "Đánh giá đồng nghiệp",
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

  // Lọc ra TẤT CẢ bằng chứng để đếm số lượng pending
  const allEvidences = member.userSkills.flatMap((sk) =>
    sk.evidences.map((ev) => ({ ...ev, skillName: sk.skill.name })),
  );
  const pendingCount = allEvidences.filter(
    (e) => e.status === "pending",
  ).length;

  const handleVerify = async (evidenceId: string) => {
    try {
      await pmApi.verifyEvidence(evidenceId, { status: "verified" });
      message.success("Đã duyệt bằng chứng thành công! (Điểm tin cậy đã tăng)");
      onRefresh();
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
      width={950}
      styles={{ body: { paddingTop: 8 } }}
      destroyOnClose
    >
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* === CỘT TRÁI: BIỂU ĐỒ === */}
        <div className="w-full md:w-[45%] bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 w-full text-center">
            Ma trận kỹ năng
          </h3>
          <div className="w-full min-h-[300px]">
            <SkillRadarChart skills={member.userSkills} />
          </div>
        </div>

        {/* === CỘT PHẢI: DANH SÁCH BẰNG CHỨNG === */}
        <div className="w-full md:w-[55%]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 text-sm">
              Bằng chứng / Chứng chỉ
            </h3>
            {pendingCount > 0 && (
              <Tag
                color="gold"
                className="rounded-full border-0 font-medium m-0"
              >
                {pendingCount} đang chờ duyệt
              </Tag>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {member.userSkills && member.userSkills.length > 0 ? (
              <Collapse
                // Mở sẵn tất cả các tab cho PM dễ nhìn
                defaultActiveKey={member.userSkills.map((sk) => sk.id)}
                items={member.userSkills.map((userSkill) => {
                  const pendingEvidences = userSkill.evidences.filter(
                    (e) => e.status === "pending",
                  );

                  return {
                    key: userSkill.id,
                    label: (
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-semibold text-gray-800">
                          {userSkill.skill.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          (Lv.{userSkill.level})
                        </span>
                        {pendingEvidences.length > 0 && (
                          <Tag
                            color="gold"
                            className="ml-auto rounded-full border-0 m-0"
                          >
                            {pendingEvidences.length} chờ
                          </Tag>
                        )}
                      </div>
                    ),
                    children: (
                      <div className="flex flex-col gap-3">
                        {userSkill.evidences &&
                        userSkill.evidences.length > 0 ? (
                          userSkill.evidences.map((ev) => {
                            const cfg =
                              STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.pending;
                            return (
                              <div
                                key={ev.id}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                              >
                                {/* Hàng 1: Nút Duyệt / Hủy và Tag trạng thái */}
                                <div className="flex justify-between items-start mb-2 gap-2">
                                  <Tag
                                    icon={cfg.icon}
                                    color={cfg.color}
                                    className="rounded-full border-0 m-0 flex items-center gap-1 shrink-0 text-xs"
                                  >
                                    {cfg.label}
                                  </Tag>

                                  {ev.status === "pending" &&
                                    rejectingId !== ev.id && (
                                      <Space size="small" className="shrink-0">
                                        <Button
                                          size="small"
                                          danger
                                          icon={<CloseCircleOutlined />}
                                          onClick={() => setRejectingId(ev.id)}
                                        >
                                          Từ chối
                                        </Button>
                                        <Button
                                          size="small"
                                          type="primary"
                                          className="!bg-green-500 hover:!bg-green-600"
                                          icon={<CheckCircleOutlined />}
                                          onClick={() => handleVerify(ev.id)}
                                        >
                                          Duyệt
                                        </Button>
                                      </Space>
                                    )}
                                </div>

                                {/* Hàng 2: Link đính kèm */}
                                <div className="bg-slate-50 p-2 rounded mb-1">
                                  <Link
                                    href={ev.evidenceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs break-all"
                                  >
                                    <LinkOutlined /> Xem bằng chứng (
                                    {EVIDENCE_TYPE_LABEL[ev.evidenceType] ??
                                      ev.evidenceType}
                                    )
                                  </Link>
                                </div>

                                {/* Hàng 3: Input lý do từ chối (Chỉ hiện khi PM bấm Từ chối) */}
                                {rejectingId === ev.id && (
                                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                                    <Input
                                      placeholder="Nhập lý do từ chối..."
                                      value={rejectReason}
                                      onChange={(e) =>
                                        setRejectReason(e.target.value)
                                      }
                                      size="small"
                                      autoFocus
                                      className="!rounded-md"
                                      onPressEnter={() => handleReject(ev.id)}
                                    />
                                    <Button
                                      type="primary"
                                      danger
                                      size="small"
                                      className="!rounded-md shrink-0"
                                      onClick={() => handleReject(ev.id)}
                                    >
                                      Chốt
                                    </Button>
                                    <Button
                                      size="small"
                                      className="!rounded-md shrink-0"
                                      onClick={() => {
                                        setRejectingId(null);
                                        setRejectReason("");
                                      }}
                                    >
                                      Hủy
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Chưa có bằng chứng nào được nộp.
                          </span>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <Empty description="Chưa có kỹ năng/bằng chứng nào" />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
