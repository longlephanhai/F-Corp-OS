import React from 'react';
import {
    Avatar,
    Button,
    Empty,
    Flex,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type {
    TalentDirectoryItem,
    TalentWorkforceStatus,
} from '../../../api/hrTalents';

const { Text } = Typography;

interface TalentTableProps {
    data: TalentDirectoryItem[];
    loading: boolean;

    page: number;
    pageSize: number;
    total: number;

    onPageChange: (
        page: number,
        pageSize: number,
    ) => void;

    onViewProfile: (
        employeeId: string,
    ) => void;


}

const STATUS_META: Record<
    TalentWorkforceStatus,
    {
        label: string;
        color: string;
    }
> = {
    AVAILABLE: {
        label: 'Sẵn sàng',
        color: 'green',
    },

    IN_PROJECT: {
        label: 'Trong dự án',
        color: 'blue',
    },

    BENCH: {
        label: 'Bench',
        color: 'orange',
    },
};

const TalentTable: React.FC<
    TalentTableProps
> = ({
    data,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    onViewProfile,
}) => {
        const columns: ColumnsType<TalentDirectoryItem> =
            [
                {
                    title: 'Nhân sự',
                    key: 'employee',
                    width: 250,

                    render: (_, record) => (
                        <Flex
                            align="center"
                            gap={10}
                        >
                            <Avatar
                                size={38}
                                style={{
                                    flexShrink: 0,
                                }}
                            >
                                {record.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                            </Avatar>

                            <div
                                style={{
                                    minWidth: 0,
                                }}
                            >
                                <Text strong>
                                    {record.fullName}
                                </Text>

                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                        }}
                                        ellipsis
                                    >
                                        {record.email}
                                    </Text>
                                </div>

                                {record.title && (
                                    <div>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 12,
                                            }}
                                        >
                                            {record.title}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </Flex>
                    ),
                },

                {
                    title: 'Vai trò',
                    key: 'role',
                    width: 130,

                    render: (_, record) =>
                        record.role ? (
                            <Tag>
                                {record.role.name}
                            </Tag>
                        ) : (
                            <Text type="secondary">
                                —
                            </Text>
                        ),
                },

                {
                    title: 'Trạng thái',
                    key: 'status',
                    width: 130,

                    render: (_, record) => {
                        const meta =
                            STATUS_META[
                            record.status
                            ];

                        return (
                            <Tag color={meta.color}>
                                {meta.label}
                            </Tag>
                        );
                    },
                },

                {
                    title: 'Kỹ năng nổi bật',
                    key: 'topSkills',
                    width: 300,

                    render: (_, record) => {
                        if (
                            record.topSkills.length ===
                            0
                        ) {
                            return (
                                <Text type="secondary">
                                    Chưa có kỹ năng
                                </Text>
                            );
                        }

                        return (
                            <Flex
                                gap={6}
                                wrap="wrap"
                            >
                                {record.topSkills.map(
                                    (skill) => (
                                        <Tag
                                            key={
                                                skill.userSkillId
                                            }
                                            color={
                                                skill
                                                    .approvedEvidenceCount >
                                                    0
                                                    ? 'green'
                                                    : undefined
                                            }
                                        >
                                            {skill.name}{' '}
                                            · L{skill.level}
                                        </Tag>
                                    ),
                                )}
                            </Flex>
                        );
                    },
                },

                {
                    title: 'Năng lực',
                    key: 'skills',
                    width: 150,
                    align: 'center',

                    render: (_, record) => (
                        <div>
                            <Text strong>
                                {
                                    record
                                        .skillSummary
                                        .totalSkills
                                }
                            </Text>

                            <div>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 12,
                                    }}
                                >
                                    kỹ năng
                                </Text>
                            </div>
                        </div>
                    ),
                },

                {
                    title: 'Có bằng chứng',
                    key: 'verifiedSkills',
                    width: 150,
                    align: 'center',

                    render: (_, record) => {
                        const {
                            totalSkills,
                            skillsWithApprovedEvidence,
                        } = record.skillSummary;

                        return (
                            <div>
                                <Text
                                    strong
                                    style={{
                                        color:
                                            skillsWithApprovedEvidence >
                                                0
                                                ? '#237804'
                                                : undefined,
                                    }}
                                >
                                    {
                                        skillsWithApprovedEvidence
                                    }
                                    /
                                    {totalSkills}
                                </Text>

                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                        }}
                                    >
                                        skills
                                    </Text>
                                </div>
                            </div>
                        );
                    },
                },

                {
                    title: 'Minh chứng',
                    key: 'evidences',
                    width: 190,

                    render: (_, record) => (
                        <Flex
                            vertical
                            gap={4}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                }}
                            >
                                <span
                                    style={{
                                        color: '#237804',
                                    }}
                                >
                                    Approved:{' '}
                                    {
                                        record
                                            .skillSummary
                                            .approvedEvidences
                                    }
                                </span>
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                }}
                            >
                                <span
                                    style={{
                                        color: '#ad6800',
                                    }}
                                >
                                    Chờ duyệt:{' '}
                                    {
                                        record
                                            .skillSummary
                                            .pendingEvidences
                                    }
                                </span>
                            </Text>
                        </Flex>
                    ),
                },
                {
                    title: 'Thao tác',
                    key: 'action',
                    width: 130,
                    fixed: 'right',

                    render: (_, record) => (
                        <Button
                            type="link"
                            onClick={() =>
                                onViewProfile(
                                    record.id,
                                )
                            }
                        >
                            Xem hồ sơ
                        </Button>
                    ),
                },
            ];

        return (
            <Table<TalentDirectoryItem>
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={loading}
                scroll={{
                    x: 1200,
                }}
                locale={{
                    emptyText: (
                        <Empty
                            description="Không có dữ liệu nhân sự phù hợp"
                        />
                    ),
                }}
                pagination={{
                    current: page,
                    pageSize,
                    total,

                    showSizeChanger: false,

                    showTotal: (
                        value,
                    ) =>
                        `Tổng ${value} nhân sự`,

                    onChange:
                        onPageChange,
                }}
            />
        );
    };

export default TalentTable;