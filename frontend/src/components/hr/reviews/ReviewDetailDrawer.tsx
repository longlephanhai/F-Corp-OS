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
    SafetyCertificateOutlined,
    StarOutlined,
} from '@ant-design/icons';

import type {
    ReviewRecordItem,
    ReviewRecordStatus,
} from '../../../api/hrReviews';

const { Text } = Typography;

interface Props {
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

const ROLE_LABELS: Record<string, string> = {
    DEVELOPER: 'Lập trình viên',
    PM: 'Quản lý dự án',
    HR: 'Nhân sự',
    ADMIN: 'Quản trị viên',
};

const CYCLE_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Bản nháp',
    ACTIVE: 'Đang diễn ra',
    COMPLETED: 'Hoàn thành',
};

const sectionTitleStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 10,
    color: '#344054',
    fontSize: 13,
    fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
    padding: 14,
    borderRadius: 12,
    border: '1px solid #eaecf0',
};

const helperStyle: React.CSSProperties = {
    color: '#98a2b3',
    fontSize: 11,
};

const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatDate = (
    value: string | Date | null | undefined,
    withTime = false,
) => {
    if (!value) return '—';

    const date = new Date(value);

    return withTime
        ? date.toLocaleString('vi-VN')
        : date.toLocaleDateString('vi-VN');
};

const getScoreColor = (score: number) =>
    score >= 85
        ? '#16a34a'
        : score >= 70
          ? '#d97706'
          : '#dc2626';

const ScoreBlock = ({
    label,
    score,
    icon,
    variant = 'neutral',
}: {
    label: string;
    score: number | null | undefined;
    icon: React.ReactNode;
    variant?: 'neutral' | 'purple';
}) => {
    const purple = variant === 'purple';

    return (
        <Flex
            vertical
            gap={8}
            style={{
                ...cardStyle,
                flex: 1,
                background: purple ? '#faf5ff' : '#f9fafb',
                borderColor: purple ? '#e9d5ff' : '#eaecf0',
            }}
        >
            <Flex align="center" gap={7}>
                {icon}

                <Text
                    style={{
                        color: purple ? '#6d28d9' : '#475467',
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    {label}
                </Text>
            </Flex>

            {score != null ? (
                <Text
                    style={{
                        color: getScoreColor(Number(score)),
                        fontSize: 22,
                        fontWeight: 700,
                    }}
                >
                    {Number(score).toFixed(1)}
                    <Text style={helperStyle}>
                        {' '}
                        / 100
                    </Text>
                </Text>
            ) : (
                <Text style={{ color: '#98a2b3', fontSize: 12 }}>
                    {purple ? 'Chưa chốt' : 'Chưa chấm'}
                </Text>
            )}
        </Flex>
    );
};

const ReviewDetailDrawer: React.FC<Props> = ({
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

    const roleName = record?.employee?.role?.name;

    return (
        <Drawer
            title={
                <Flex align="center" gap={10}>
                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: '#eff6ff',
                            color: '#2563eb',
                        }}
                    >
                        <EyeOutlined />
                    </Flex>

                    <div>
                        <Text
                            style={{
                                display: 'block',
                                color: '#101828',
                                fontSize: 16,
                                fontWeight: 700,
                            }}
                        >
                            Chi tiết đánh giá
                        </Text>

                        <Text style={helperStyle}>
                            Thông tin tổng hợp của bản ghi đánh giá
                        </Text>
                    </div>
                </Flex>
            }
            placement="right"
            width={620}
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
                <Flex vertical gap={22}>
                    <Flex
                        align="center"
                        justify="space-between"
                        gap={16}
                        style={{
                            padding: 16,
                            borderRadius: 14,
                            background: '#f8fafc',
                            border: '1px solid #eaecf0',
                        }}
                    >
                        <Flex align="center" gap={12}>
                            <Avatar
                                size={52}
                                style={{
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #dbeafe',
                                    fontSize: 17,
                                    fontWeight: 700,
                                }}
                            >
                                {record.employee
                                    ? getInitials(record.employee.fullName)
                                    : '?'}
                            </Avatar>

                            <Flex vertical gap={2}>
                                <Text
                                    strong
                                    style={{
                                        color: '#101828',
                                        fontSize: 15,
                                    }}
                                >
                                    {record.employee?.fullName ?? '—'}
                                </Text>

                                <Text
                                    style={{
                                        color: '#667085',
                                        fontSize: 12,
                                    }}
                                >
                                    {record.employee?.email ?? ''}
                                </Text>

                                <Text style={helperStyle}>
                                    {roleName
                                        ? ROLE_LABELS[roleName] ?? roleName
                                        : record.employee?.title ?? '—'}
                                </Text>
                            </Flex>
                        </Flex>

                        {statusConfig ? (
                            <Tag
                                icon={statusConfig.icon}
                                color={statusConfig.color}
                                bordered={false}
                                style={{
                                    margin: 0,
                                    borderRadius: 999,
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            >
                                {statusConfig.label}
                            </Tag>
                        ) : (
                            <Tag>
                                {record.status as ReviewRecordStatus}
                            </Tag>
                        )}
                    </Flex>

                    <div>
                        <Text style={sectionTitleStyle}>
                            Thông tin kỳ đánh giá
                        </Text>

                        <Descriptions
                            bordered
                            column={1}
                            size="small"
                            labelStyle={{
                                width: 170,
                                color: '#475467',
                                fontWeight: 600,
                                background: '#f9fafb',
                            }}
                            contentStyle={{
                                color: '#344054',
                                background: '#ffffff',
                            }}
                        >
                            <Descriptions.Item label="Tên kỳ đánh giá">
                                {record.reviewCycle?.name ?? '—'}
                            </Descriptions.Item>

                            <Descriptions.Item label="Trạng thái chu kỳ">
                                {record.reviewCycle?.status ? (
                                    <Tag
                                        bordered={false}
                                        style={{
                                            margin: 0,
                                            color: '#475467',
                                            background: '#f2f4f7',
                                        }}
                                    >
                                        {CYCLE_STATUS_LABELS[
                                            record.reviewCycle.status
                                        ] ?? record.reviewCycle.status}
                                    </Tag>
                                ) : (
                                    '—'
                                )}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày bắt đầu">
                                {formatDate(
                                    record.reviewCycle?.startDate,
                                )}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày kết thúc">
                                {formatDate(
                                    record.reviewCycle?.endDate,
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    <div>
                        <Text style={sectionTitleStyle}>
                            Kết quả đánh giá
                        </Text>

                        <Flex gap={12}>
                            <ScoreBlock
                                label="Điểm sơ bộ của PM"
                                score={record.tempScore}
                                icon={
                                    <StarOutlined
                                        style={{ color: '#d97706' }}
                                    />
                                }
                            />

                            <ScoreBlock
                                label="Điểm chốt của HR"
                                score={record.finalScore}
                                variant="purple"
                                icon={
                                    <SafetyCertificateOutlined
                                        style={{ color: '#7c3aed' }}
                                    />
                                }
                            />
                        </Flex>
                    </div>

                    {record.reviewerNote && (
                        <div>
                            <Text style={sectionTitleStyle}>
                                Nhận xét của PM
                            </Text>

                            <div
                                style={{
                                    ...cardStyle,
                                    background: '#f9fafb',
                                    color: '#475467',
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                }}
                            >
                                {record.reviewerNote}
                            </div>
                        </div>
                    )}

                    <Flex
                        justify="space-between"
                        gap={16}
                        wrap="wrap"
                        style={{
                            paddingTop: 16,
                            borderTop: '1px solid #eaecf0',
                        }}
                    >
                        <Text style={helperStyle}>
                            Tạo lúc: {formatDate(record.createdAt, true)}
                        </Text>

                        <Text style={helperStyle}>
                            Cập nhật: {formatDate(record.updatedAt, true)}
                        </Text>
                    </Flex>
                </Flex>
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