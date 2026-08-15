import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Select,
  message,
  Divider,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { pmApi } from "../../../api/pm";

interface Props {
  open: boolean;
  sprintId: string;
  onClose: () => void;
  onRefresh: () => void; // Load lại danh sách task sau khi tạo
}

// Giả lập danh sách Skill lấy từ DB (Thường sẽ gọi API getSkills)
const MOCK_SKILLS = [
  { value: "sk-1", label: "ReactJS" },
  { value: "sk-2", label: "NodeJS" },
  { value: "sk-3", label: "PostgreSQL" },
  { value: "sk-4", label: "Figma" },
  { value: "sk-5", label: "AWS" },
];

export const CreateTaskModal: React.FC<Props> = ({
  open,
  sprintId,
  onClose,
  onRefresh,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);

      // Xử lý dữ liệu DatePicker của Antd chuyển thành chuỗi YYYY-MM-DD
      const formattedData = {
        sprintId,
        budgetRate: values.budgetRate,
        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),
        requiredSkills: values.requiredSkills || [],
      };

      await pmApi.createTask(formattedData);
      message.success("Tạo Task thành công!");
      form.resetFields();
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tạo Task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl">Khởi tạo Task mới</span>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Tạo Task"
      cancelText="Hủy"
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <div className="flex gap-4">
          <Form.Item
            name="dateRange"
            label="Thời gian thực hiện"
            className="w-1/2"
            rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
          >
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="budgetRate"
            label="Ngân sách / Cost Rate ($)"
            className="w-1/2"
          >
            <InputNumber min={0} className="w-full" placeholder="Ví dụ: 1500" />
          </Form.Item>
        </div>

        <Divider orientation="left" plain>
          Yêu cầu Kỹ năng (Required Skills)
        </Divider>

        {/* VÙNG DYNAMIC FORM CHO MẢNG JSON */}
        <Form.List name="requiredSkills">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "skill_id"]}
                    rules={[{ required: true, message: "Chọn kỹ năng!" }]}
                  >
                    <Select
                      style={{ width: 200 }}
                      placeholder="Chọn kỹ năng"
                      options={MOCK_SKILLS}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "min_level"]}
                    rules={[{ required: true, message: "Nhập Level!" }]}
                  >
                    <InputNumber
                      min={1}
                      max={5}
                      placeholder="Level tối thiểu (1-5)"
                      style={{ width: 180 }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "weight"]}
                    initialValue={1}
                    rules={[{ required: true, message: "Nhập Trọng số!" }]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      placeholder="Trọng số ưu tiên"
                      style={{ width: 150 }}
                    />
                  </Form.Item>

                  <MinusCircleOutlined
                    className="text-red-500 hover:text-red-700 text-lg ml-2 cursor-pointer"
                    onClick={() => remove(name)}
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Yêu cầu Kỹ năng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
