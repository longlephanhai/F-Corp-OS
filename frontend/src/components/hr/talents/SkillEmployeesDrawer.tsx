import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Avatar,
    Button,
    Drawer,
    Empty,
    Flex,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';

import {
    EyeOutlined,
    ReloadOutlined,
    TeamOutlined,
} from '@ant-design/icons';

import type {
    ColumnsType,
} from 'antd/es/table';

import {
    hrTalentsApi,
    type HrSkillEmployeeItem,
    type TalentWorkforceStatus,
} from '../../../api/hrTalents';

const {
    Text,
    Title,
} = Typography;

const PAGE_SIZE = 10;

interface SkillEmployeesDrawerProps {
    open: boolean;

    skillId: string | null;

    skillName?: string | null;

    onClose: () => void;

    onViewProfile: (
        employeeId: string,
    ) => void;
}

const getStatusTag = (
    status: TalentWorkforceStatus,
) => {
    switch (status) {
        case 'AVAILABLE':
            return (
                <Tag color="green">
                    Available
                </Tag>
            );

        case 'IN_PROJECT':
            return (
                <Tag color="blue">
                    In Project
                </Tag>
            );

        case 'BENCH':
            return (
                <Tag color="orange">
                    Bench
                </Tag>
            );

        default:
            return (
                <Tag>
                    {status}
                </Tag>
            );
    }
};

const SkillEmployeesDrawer: React.FC<
    SkillEmployeesDrawerProps
> = ({
    open,
    skillId,
    skillName,
    onClose,
    onViewProfile,
}) => {
        const [
            employees,
            setEmployees,
        ] = useState<
            HrSkillEmployeeItem[]
        >([]);

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            page,
            setPage,
        ] = useState(1);

        const [
            total,
            setTotal,
        ] = useState(0);

        const [
            status,
            setStatus,
        ] = useState<
            TalentWorkforceStatus | undefined
        >();

        const [
            resolvedSkillName,
            setResolvedSkillName,
        ] = useState<string | null>(
            skillName ?? null,
        );

        const loadEmployees =
            useCallback(async () => {
                if (!open || !skillId) {
                    return;
                }

                setLoading(true);

                try {
                    const response =
                        await hrTalentsApi.getSkillEmployees(
                            skillId,
                            {
                                page,
                                limit: PAGE_SIZE,
                                status,
                            },
                        );

                    const data =
                        response?.data;

                    setEmployees(
                        data?.result ?? [],
                    );

                    setTotal(
                        data?.meta?.total ?? 0,
                    );

                    setResolvedSkillName(
                        data?.skill?.name ??
                        skillName ??
                        null,
                    );
                } catch (error) {
                    console.error(
                        'Không tải được nhân sự theo kỹ năng',
                        error,
                    );

                    setEmployees([]);
                    setTotal(0);

                    message.error(
                        'Không thể tải danh sách nhân sự của kỹ năng.',
                    );
                } finally {
                    setLoading(false);
                }
            }, [
                open,
                skillId,
                page,
                status,
                skillName,
            ]);

        useEffect(() => {
            void loadEmployees();
        }, [loadEmployees]);

        useEffect(() => {
            if (!open) {
                setPage(1);
                setStatus(undefined);
                setEmployees([]);
                setTotal(0);
            }
        }, [open]);

        useEffect(() => {
            setResolvedSkillName(
                skillName ?? null,
            );
        }, [skillName]);

        const handleStatusChange = (
            value:
                | TalentWorkforceStatus
                | undefined,
        ) => {
            setPage(1);
            setStatus(value);
        };

        const columns: ColumnsType<HrSkillEmployeeItem> =
            [
                {
                    title: 'Nhân sự',
                    key: 'employee',
                    width: 260,

                    render: (_, record) => (
                        <Flex
                            align="center"
                            gap={10}
                        >
                            <Avatar
                                icon={
                                    <TeamOutlined />
                                }
                            />

                            <div>
                                <Text strong>
                                    {
                                        record.employee
                                            .fullName
                                    }
                                </Text>

                                <div>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                        }}
                                    >
                                        {
                                            record.employee
                                                .email
                                        }
                                    </Text>
                                </div>

                                {record.employee
                                    .title && (
                                        <div>
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 12,
                                                }}
                                            >
                                                {
                                                    record.employee
                                                        .title
                                                }
                                            </Text>
                                        </div>
                                    )}
                            </div>
                        </Flex>
                    ),
                },

                {
                    title: 'Level',
                    dataIndex: 'level',
                    key: 'level',
                    width: 90,
                    align: 'center',

                    render: (
                        value: number,
                    ) => (
                        <Tag color="blue">
                            L{value}
                        </Tag>
                    ),
                },

                {
                    title: 'Kinh nghiệm',
                    dataIndex: 'years',
                    key: 'years',
                    width: 110,
                    align: 'center',

                    render: (
                        value: number | null,
                    ) =>
                        value === null
                            ? '-'
                            : `${value} năm`,
                },

                {
                    title: 'Trạng thái',
                    key: 'status',
                    width: 120,

                    render: (_, record) =>
                        getStatusTag(
                            record.employee.status,
                        ),
                },

                {
                    title: 'Minh chứng',
                    key: 'evidence',
                    width: 190,

                    render: (_, record) => (
                        <Space
                            size={[4, 4]}
                            wrap
                        >
                            <Tag color="green">
                                Approved:{' '}
                                {
                                    record
                                        .evidenceSummary
                                        .approved
                                }
                            </Tag>

                            {record
                                .evidenceSummary
                                .pending > 0 && (
                                    <Tag color="gold">
                                        Chờ duyệt:{' '}
                                        {
                                            record
                                                .evidenceSummary
                                                .pending
                                        }
                                    </Tag>
                                )}

                            {record
                                .evidenceSummary
                                .rejected > 0 && (
                                    <Tag color="red">
                                        Rejected:{' '}
                                        {
                                            record
                                                .evidenceSummary
                                                .rejected
                                        }
                                    </Tag>
                                )}
                        </Space>
                    ),
                },

                {
                    title: '',
                    key: 'action',
                    width: 120,
                    fixed: 'right',

                    render: (_, record) => (
                        <Button
                            type="link"
                            icon={
                                <EyeOutlined />
                            }
                            onClick={() =>
                                onViewProfile(
                                    record.employee.id,
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
                width={1000}
                destroyOnHidden
                title={
                    <div>
                        <Title
                            level={5}
                            style={{
                                margin: 0,
                            }}
                        >
                            Nhân sự theo kỹ năng
                        </Title>

                        <Text type="secondary">
                            {resolvedSkillName ??
                                'Kỹ năng'}
                        </Text>
                    </div>
                }
            >
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={12}
                    style={{
                        marginBottom: 16,
                    }}
                >
                    <Space wrap>
                        <Select<
                            TalentWorkforceStatus
                        >
                            allowClear
                            value={status}
                            placeholder="Trạng thái nguồn lực"
                            style={{
                                width: 190,
                            }}
                            onChange={
                                handleStatusChange
                            }
                            options={[
                                {
                                    value: 'AVAILABLE',
                                    label: 'Available',
                                },
                                {
                                    value: 'IN_PROJECT',
                                    label: 'In Project',
                                },
                                {
                                    value: 'BENCH',
                                    label: 'Bench',
                                },
                            ]}
                        />

                        <Button
                            icon={
                                <ReloadOutlined />
                            }
                            loading={loading}
                            onClick={() =>
                                void loadEmployees()
                            }
                        >
                            Làm mới
                        </Button>
                    </Space>

                    <Text type="secondary">
                        {total} nhân sự
                    </Text>
                </Flex>

                <Table<HrSkillEmployeeItem>
                    rowKey="userSkillId"
                    columns={columns}
                    dataSource={employees}
                    loading={loading}
                    scroll={{
                        x: 1000,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                description="Không có nhân sự phù hợp"
                            />
                        ),
                    }}
                    pagination={{
                        current: page,
                        pageSize: PAGE_SIZE,
                        total,
                        showSizeChanger: false,

                        showTotal: (
                            value,
                        ) =>
                            `Tổng ${value} nhân sự`,

                        onChange: (
                            nextPage,
                        ) =>
                            setPage(
                                nextPage,
                            ),
                    }}
                />
            </Drawer>
        );
    };

export default SkillEmployeesDrawer;