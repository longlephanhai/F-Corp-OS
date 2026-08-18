import React from "react";
import { Modal, Button, Progress, Tag, Avatar, Badge ,Tooltip} from "antd";
interface Props {
  open: boolean;
  candidates: any[];
  onClose: () => void;
  onAssign: (devId: string) => void;
}

export const CandidateCompareModal: React.FC<Props> = ({
  open,
  candidates,
  onClose,
  onAssign,
}) => {
  if (!candidates || candidates.length === 0) return null;

  return (
    <Modal
      title={
        <span className="text-2xl font-bold text-gray-800">
          ⚖️ So sánh Ứng viên
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={Math.max(800, candidates.length * 300)} // Tự động nở rộng theo số lượng Dev
      destroyOnClose
    >
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <tbody>
            {/* HÀNG 1: THÔNG TIN CƠ BẢN & NÚT CHỌN */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 w-48 bg-gray-50">
                Ứng viên
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 text-center min-w-[250px]"
                >
                  <Avatar size={64} className="bg-blue-600 mb-2 text-xl">
                    {dev.fullName.charAt(0)}
                  </Avatar>
                  <div className="font-bold text-lg text-gray-800">
                    {dev.fullName}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">{dev.title}</div>
                  <Tooltip
                    title={
                      dev.status === "on_project"
                        ? `Đang vướng dự án khác. Không thể điều động!`
                        : ""
                    }
                    color="red"
                  >
                    <Button
                      type="primary"
                      size="large"
                      className={
                        dev.status === "on_project"
                          ? "bg-gray-300 text-gray-500"
                          : "bg-green-600 hover:bg-green-700"
                      }
                      disabled={dev.status === "on_project"}
                      onClick={() => onAssign(dev.id)}
                    >
                      {dev.status === "on_project"
                        ? "Đang bận"
                        : "Chốt nhân sự này"}
                    </Button>
                  </Tooltip>
                </td>
              ))}
            </tr>

            {/* HÀNG 2: MỨC ĐỘ PHÙ HỢP */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 bg-gray-50">
                Độ khớp Task
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 text-center"
                >
                  <Progress
                    type="dashboard"
                    percent={dev.matchScore}
                    size={80}
                    status={dev.matchScore >= 80 ? "success" : "active"}
                  />
                </td>
              ))}
            </tr>

            {/* HÀNG 3: TRẠNG THÁI HIỆN TẠI */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 bg-gray-50">
                Trạng thái
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 text-center"
                >
                  <Badge
                    status={
                      dev.status === "available"
                        ? "success"
                        : dev.status === "bench"
                          ? "warning"
                          : "error"
                    }
                    text={
                      <span className="font-medium uppercase">
                        {dev.status}
                      </span>
                    }
                  />
                </td>
              ))}
            </tr>

            {/* HÀNG 4: KỸ NĂNG ĐÁP ỨNG ĐƯỢC */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 bg-gray-50">
                Kỹ năng có sẵn
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 align-top"
                >
                  <div className="flex flex-wrap gap-1 justify-center">
                    {dev.matchedSkills.length > 0 ? (
                      dev.matchedSkills.map((sk: string) => (
                        <Tag color="green" key={sk}>
                          ✓ {sk}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Không có</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* HÀNG 5: KỸ NĂNG CÒN THIẾU */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 bg-gray-50">
                Kỹ năng thiếu
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 align-top"
                >
                  <div className="flex flex-wrap gap-1 justify-center">
                    {dev.missingSkills.length > 0 ? (
                      dev.missingSkills.map((sk: string) => (
                        <Tag color="red" key={sk}>
                          ✗ {sk}
                        </Tag>
                      ))
                    ) : (
                      <Tag color="green">Đủ 100%</Tag>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* HÀNG 6: CHI PHÍ (COST RATE) */}
            <tr>
              <td className="p-4 border-b border-gray-200 font-semibold text-gray-500 bg-gray-50 rounded-bl-lg">
                Ngân sách (Cost/h)
              </td>
              {candidates.map((dev) => (
                <td
                  key={dev.id}
                  className="p-4 border-b border-gray-200 text-center font-bold text-lg text-blue-600"
                >
                  ${dev.costRate || Math.floor(Math.random() * 50 + 10)}/h
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
