import React from "react";
import { Button, Table, Tag, Typography } from "antd";

import type { TaskItem } from "../../../common/types/pm";

const { Text } = Typography;

interface Props {
  tasks: TaskItem[];
  loading?: boolean;

  onCreateTask: () => void;

  onFindCandidate: (task: TaskItem) => void;
}

export const SprintTaskTable: React.FC<Props> = ({
  tasks,
  loading = false,
  onCreateTask,
  onFindCandidate,
}) => {
  const columns = [
    {
      title: "Thời gian",
      key: "time",

      render: (_: unknown, record: TaskItem) => (
        <div>
          <div>
            <Text type="secondary">Từ:</Text> {record.startDate ?? "N/A"}
          </div>

          <div>
            <Text type="secondary">Đến:</Text> {record.endDate ?? "N/A"}
          </div>
        </div>
      ),
    },

    {
      title: "Kỹ năng yêu cầu",
      dataIndex: "requiredSkills",
      key: "skills",

      render: (skills: TaskItem["requiredSkills"]) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {skills?.map((skill, index) => {
            const legacySkill = skill as typeof skill & {
              skill?: string;
              level?: number;
              years?: number;
            };

            const skillName =
              legacySkill.skill_id ?? legacySkill.skill ?? "Chưa xác định";

            const level = legacySkill.min_level ?? legacySkill.level;

            return (
              <Tag key={`${skillName}-${index}`} color="processing">
                {skillName}

                {level !== undefined ? ` · Lv.${level}` : ""}

                {legacySkill.years ? ` · ${legacySkill.years} năm` : ""}
              </Tag>
            );
          })}
        </div>
      ),
    },

    {
      title: "Ngân sách",
      dataIndex: "budgetRate",
      key: "budget",

      render: (value: number) => (
        <Text
          strong
          style={{
            color: "#16a34a",
          }}
        >
          ${Number(value ?? 0)}
        </Text>
      ),
    },

    {
      title: "Nhân sự đảm nhận",
      dataIndex: "userId",
      key: "user",

      render: (userId: string) =>
        userId ? (
          <Tag color="green">Đã có người</Tag>
        ) : (
          <Tag color="orange">Đang thiếu</Tag>
        ),
    },

    {
      title: "Thao tác",
      key: "action",

      render: (_: unknown, record: TaskItem) => (
        <Button
          type="primary"
          ghost
          size="small"
          onClick={() => onFindCandidate(record)}
        >
          Tìm nhân sự
        </Button>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text type="secondary">
          Quản lý yêu cầu công việc và tìm nhân sự phù hợp.
        </Text>

        <Button type="primary" onClick={onCreateTask}>
          + Tạo Task mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        pagination={false}
        loading={loading}
      />
    </>
  );
};
