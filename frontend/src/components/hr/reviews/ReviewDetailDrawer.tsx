import React from 'react';
import {
    Avatar,
    Descriptions,
    Drawer,
    Flex,
    Spin,
    Tag,
    Typography,
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';

import type {
    ReviewRecordItem,
    ReviewRecordStatus,
} from '../../../api/hrReviews';

const { Text } = Typography;

interface ReviewDetailDrawerProps {
    open: boolean;
    loading: boolean;
    record: ReviewRecordItem | null;
    onClose: () => void;
}

const STATUS_CONFIG = {
    PENDING: {
        label: 'Chờ duyệt',
        color: 'orange',
        icon: <ClockCircleOutlined />,
    },
    IN_REVIEW: {
        label: 'Đang xét duyệt',
        color: 'blue',
        icon: <ExclamationCircleOutlined />,
    },
    COMPLETED: {
        label: 'Hoàn thành',
        color: 'green',
        icon: <CheckCircleOutlined />,
    },
} as const;

const AVATAR_COLORS = [
    '#0057c2',
    '#266d00',
    '#7d5400',
    '#614000',
    '#5c0a83',
    '#ba1a1a',
    '#006874',
];

const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarColor = (id: string): string =>
    AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (
    value: string | Date | null | undefined,
    withTime = false,
) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    return withTime
        ? date.toLocaleString('vi-VN')
        : date.toLocaleDateString('vi-VN');
};

const ReviewDetailDrawer: React.FC<ReviewDetailDrawerProps> = ({
    open,
    loading,
    record,
    onClose,
}) => {
    const statusConfig = record
        ? STATUS_CONFIG[
        record.status as keyof typeof STATUS_CONFIG
        ]
        : undefined;

    return (
        <Drawer
            title={
                <Flex align="center" gap={8}>
                    <EyeOutlined style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 600 }}>
                        Chi tiết đánh giá
                    </span>
                </Flex>
            }
            placement="right"
            width={600}
            open={open}
            onClose={onClose}
            destroyOnClose
        >
            {loading ? (
                <Flex
                    justify="center"
                    align="center"
                    style={{ height: 300 }}
                >
                    <Spin size="large" tip="Đang tải..." />
                </Flex>
            ) : record ? (
                <>
                    <Flex
                        align="center"
                        gap={14}
                        style={{
                            marginBottom: 24,
                            padding: 16,
                            background: '#f8faff',
                            borderRadius: 12,
                            border: '1px solid #eef2ff',
                        }}
                    >
                        <Avatar
                            size={56}
                            style={{
                                background: getAvatarColor(
                                    record.employee?.id ?? '0',
                                ),
                                fontSize: 20,
                                flexShrink: 0,
                            }}
                        >
                            {record.employee
                                ? getInitials(record.employee.fullName)
                                : '?'}
                        </Avatar>

                        <Flex vertical gap={2}>
                            <Text
                                strong
                                style={{ fontSize: 16 }}
                            >
                                {record.employee?.fullName ?? '—'}
                            </Text>

                            <Text
                                type="secondary"
                                style={{ fontSize: 13 }}
                            >
                                {record.employee?.email ?? ''}
                            </Text>

                            <Tag
                                style={{
                                    width: 'fit-content',
                                    marginTop: 2,
                                }}
                            >
                                {record.employee?.role?.name ??
                                    record.employee?.title ??
                                    '—'}
                            </Tag>
                        </Flex>
                    </Flex>

                    <Descriptions
                        bordered
                        column={1}
                        size="small"
                        labelStyle={{
                            width: 170,
                            fontWeight: 600,
                            background: '#fafafa',
                        }}
                        contentStyle={{
                            background: '#ffffff',
                        }}
                    >
                        <Descriptions.Item label="Tên kỳ đánh giá">
                            {record.reviewCycle?.name ?? '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Trạng thái chu kỳ">
                            <Tag color="blue">
                                {record.reviewCycle?.status ?? '—'}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Ngày bắt đầu">
                            {formatDate(record.reviewCycle?.startDate)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Ngày kết thúc">
                            {formatDate(record.reviewCycle?.endDate)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Điểm chốt cuối cùng">
                            {record.finalScore != null ? (
                                <Text
                                    strong
                                    style={{
                                        color:
                                            record.finalScore >= 85
                                                ? '#52c41a'
                                                : record.finalScore >= 70
                                                    ? '#faad14'
                                                    : '#ff4d4f',
                                    }}
                                >
                                    {Number(record.finalScore).toFixed(1)} / 100
                                </Text>
                            ) : (
                                <Text type="secondary">
                                    — Chưa có điểm
                                </Text>
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Trạng thái">
                            {statusConfig ? (
                                <Tag
                                    icon={statusConfig.icon}
                                    color={statusConfig.color}
                                    style={{
                                        borderRadius: 999,
                                        padding: '2px 10px',
                                        fontWeight: 500,
                                    }}
                                >
                                    {statusConfig.label}
                                </Tag>
                            ) : (
                                <Tag>
                                    {record.status as ReviewRecordStatus}
                                </Tag>
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Ngày tạo">
                            {formatDate(record.createdAt, true)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Cập nhật lần cuối">
                            {formatDate(record.updatedAt, true)}
                        </Descriptions.Item>
                    </Descriptions>
                </>
            ) : (
                <Flex
                    justify="center"
                    align="center"
                    style={{ height: 200 }}
                >
                    <Text type="secondary">
                        Không tìm thấy dữ liệu
                    </Text>
                </Flex>
            )}
        </Drawer>
    );
};

export default ReviewDetailDrawer;