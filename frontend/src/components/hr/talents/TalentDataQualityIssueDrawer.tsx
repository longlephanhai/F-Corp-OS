import React from 'react';
import {
    Button,
    Descriptions,
    Drawer,
    Empty,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import type {
    ColumnsType,
} from 'antd/es/table';

import type {
    HrTalentDataQualityItem,
} from '../../../api/hrTalents';

const {
    Text,
} = Typography;

export type TalentDataQualityIssueType =
    | 'WITHOUT_SKILLS'
    | 'WITHOUT_APPROVED_EVIDENCE'
    | 'PENDING_EVIDENCE'
    | 'STALE_PROFILE';

interface TalentDataQualityIssueDrawerProps {
    open: boolean;

    issueType:
    | TalentDataQualityIssueType
    | null;

    data: HrTalentDataQualityItem[];

    staleDays: number;

    onClose: () => void;

    onViewProfile: (
        employeeId: string,
    ) => void;
}

interface IssueConfig {
    title: string;
    description: string;
}

const ISSUE_CONFIG: Record<
    TalentDataQualityIssueType,
    IssueConfig
> = {
    WITHOUT_SKILLS: {
        title:
            'Nhân sự chưa có kỹ năng',
        description:
            'Các hồ sơ chưa có dữ liệu kỹ năng hợp lệ trong hồ sơ năng lực.',
    },

    WITHOUT_APPROVED_EVIDENCE: {
        title:
            'Chưa có minh chứng được duyệt',
        description:
            'Các nhân sự chưa có ít nhất một minh chứng năng lực đã được duyệt.',
    },

    PENDING_EVIDENCE: {
        title:
            'Minh chứng đang chờ duyệt',
        description:
            'Các nhân sự hiện có minh chứng đang chờ duyệt.',
    },

    STALE_PROFILE: {
        title:
            'Hồ sơ lâu chưa cập nhật',
        description:
            'Các hồ sơ năng lực đã lâu chưa được cập nhật theo ngưỡng đang cấu hình.',
    },
};

const formatDateTime = (
    value: string | null,
) => {
    if (!value) {
        return 'Chưa có dữ liệu';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return 'Không xác định';
    }

    return date.toLocaleString(
        'vi-VN',
    );
};

const TalentDataQualityIssueDrawer:
    React.FC<
        TalentDataQualityIssueDrawerProps
    > = ({
        open,
        issueType,
        data,
        staleDays,
        onClose,
        onViewProfile,
    }) => {
        const config =
            issueType
                ? ISSUE_CONFIG[
                issueType
                ]
                : null;

        const columns:
            ColumnsType<HrTalentDataQualityItem> =
            [
                {
                    title:
                        'Nhân sự',

                    key:
                        'employee',

                    width: 250,

                    render: (
                        _,
                        record,
                    ) => (
                        <Space
                            direction="vertical"
                            size={0}
                        >
                            <Text strong>
                                {
                                    record
                                        .employee
                                        .fullName
                                }
                            </Text>

                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 12,
                                }}
                            >
                                {
                                    record
                                        .employee
                                        .email
                                }
                            </Text>
                        </Space>
                    ),
                },

                {
                    title:
                        'Vai trò',

                    key:
                        'role',

                    width: 130,

                    render: (
                        _,
                        record,
                    ) =>
                        record.employee.role
                            ?.name ?? '-',
                },

                {
                    title:
                        'Trạng thái',

                    key:
                        'status',

                    width: 130,

                    render: (
                        _,
                        record,
                    ) => (
                        <Tag>
                            {
                                record
                                    .employee
                                    .status
                            }
                        </Tag>
                    ),
                },

                {
                    title:
                        'Kỹ năng',

                    key:
                        'skills',

                    align:
                        'center',

                    width: 90,

                    render: (
                        _,
                        record,
                    ) =>
                        record
                            .quality
                            .totalSkills,
                },

                {
                    title:
                        'Minh chứng',

                    key:
                        'evidences',

                    width: 190,

                    render: (
                        _,
                        record,
                    ) => (
                        <Space
                            wrap
                            size={4}
                        >
                            <Tag>
                                Tổng{' '}
                                {
                                    record
                                        .quality
                                        .totalEvidences
                                }
                            </Tag>

                            <Tag color="success">
                                Duyệt{' '}
                                {
                                    record
                                        .quality
                                        .approvedEvidences
                                }
                            </Tag>

                            <Tag color="processing">
                                Chờ{' '}
                                {
                                    record
                                        .quality
                                        .pendingEvidences
                                }
                            </Tag>
                        </Space>
                    ),
                },

                {
                    title:
                        'Cập nhật Talent gần nhất',

                    key:
                        'lastTalentUpdate',

                    width: 190,

                    render: (
                        _,
                        record,
                    ) => (
                        <Text
                            type={
                                record
                                    .quality
                                    .isStale
                                    ? 'danger'
                                    : undefined
                            }
                        >
                            {formatDateTime(
                                record
                                    .quality
                                    .lastTalentDataUpdatedAt,
                            )}
                        </Text>
                    ),
                },

                {
                    title:
                        'Thao tác',

                    key:
                        'action',

                    fixed:
                        'right',

                    width: 120,

                    render: (
                        _,
                        record,
                    ) => (
                        <Button
                            type="link"
                            onClick={() =>
                                onViewProfile(
                                    record
                                        .employee
                                        .id,
                                )
                            }
                        >
                            Xem hồ sơ
                        </Button>
                    ),
                },
            ];

        return (
            <Drawer
                open={open}
                onClose={onClose}
                width={980}
                title={
                    config?.title ??
                    'Chi tiết chất lượng dữ liệu'
                }
                destroyOnClose
            >
                {config ? (
                    <>
                        <Descriptions
                            column={1}
                            size="small"
                            style={{
                                marginBottom: 20,
                            }}
                        >
                            <Descriptions.Item
                                label="Mô tả"
                            >
                                {
                                    config.description
                                }
                            </Descriptions.Item>

                            {issueType ===
                                'STALE_PROFILE' && (
                                    <Descriptions.Item
                                        label="Ngưỡng hồ sơ cũ"
                                    >
                                        {staleDays} ngày
                                    </Descriptions.Item>
                                )}

                            <Descriptions.Item
                                label="Số nhân sự"
                            >
                                {data.length}
                            </Descriptions.Item>
                        </Descriptions>

                        {data.length ===
                            0 ? (
                            <Empty
                                description="Không có nhân sự thuộc nhóm này."
                            />
                        ) : (
                            <Table
                                rowKey={(
                                    record,
                                ) =>
                                    record
                                        .employee
                                        .id
                                }
                                columns={
                                    columns
                                }
                                dataSource={
                                    data
                                }
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger:
                                        false,
                                }}
                                scroll={{
                                    x: 1050,
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Empty
                        description="Chưa chọn nhóm dữ liệu."
                    />
                )}
            </Drawer>
        );
    };

export default TalentDataQualityIssueDrawer;