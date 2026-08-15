import React, { useState, useEffect } from "react";
import { Drawer, Table, Button, Progress, Tag, Avatar, message } from "antd";
import type { TaskItem, TeamMember } from "../../../common/types/pm";

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
  const [candidates, setCandidates] = useState<any[]>([]);

  // Giả lập gọi API tìm ứng viên mỗi khi Drawer mở ra
  useEffect(() => {
    if (open && task) {
      fetchMatchingCandidates();
    }
  }, [open, task]);

  const fetchMatchingCandidates = () => {
    setLoading(true);
    // Giả lập độ trễ API 1 giây
    setTimeout(() => {
      // Data giả lập BE trả về: danh sách Dev kèm tỷ lệ % khớp kỹ năng
      setCandidates([
        {
          id: "dev-001",
          fullName: "Lê Văn Lính",
          title: "Senior Frontend",
          status: "available",
          matchScore: 95, // 95% khớp
          matchedSkills: ["ReactJS", "Figma"],
          missingSkills: [],
        },
        {
          id: "dev-002",
          fullName: "Trần Thị Backend",
          title: "NodeJS Developer",
          status: "bench",
          matchScore: 60,
          matchedSkills: ["NodeJS"],
          missingSkills: ["ReactJS"],
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleAssign = (devId: string) => {
    message.success(`Đã gửi yêu cầu gán Dev ${devId} vào Task này!`);
    // Chỗ này sau sẽ gọi pmApi.assignUserToSprint / Task
    onClose();
  };

  const columns = [
    {
      title: "Ứng viên",
      key: "user",
      render: (_: any, record: any) => (
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
      render: (_: any, record: any) => (
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
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          disabled={record.status === "on_project"}
          onClick={() => handleAssign(record.id)}
        >
          Chọn (Assign)
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div>
          <h3 className="text-lg font-bold m-0">
            Gợi ý Nhân sự (Rule-based Matching)
          </h3>
          <span className="text-sm text-gray-500 font-normal">
            Cho Task: Tìm người code UI/UX
          </span>
        </div>
      }
      placement="right"
      width={700}
      onClose={onClose}
      open={open}
    >
      <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="font-semibold text-blue-800 mb-1">
          Yêu cầu của Task này:
        </div>
        <div className="text-sm text-gray-700">
          {task?.requiredSkills?.map((req, idx) => (
            <Tag key={idx} color="blue">
              {req.skill_id} (Level {req.min_level})
            </Tag>
          )) || <span className="italic">Chưa có kỹ năng yêu cầu</span>}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={candidates}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </Drawer>
  );
};
