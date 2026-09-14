import React from 'react';
import {
    Alert,
    Avatar,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Tag,
    Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import {
    SafetyCertificateOutlined,
    StarOutlined,
} from '@ant-design/icons';

import type { ReviewRecordItem } from '../../../api/hrReviews';

const { Text } = Typography;

export interface ReviewScoreFormValues {
    tempScore?: number;
    reviewerNote?: string;
    finalScore?: number;
}

interface Props {
    open: boolean;
    loading: boolean;
    record: ReviewRecordItem | null;
    form: FormInstance<ReviewScoreFormValues>;
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

const sectionStyle: React.CSSProperties = {
    padding: 16,
    borderRadius: 12,
};

const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const ReviewScoreModal: React.FC<Props> = ({
    open,
    loading,
    record,
    form,
    onSubmit,
    onCancel,
}) => {
    const waitingForPm =
        record?.tempScore === null ||
        record?.tempScore === undefined;

    return (
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
                            background: '#f5f3ff',
                            color: '#7c3aed',
                            fontSize: 18,
                        }}
                    >
                        <StarOutlined />
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
                            Chấm điểm đánh giá
                        </Text>

                        <Text
                            style={{
                                display: 'block',
                                marginTop: 3,
                                color: '#667085',
                                fontSize: 12,
                            }}
                        >
                            Xem kết quả từ PM và chốt điểm cuối cùng.
                        </Text>
                    </div>
                </Flex>
            }
            open={open}
            width={520}
            centered
            destroyOnClose
            confirmLoading={loading}
            okText="Lưu điểm chốt"
            cancelText="Hủy"
            onOk={onSubmit}
            onCancel={onCancel}
            okButtonProps={{
                disabled: waitingForPm,
                style: {
                    height: 40,
                    borderRadius: 9,
                    fontWeight: 600,
                    background: waitingForPm ? undefined : '#7c3aed',
                    borderColor: waitingForPm ? undefined : '#7c3aed',
                },
            }}
            cancelButtonProps={{
                style: { height: 40, borderRadius: 9 },
            }}
        >
            {record && (
                <Flex
                    align="center"
                    gap={12}
                    style={{
                        margin: '22px 0 16px',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #eaecf0',
                    }}
                >
                    <Avatar
                        size={42}
                        style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #dbeafe',
                            fontWeight: 700,
                        }}
                    >
                        {record.employee
                            ? getInitials(record.employee.fullName)
                            : '?'}
                    </Avatar>

                    <Flex vertical gap={2}>
                        <Text strong style={{ color: '#101828' }}>
                            {record.employee?.fullName ?? '—'}
                        </Text>

                        <Text style={{ color: '#667085', fontSize: 12 }}>
                            {record.employee?.email ?? ''}
                        </Text>

                        {record.reviewCycle?.name && (
                            <Text style={helperStyle}>
                                Kỳ đánh giá: {record.reviewCycle.name}
                            </Text>
                        )}
                    </Flex>
                </Flex>
            )}

            {record && waitingForPm && (
                <Alert
                    type="warning"
                    showIcon
                    message="Chưa thể chốt điểm"
                    description="PM chưa hoàn tất phần chấm điểm. HR chỉ có thể chốt điểm sau khi có điểm sơ bộ từ PM."
                    style={{ marginBottom: 16, borderRadius: 10 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
            >
                <div
                    style={{
                        ...sectionStyle,
                        marginBottom: 18,
                        background: '#f9fafb',
                        border: '1px solid #eaecf0',
                    }}
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: 14 }}
                    >
                        <div>
                            <Text
                                style={{
                                    display: 'block',
                                    color: '#344054',
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            >
                                Kết quả đánh giá từ PM
                            </Text>

                            <Text style={helperStyle}>
                                HR chỉ xem, không chỉnh sửa.
                            </Text>
                        </div>

                        <Tag
                            bordered={false}
                            style={{
                                margin: 0,
                                borderRadius: 999,
                                color: '#b54708',
                                background: '#fffaeb',
                                fontSize: 10,
                                fontWeight: 600,
                            }}
                        >
                            Chỉ đọc
                        </Tag>
                    </Flex>

                    <Form.Item
                        name="tempScore"
                        label={<Text style={labelStyle}>Điểm sơ bộ</Text>}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            disabled
                            style={{ width: '100%' }}
                            placeholder="PM chưa chấm điểm"
                        />
                    </Form.Item>

                    <Form.Item
                        name="reviewerNote"
                        label={<Text style={labelStyle}>Nhận xét của PM</Text>}
                        style={{ marginBottom: 0 }}
                    >
                        <Input.TextArea
                            disabled
                            rows={3}
                            placeholder="PM chưa có nhận xét"
                        />
                    </Form.Item>
                </div>

                <div
                    style={{
                        ...sectionStyle,
                        background: '#faf5ff',
                        border: '1px solid #e9d5ff',
                    }}
                >
                    <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                        <SafetyCertificateOutlined
                            style={{ color: '#7c3aed', fontSize: 16 }}
                        />

                        <div>
                            <Text
                                style={{
                                    display: 'block',
                                    color: '#6d28d9',
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            >
                                Điểm chốt của HR
                            </Text>

                            <Text style={{ color: '#7e22ce', fontSize: 11 }}>
                                Dùng khi hoàn tất đánh giá.
                            </Text>
                        </div>
                    </Flex>

                    <Form.Item
                        name="finalScore"
                        label={
                            <Text style={labelStyle}>
                                Điểm chốt cuối cùng
                            </Text>
                        }
                        rules={[
                            {
                                required: true,
                                message:
                                    'Vui lòng nhập điểm chốt trước khi lưu',
                            },
                        ]}
                        style={{ marginBottom: 0 }}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            size="large"
                            disabled={waitingForPm}
                            style={{ width: '100%' }}
                            placeholder={
                                waitingForPm
                                    ? 'Chờ PM chấm điểm trước'
                                    : 'Nhập điểm từ 0 đến 100'
                            }
                        />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default ReviewScoreModal;