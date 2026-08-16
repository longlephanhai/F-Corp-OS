import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Badge,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Input,
  Avatar,
  Empty,
  Tooltip,
  Skeleton,
  Typography,
  Flex,
} from "antd";
import {
  TeamOutlined,
  CoffeeOutlined,
  AlertOutlined,
  DownloadOutlined,
  SearchOutlined,
  ThunderboltFilled,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { TeamMember, EmployeeStatus } from "../../common/types/pm";
import { pmApi } from "../../api/pm";
import { EvidenceApprovalModal } from "../../components/pm/sprints/EvidenceApprovalModal";

const { Title, Text } = Typography;

// ---- Cấu hình trạng thái: gom màu sắc + nhãn về một chỗ để dễ chỉnh sửa ----
const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string }> =
  {
    available: { label: "Sẵn sàng", color: "#16a34a" },
    bench: { label: "Bench", color: "#d97706" },
    on_project: { label: "Đang dự án", color: "#2563eb" },
  };

// ---- Sinh màu avatar ổn định theo tên, để mỗi người có một "chữ ký" màu riêng ----
const AVATAR_PALETTE = [
  "#6366f1",
  "#0891b2",
  "#7c3aed",
  "#d97706",
  "#db2777",
  "#059669",
];

const getAvatarColor = (name: string) => {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const MyTeamPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Giả sử bạn đã định nghĩa pmApi.getMyTeam() trong api/pm.ts gọi đến '/users/pm/my-team'
      const res = await pmApi.getMyTeam();
      setTeam(res?.data?.data || res?.data || []);
    } catch (error) {
      message.error("Lỗi khi lấy danh sách Team!");
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

  const handleExportCSV = () => {
    if (team.length === 0) {
      message.warning("Không có dữ liệu để xuất!");
      return;
    }

    const headers = [
      "Mã NV",
      "Họ và Tên",
      "Email",
      "Chức danh",
      "Trạng thái",
      "Số Bằng chứng chờ duyệt",
    ];

    const csvRows = team.map((member) => {
      const pendingCount = countPendingEvidences(member.userSkills);
      const row = [
        member.id,
        `"${member.fullName}"`,
        member.email,
        `"${member.title}"`,
        member.status.toUpperCase(),
        pendingCount,
      ];
      return row.join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...csvRows].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MyTeam_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Xuất báo cáo thành công!");
  };

  const filteredTeam = useMemo(() => {
    if (!searchText.trim()) return team;
    const q = searchText.trim().toLowerCase();
    return team.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q),
    );
  }, [team, searchText]);

  const columns = [
    {
      title: "Nhân sự",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: TeamMember) => (
        <div className="pmt-person-cell">
          <Avatar size={40} style={{ backgroundColor: getAvatarColor(text) }}>
            {getInitials(text)}
          </Avatar>
          <div className="pmt-person-info">
            <div className="pmt-person-name">{text}</div>
            <div className="pmt-person-email">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Chức danh",
      dataIndex: "title",
      key: "title",
      render: (title: string) => <Text type="secondary">{title}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: EmployeeStatus) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <span
            className="pmt-status-pill"
            style={{ color: cfg.color, background: `${cfg.color}14` }}
          >
            <span
              className="pmt-status-dot"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Bằng chứng chờ duyệt",
      key: "evidences",
      render: (_: any, record: TeamMember) => {
        const pendingCount = countPendingEvidences(record.userSkills);
        return pendingCount > 0 ? (
          <Tooltip title={`${pendingCount} bằng chứng đang chờ bạn duyệt`}>
            <Badge count={pendingCount} className="pmt-badge" />
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ opacity: 0.5 }}>
            —
          </Text>
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "right" as const,
      render: (_: any, record: TeamMember) => (
        <Button
          type="link"
          className="pmt-detail-btn"
          onClick={() => handleOpenModal(record)}
        >
          Xem chi tiết & Duyệt <ArrowRightOutlined />
        </Button>
      ),
    },
  ];

  const totalMembers = team.length;
  const benchMembers = team.filter((m) => m.status === "bench");
  const benchCount = benchMembers.length;
  const longBenchMembers = benchMembers;

  return (
    <div className="pmt-page">
      {/* ---------- Header ---------- */}
      <div className="pmt-header">
        <div>
          <div className="pmt-eyebrow">
            <ThunderboltFilled /> Quản lý đội nhóm
          </div>
          <Title level={2} className="pmt-title">
            My Team
          </Title>
          <Text className="pmt-subtitle">
            Giám sát năng lực và trạng thái điều phối của nhân sự trong đội của
            bạn
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          className="pmt-export-btn"
        >
          Xuất báo cáo (CSV)
        </Button>
      </div>

      {/* ---------- Stat cards ---------- */}
      <Row gutter={[20, 20]} className="pmt-stat-row">
        <Col xs={24} md={8}>
          <Card bordered={false} className="pmt-stat-card">
            <Flex align="center" gap={14}>
              <div className="pmt-stat-icon pmt-icon-indigo">
                <TeamOutlined />
              </div>
              <div>
                <Text className="pmt-stat-label">Tổng quân số</Text>
                <div className="pmt-stat-value">
                  {totalMembers}{" "}
                  <span className="pmt-stat-suffix">nhân sự</span>
                </div>
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="pmt-stat-card">
            <Flex align="center" gap={14}>
              <div className="pmt-stat-icon pmt-icon-amber">
                <CoffeeOutlined />
              </div>
              <div>
                <Text className="pmt-stat-label">Đang ngồi Bench</Text>
                <div className="pmt-stat-value" style={{ color: "#b45309" }}>
                  {benchCount} <span className="pmt-stat-suffix">nhân sự</span>
                </div>
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {longBenchMembers.length > 0 ? (
            <Alert
              message={
                <span className="pmt-alert-title">Cảnh báo: Bench kéo dài</span>
              }
              description={
                <ul className="pmt-alert-list">
                  {longBenchMembers.slice(0, 2).map((m) => (
                    <li key={m.id}>{m.fullName} — đang lãng phí tài nguyên</li>
                  ))}
                  {longBenchMembers.length > 2 && (
                    <li>... và {longBenchMembers.length - 2} người khác</li>
                  )}
                </ul>
              }
              type="error"
              showIcon
              icon={<AlertOutlined />}
              className="pmt-alert-card"
            />
          ) : (
            <Card bordered={false} className="pmt-stat-card pmt-success-card">
              <Flex align="center" gap={10} style={{ height: "100%" }}>
                <span className="pmt-success-emoji">🎉</span>
                <Text className="pmt-success-text">
                  Tối ưu — không có nhân sự bench lâu ngày.
                </Text>
              </Flex>
            </Card>
          )}
        </Col>
      </Row>

      {/* ---------- Table ---------- */}
      <div className="pmt-table-card">
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap={12}
          className="pmt-table-toolbar"
        >
          <Text className="pmt-table-title">
            Danh sách nhân sự{" "}
            <span className="pmt-table-count">({filteredTeam.length})</span>
          </Text>
          <Input
            allowClear
            placeholder="Tìm theo tên, email, chức danh..."
            prefix={<SearchOutlined style={{ color: "#c0c4cc" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pmt-search"
          />
        </Flex>

        {loading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTeam}
            rowKey="id"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            className="pmt-table"
            locale={{
              emptyText: (
                <Empty
                  description={
                    searchText
                      ? "Không tìm thấy nhân sự phù hợp"
                      : "Chưa có nhân sự nào trong team"
                  }
                />
              ),
            }}
          />
        )}
      </div>

      <EvidenceApprovalModal
        open={isModalOpen}
        member={selectedMember}
        onClose={() => setIsModalOpen(false)}
        onRefresh={() => fetchTeam()}
      />

      {/* ---------- Toàn bộ style của trang, viết bằng CSS thuần, KHÔNG phụ thuộc Tailwind ---------- */}
      <style>{`
        .pmt-page {
          padding: 28px 32px 48px;
          background: #f4f6fb;
          min-height: 100vh;
        }

        .pmt-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }
        .pmt-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .pmt-title.ant-typography {
          margin: 0 0 4px 0 !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          letter-spacing: -0.02em;
        }
        .pmt-subtitle {
          color: #64748b;
          font-size: 14px;
        }
        .pmt-export-btn.ant-btn {
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 600;
          background: linear-gradient(135deg, #4338ca, #6366f1);
          border: none;
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.28);
        }
        .pmt-export-btn.ant-btn:hover {
          background: linear-gradient(135deg, #3730a3, #4f46e5) !important;
        }

        .pmt-stat-row {
          margin-bottom: 24px;
        }
        .pmt-stat-card.ant-card {
          border-radius: 18px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04);
          height: 100%;
        }
        .pmt-stat-card .ant-card-body {
          padding: 22px;
          height: 100%;
        }
        .pmt-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .pmt-icon-indigo { background: #eef2ff; color: #4f46e5; }
        .pmt-icon-amber { background: #fffbeb; color: #d97706; }
        .pmt-stat-label {
          display: block;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .pmt-stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .pmt-stat-suffix {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
        }

        .pmt-success-card { background: #ecfdf5; }
        .pmt-success-emoji { font-size: 26px; }
        .pmt-success-text.ant-typography {
          color: #047857;
          font-weight: 600;
          font-size: 13.5px;
        }

        .pmt-alert-card.ant-alert {
          border-radius: 18px;
          height: 100%;
          border: 1px solid #fecaca;
          background: #fef2f2;
          padding: 18px 20px;
        }
        .pmt-alert-title { color: #b91c1c; font-weight: 700; font-size: 13.5px; }
        .pmt-alert-list {
          margin: 6px 0 0;
          padding-left: 16px;
          color: #dc2626;
          font-size: 12.5px;
          line-height: 1.6;
        }

        .pmt-table-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #eef0f4;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }
        .pmt-table-toolbar {
          padding: 18px 24px;
          border-bottom: 1px solid #f1f3f7;
        }
        .pmt-table-title.ant-typography {
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
        }
        .pmt-table-count { color: #94a3b8; font-weight: 500; }
        .pmt-search.ant-input-affix-wrapper {
          width: 280px;
          border-radius: 10px;
          border-color: #e5e7eb;
        }

        .pmt-table.ant-table-wrapper .ant-table-thead > tr > th {
          background: #fafbfc;
          color: #94a3b8;
          font-weight: 700;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #eef0f4;
        }
        .pmt-table.ant-table-wrapper .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f4f5f8;
          padding-top: 16px;
          padding-bottom: 16px;
        }
        .pmt-table.ant-table-wrapper .ant-table-tbody > tr:hover > td {
          background: #f8f9fd !important;
        }
        .pmt-table.ant-table-wrapper .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }

        .pmt-person-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pmt-person-info { min-width: 0; }
        .pmt-person-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pmt-person-email {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pmt-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .pmt-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .pmt-badge .ant-badge-count {
          background: #ef4444;
          box-shadow: none;
          font-weight: 700;
        }

        .pmt-detail-btn.ant-btn {
          font-weight: 600;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 640px) {
          .pmt-page { padding: 18px 16px 32px; }
          .pmt-search.ant-input-affix-wrapper { width: 100%; }
        }
      `}</style>
    </div>
  );
};
