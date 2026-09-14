import React from 'react';
import {
    DatePicker,
    Flex,
    Form,
    Input,
    Modal,
    Select,
    Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export interface CreateReviewCycleFormValues {
    name: string;
    dateRange: [Dayjs, Dayjs];
    employeeIds?: string[];
}

interface Props {
    open: boolean;
    loading: boolean;
    form: FormInstance<CreateReviewCycleFormValues>;
    employeeOptions: Array<{
        label: string;
        value: string;
    }>;
    fetchingEmployees: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}

const CreateReviewCycleModal: React.FC<Props> = ({
    open,
    loading,
    form,
    employeeOptions,
    fetchingEmployees,
    onSubmit,
    onCancel,
}) => (
    <Modal
        title={
            <Flex align="center" gap={8}>
                <PlusOutlined style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                    Tạo kỳ đánh giá mới
                </span>
            </Flex>
        }
        open={open}
        onCancel={onCancel}
        onOk={onSubmit}
        okText="Tạo ngay"
        cancelText="Hủy"
        confirmLoading={loading}
        width={520}
        destroyOnClose
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
    >
        <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
            requiredMark={false}
        >
            <Form.Item
                name="name"
                label={<Text strong>Tên kỳ đánh giá</Text>}
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập tên kỳ đánh giá',
                    },
                    {
                        max: 255,
                        message: 'Tên không được vượt quá 255 ký tự',
                    },
                ]}
            >
                <Input
                    placeholder="Ví dụ: Đánh giá năng lực Q3/2026"
                    size="large"
                    style={{ borderRadius: 8 }}
                />
            </Form.Item>

            <Form.Item
                name="dateRange"
                label={<Text strong>Thời gian kỳ đánh giá</Text>}
                rules={[
                    {
                        required: true,
                        message:
                            'Vui lòng chọn thời gian bắt đầu và kết thúc',
                    },
                ]}
            >
                <RangePicker
                    size="large"
                    style={{ width: '100%', borderRadius: 8 }}
                    format="DD/MM/YYYY"
                    placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                    disabledDate={(current) =>
                        current &&
                        current.isBefore(new Date(), 'day')
                    }
                />
            </Form.Item>

            <Form.Item
                name="employeeIds"
                label={
                    <Text strong>
                        Nhân sự tham gia{' '}
                        <Text
                            type="secondary"
                            style={{ fontWeight: 400 }}
                        >
                            (tùy chọn)
                        </Text>
                    </Text>
                }
            >
                <Select
                    mode="multiple"
                    placeholder="Chọn nhân viên tham gia kỳ đánh giá..."
                    options={employeeOptions}
                    loading={fetchingEmployees}
                    filterOption={(input, option) =>
                        String(option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                    style={{ width: '100%' }}
                    allowClear
                    maxTagCount="responsive"
                />
            </Form.Item>
        </Form>
    </Modal>
);

export default CreateReviewCycleModal;