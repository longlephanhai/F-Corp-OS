import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Badge, message } from "antd";
import type { TeamMember, EmployeeStatus } from "../../common/types/pm";
import { pmApi } from "../../api/pm";
import { EvidenceApprovalModal } from "../../components/pm/sprints/EvidenceApprovalModal";

export const MyTeamPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [team, setTeam] = useState<TeamMember[]>([]);

  // --- THÊM STATE QUẢN LÝ MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await pmApi.getMyTeam();
      if (res && res.data) {
        setTeam(res.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách team:", error);
      // Giả lập Data nếu BE chưa xong (để FE test UI)
      setTeam([
        {
          id: "dev-1",
          fullName: "Lê Văn Lính",
          email: "linhlv@fpt.com",
          title: "Senior React",
          status: "available",
          userSkills: [
            {
              id: "sk-1",
              skill: { id: "s1", name: "ReactJS" },
              level: 4,
              years: 3,
              confidenceScore: 30,
              evidences: [
                {
                  id: "ev-1",
                  evidenceType: "certification",
                  evidenceUrl: "link-cert",
                  status: "pending",
                },
              ],
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm đếm số bằng chứng đang pending của 1 Dev
  const countPendingEvidences = (skills: TeamMember["userSkills"]) => {
    let count = 0;
    skills.forEach((sk) => {
      sk.evidences.forEach((ev) => {
        if (ev.status === "pending") count++;
      });
    });
    return count;
  };

  const handleOpenModal = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "Nhân sự",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: TeamMember) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: EmployeeStatus) => {
        const colorMap: Record<EmployeeStatus, string> = {
          available: "green",
          bench: "gold",
          on_project: "red",
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Bằng chứng chờ duyệt",
      key: "evidences",
      render: (_: any, record: TeamMember) => {
        const pendingCount = countPendingEvidences(record.userSkills);
        return pendingCount > 0 ? (
          <Badge count={pendingCount} style={{ backgroundColor: "#ff4d4f" }} />
        ) : (
          <span className="text-gray-400">Không có</span>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: TeamMember) => (
        <Button
          type="link"
          onClick={() => message.info("Mở Modal xem chi tiết kỹ năng")}
        >
          Xem chi tiết & Duyệt Kỹ năng
        </Button>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: TeamMember) => (
        <Button
          type="link"
          onClick={() => handleOpenModal(record)} // <--- SỬA CHỖ NÀY
        >
          Xem chi tiết & Duyệt Kỹ năng
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Quản lý Đội nhóm (My Team)
        </h2>
      </div>
      <Table
        columns={columns}
        dataSource={team}
        rowKey="id"
        loading={loading}
      />

      {/* --- RÁP MODAL VÀO ĐÂY --- */}
      <EvidenceApprovalModal
        open={isModalOpen}
        member={selectedMember}
        onClose={() => setIsModalOpen(false)}
        onRefresh={() => fetchTeam()} // Duyệt xong load lại data bảng
      />
    </div>
  );
};
