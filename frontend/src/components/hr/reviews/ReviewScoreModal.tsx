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
import { StarOutlined } from '@ant-design/icons';

import type {
    ReviewRecordItem,
} from '../../../api/hrReviews';

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

const getInitials = (fullName: string): string => {
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
                <Flex align="center" gap={8}>
                    <StarOutlined style={{ color: '#7c3aed' }} />

                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                        Chấm điểm đánh giá
                    </span>
                </Flex>
            }
            open={open}
            onCancel={onCancel}
            onOk={onSubmit}
            okText="Lưu điểm"
            cancelText="Hủy"
            confirmLoading={loading}
            width={480}
            destroyOnClose
            okButtonProps={{
                disabled: waitingForPm,
                style: {
                    borderRadius: 8,
                    background: waitingForPm
                        ? undefined
                        : '#7c3aed',
                    borderColor: waitingForPm
                        ? undefined
                        : '#7c3aed',
                },
            }}
            cancelButtonProps={{
                style: { borderRadius: 8 },
            }}
        >
            {record && (
                <Flex
                    align="center"
                    gap={10}
                    style={{
                        marginBottom: 16,
                        padding: '12px 14px',
                        background: '#f5f3ff',
                        borderRadius: 10,
                        border: '1px solid #ddd6fe',
                    }}
                >
                    <Avatar
                        style={{
                            background: '#7c3aed',
                            flexShrink: 0,
                        }}
                    >
                        {record.employee
                            ? getInitials(record.employee.fullName)
                            : '?'}
                    </Avatar>

                    <Flex vertical>
                        <Text strong>
                            {record.employee?.fullName ?? '—'}
                        </Text>

                        <Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                        >
                            {record.employee?.email ?? ''}
                        </Text>
                    </Flex>
                </Flex>
            )}

            {record && waitingForPm && (
                <Alert
                    type="warning"
                    showIcon
                    message="PM chưa chấm điểm đánh giá"
                    description="Vui lòng yêu cầu PM chấm điểm đánh giá năng lực trước khi HR chốt điểm."
                    style={{
                        marginBottom: 16,
                        borderRadius: 8,
                    }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
            >
                <Form.Item
                    name="tempScore"
                    label={
                        <Flex gap={6} align="center">
                            <Text strong>Điểm sơ bộ của PM</Text>
                            <Tag
                                color="orange"
                                style={{ margin: 0, fontSize: 11 }}
                            >
                                Chỉ đọc
                            </Tag>
                        </Flex>
                    }
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
                    label={
                        <Flex gap={6} align="center">
                            <Text strong>Nhận xét của PM</Text>
                            <Tag
                                color="orange"
                                style={{ margin: 0, fontSize: 11 }}
                            >
                                Chỉ đọc
                            </Tag>
                        </Flex>
                    }
                >
                    <Input.TextArea
                        disabled
                        rows={3}
                        placeholder="PM chưa có nhận xét"
                    />
                </Form.Item>

                <Form.Item
                    name="finalScore"
                    label={
                        <Text strong style={{ color: '#7c3aed' }}>
                            Điểm chốt cuối cùng của HR
                        </Text>
                    }
                    rules={[
                        {
                            required: true,
                            message:
                                'Vui lòng nhập điểm chốt trước khi lưu',
                        },
                    ]}
                    extra={
                        <Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                        >
                            Điểm này sẽ được dùng khi hoàn tất đánh giá.
                        </Text>
                    }
                >
                    <InputNumber
                        min={0}
                        max={100}
                        disabled={waitingForPm}
                        style={{ width: '100%' }}
                        placeholder={
                            waitingForPm
                                ? 'Chờ PM chấm điểm trước'
                                : 'Nhập điểm từ 0 đến 100'
                        }
                        size="large"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReviewScoreModal;