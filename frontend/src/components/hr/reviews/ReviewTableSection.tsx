import React from 'react';
import {
    Avatar,
    Button,
    Dropdown,
    Flex,
    Grid,
    Progress,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography,
    type MenuProps,
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FilterOutlined,
    MoreOutlined,
    StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import ActionTable from '../../ui/ActionTable';
import type {
    ReviewRecordItem,
    ReviewRecordStatus,
} from '../../../api/hrReviews';

const { Text } = Typography;

interface ReviewTableSectionProps {
    records: ReviewRecordItem[];
    approvingId: string | null;
    onOpenDetail: (record: ReviewRecordItem) => void;
    onMoveToReview: (record: ReviewRecordItem) => void;
    onOpenScore: (record: ReviewRecordItem) => void;
    onComplete: (record: ReviewRecordItem) => void;
    onStatusChange: (status: ReviewRecordStatus | undefined) => void;
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

const STATUS_FILTER_OPTIONS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'IN_REVIEW', label: 'Đang xét duyệt' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
];

const ROLE_LABELS: Record<string, string> = {
    DEVELOPER: 'Lập trình viên',
    PM: 'Quản lý dự án',
    HR: 'Nhân sự',
    ADMIN: 'Quản trị viên',
};

const getRoleLabel = (role?: string) =>
    role ? ROLE_LABELS[role] ?? role : '—';

const getCycleStatusLabel = (status?: string) => {
    if (!status) return '—';

    const labels: Record<string, string> = {
        DRAFT: 'Bản nháp',
        ACTIVE: 'Đang diễn ra',
        COMPLETED: 'Hoàn thành',
    };

    return labels[status] ?? status;
};

const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const ScoreCell = ({ value }: { value: number | null }) => {
    if (value === null || value === undefined) {
        return (
            <Tag
                bordered={false}
                style={{
                    margin: 0,
                    borderRadius: 999,
                    padding: '3px 10px',
                    color: '#667085',
                    background: '#f2f4f7',
                    fontSize: 11,
                    fontWeight: 500,
                }}
            >
                Chưa chấm
            </Tag>
        );
    }

    const numericValue = Number(value);

    const color =
        numericValue >= 85
            ? '#16a34a'
            : numericValue >= 70
                ? '#d97706'
                : '#dc2626';

    return (
        <Flex vertical gap={4} style={{ minWidth: 100 }}>
            <Flex align="baseline" gap={3}>
                <Text
                    strong
                    style={{
                        color,
                        fontSize: 14,
                    }}
                >
                    {numericValue.toFixed(1)}
                </Text>

                <Text
                    type="secondary"
                    style={{ fontSize: 10 }}
                >
                    / 100
                </Text>
            </Flex>

            <Progress
                percent={numericValue}
                size="small"
                showInfo={false}
                strokeColor={color}
                trailColor="#f2f4f7"
                style={{ margin: 0 }}
            />
        </Flex>
    );
};

const ReviewTableSection: React.FC<ReviewTableSectionProps> = ({
    records,
    approvingId,
    onOpenDetail,
    onMoveToReview,
    onOpenScore,
    onComplete,
    onStatusChange,
}) => {
    const screens = Grid.useBreakpoint();

    const isDesktop = Boolean(screens.lg);
    const isTablet = Boolean(screens.md);

    const columns: ColumnsType<ReviewRecordItem> = [
        {
            title: 'Nhân viên',
            key: 'employee',
            fixed: isDesktop ? 'left' : undefined,
            width: isDesktop ? 230 : 190,
            render: (_, record) => {
                const employee = record.employee;

                if (!employee) {
                    return <Text type="secondary">—</Text>;
                }

                return (
                    <Flex align="center" gap={10}>
                        <Avatar
                            style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #dbeafe',
                                flexShrink: 0,
                                fontWeight: 700,
                            }}
                        >
                            {getInitials(employee.fullName)}
                        </Avatar>

                        <Flex vertical gap={0}>
                            <Text strong style={{ fontSize: 13 }}>
                                {employee.fullName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {employee.email}
                            </Text>
                        </Flex>
                    </Flex>
                );
            },
        },
        {
            title: 'Vị trí / Phòng ban',
            key: 'title',
            width: 180,
            responsive: ['md'],
            render: (_, record) => (
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 13 }}>
                        {record.employee?.title ?? '—'}
                    </Text>
                    <Tag
                        bordered={false}
                        style={{
                            width: 'fit-content',
                            margin: 0,
                            padding: '2px 8px',
                            borderRadius: 6,
                            color: '#475467',
                            background: '#f2f4f7',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                    >
                        {getRoleLabel(record.employee?.role?.name)}
                    </Tag>
                </Flex>
            ),
        },
        {
            title: 'Điểm chốt cuối cùng',
            dataIndex: 'finalScore',
            key: 'finalScore',
            width: 170,
            align: 'center',
            responsive: ['md'],
            render: (_, record) => (
                <Flex vertical gap={5}>
                    <Text
                        strong
                        style={{
                            color: '#344054',
                            fontSize: 13,
                        }}
                    >
                        {record.reviewCycle?.name ?? '—'}
                    </Text>

                    {record.reviewCycle?.status && (
                        <Tag
                            bordered={false}
                            style={{
                                width: 'fit-content',
                                margin: 0,
                                padding: '2px 8px',
                                borderRadius: 6,
                                color: '#667085',
                                background: '#f2f4f7',
                                fontSize: 10,
                                fontWeight: 500,
                            }}
                        >
                            {getCycleStatusLabel(
                                record.reviewCycle.status,
                            )}
                        </Tag>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Điểm chốt cuối cùng',
            dataIndex: 'finalScore',
            key: 'finalScore',
            width: 170,
            align: 'center',
            render: (value: number | null) => <ScoreCell value={value} />,
            sorter: (a, b) => (a.finalScore ?? -1) - (b.finalScore ?? -1),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 145,
            render: (status: ReviewRecordStatus) => {
                const config =
                    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

                if (!config) {
                    return <Tag>{status}</Tag>;
                }

                return (
                    <Tag
                        icon={config.icon}
                        color={config.color}
                        bordered={false}
                        style={{
                            margin: 0,
                            borderRadius: 999,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: isDesktop ? 120 : 90,
            align: 'center',
            fixed: isDesktop ? 'right' : undefined,
            render: (_, record) => {
                const menuItems: MenuProps['items'] = [];

                if (record.status === 'PENDING') {
                    menuItems.push({
                        key: 'move-to-review',
                        icon: (
                            <ExclamationCircleOutlined
                                style={{ color: '#0057c2' }}
                            />
                        ),
                        label: 'Xét duyệt',
                        onClick: () => onMoveToReview(record),
                    });
                }

                if (record.status === 'IN_REVIEW') {
                    menuItems.push(
                        {
                            key: 'score',
                            icon: (
                                <StarOutlined
                                    style={{ color: '#722ed1' }}
                                />
                            ),
                            label: 'Chấm điểm',
                            onClick: () => onOpenScore(record),
                        },
                        { type: 'divider' },
                        {
                            key: 'complete',
                            icon: (
                                <CheckCircleOutlined
                                    style={{ color: '#52c41a' }}
                                />
                            ),
                            label: 'Hoàn tất',
                            onClick: () => onComplete(record),
                        },
                    );
                }

                return (
                    <Space size={4}>
                        <Tooltip title="Xem chi tiết">
                            <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                style={{ padding: '0 4px' }}
                                onClick={() => onOpenDetail(record)}
                            />
                        </Tooltip>

                        {record.status !== 'COMPLETED' &&
                            menuItems.length > 0 && (
                                <Dropdown
                                    menu={{ items: menuItems }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                >
                                    <Tooltip title="Thao tác">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={
                                                <MoreOutlined
                                                    style={{ fontSize: 16 }}
                                                />
                                            }
                                            loading={approvingId === record.id}
                                            style={{ padding: '0 4px' }}
                                        />
                                    </Tooltip>
                                </Dropdown>
                            )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Flex
                justify="space-between"
                align="center"
                gap={12}
                wrap="wrap"
                style={{
                    marginBottom: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#ffffff',
                    border: '1px solid #eaecf0',
                }}
            >
                <div>
                    <Text
                        style={{
                            display: 'block',
                            color: '#344054',
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Danh sách đánh giá
                    </Text>

                    <Text style={{ color: '#98a2b3', fontSize: 11 }}>
                        Lọc dữ liệu theo trạng thái xử lý
                    </Text>
                </div>

                <Select
                    allowClear
                    placeholder="Tất cả trạng thái"
                    suffixIcon={<FilterOutlined />}
                    style={{ width: 210 }}
                    options={STATUS_FILTER_OPTIONS}
                    onChange={(value) =>
                        onStatusChange(
                            value as ReviewRecordStatus | undefined,
                        )
                    }
                />
            </Flex>

            <ActionTable<ReviewRecordItem>
                columns={columns}
                dataSource={records}
                rowKey="id"
                scrollX={isDesktop ? 980 : isTablet ? 760 : 520}
                searchPlaceholder="Tìm kiếm nhân viên..."
                onSearch={(record, query) => {
                    const term = query.toLowerCase();

                    return Boolean(
                        record.employee?.fullName
                            ?.toLowerCase()
                            .includes(term) ||
                        record.employee?.email
                            ?.toLowerCase()
                            .includes(term),
                    );
                }}
            />
        </>
    );
};

export default ReviewTableSection;