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
import {
    CalendarOutlined,
    PlusOutlined,
    TeamOutlined,
} from '@ant-design/icons';

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

const labelStyle: React.CSSProperties = {
    color: '#344054',
    fontSize: 13,
    fontWeight: 600,
};

const helperStyle: React.CSSProperties = {
    color: '#98a2b3',
    fontSize: 11,
};

const inputStyle: React.CSSProperties = {
    borderRadius: 9,
};

interface FieldLabelProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    optional?: boolean;
}

const FieldLabel: React.FC<FieldLabelProps> = ({
    icon,
    children,
    optional,
}) => (
    <Flex align="center" gap={6}>
        {icon}

        <Text style={labelStyle}>
            {children}
        </Text>

        {optional && (
            <Text style={helperStyle}>
                Tùy chọn
            </Text>
        )}
    </Flex>
);

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
            <Flex align="flex-start" gap={12}>
                <Flex
                    align="center"
                    justify="center"
                    style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        borderRadius: 11,
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: 18,
                    }}
                >
                    <PlusOutlined />
                </Flex>

                <div>
                    <Text
                        style={{
                            display: 'block',
                            color: '#101828',
                            fontSize: 17,
                            fontWeight: 700,
                        }}
                    >
                        Tạo kỳ đánh giá mới
                    </Text>

                    <Text
                        style={{
                            display: 'block',
                            marginTop: 3,
                            color: '#667085',
                            fontSize: 12,
                        }}
                    >
                        Thiết lập thời gian và nhân sự tham gia kỳ đánh giá.
                    </Text>
                </div>
            </Flex>
        }
        open={open}
        width={560}
        centered
        destroyOnClose
        confirmLoading={loading}
        okText="Tạo kỳ đánh giá"
        cancelText="Hủy"
        onOk={onSubmit}
        onCancel={onCancel}
        okButtonProps={{
            style: {
                height: 40,
                borderRadius: 9,
                fontWeight: 600,
            },
        }}
        cancelButtonProps={{
            style: {
                height: 40,
                borderRadius: 9,
            },
        }}
    >
        <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            style={{ marginTop: 24 }}
        >
            <Form.Item
                name="name"
                label={
                    <FieldLabel>
                        Tên kỳ đánh giá
                    </FieldLabel>
                }
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
                extra={
                    <Text style={helperStyle}>
                        Đặt tên ngắn gọn để dễ nhận biết kỳ đánh giá.
                    </Text>
                }
            >
                <Input
                    size="large"
                    placeholder="Ví dụ: Đánh giá năng lực Q3/2026"
                    style={inputStyle}
                />
            </Form.Item>

            <Form.Item
                name="dateRange"
                label={
                    <FieldLabel
                        icon={
                            <CalendarOutlined
                                style={{
                                    color: '#667085',
                                    fontSize: 13,
                                }}
                            />
                        }
                    >
                        Thời gian kỳ đánh giá
                    </FieldLabel>
                }
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
                    format="DD/MM/YYYY"
                    placeholder={[
                        'Ngày bắt đầu',
                        'Ngày kết thúc',
                    ]}
                    style={{
                        width: '100%',
                        ...inputStyle,
                    }}
                    disabledDate={(current) =>
                        current &&
                        current.isBefore(new Date(), 'day')
                    }
                />
            </Form.Item>

            <Form.Item
                name="employeeIds"
                label={
                    <FieldLabel
                        optional
                        icon={
                            <TeamOutlined
                                style={{
                                    color: '#667085',
                                    fontSize: 13,
                                }}
                            />
                        }
                    >
                        Nhân sự tham gia
                    </FieldLabel>
                }
                extra={
                    <Text style={helperStyle}>
                        Chọn một hoặc nhiều nhân sự cần đưa vào kỳ đánh giá.
                    </Text>
                }
            >
                <Select
                    mode="multiple"
                    size="large"
                    showSearch
                    allowClear
                    maxTagCount="responsive"
                    placeholder="Tìm và chọn nhân sự..."
                    options={employeeOptions}
                    loading={fetchingEmployees}
                    filterOption={(input, option) =>
                        String(option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                    notFoundContent={
                        fetchingEmployees
                            ? 'Đang tải danh sách nhân sự...'
                            : 'Không tìm thấy nhân sự phù hợp'
                    }
                />
            </Form.Item>
        </Form>
    </Modal>
);

export default CreateReviewCycleModal;