import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { UserSkill } from "../../../common/types/pm";

interface Props {
  skills: UserSkill[];
}

export const SkillRadarChart: React.FC<Props> = ({ skills }) => {
  // Map dữ liệu từ API sang format của Recharts
  const data = skills.map((sk) => ({
    subject: sk.skill.name,
    level: sk.level,
    fullMark: 5, // Điểm tối đa là 5 (Level 1-5)
  }));

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 italic">
        Nhân sự chưa cập nhật kỹ năng nào.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#374151", fontSize: 12, fontWeight: "bold" }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
          <Radar
            name="Năng lực"
            dataKey="level"
            stroke="#2563eb" // Màu blue-600 của Tailwind
            fill="#3b82f6"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
