import React from 'react';

import {
    Button,
    Card,
    Flex,
    Input,
    Select,
    Space,
    Typography,
} from 'antd';

import {
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';

const {
    Text,
} = Typography;

export interface BenchSkillOption {
    value: string;
    label: string;
}

interface BenchTalentFiltersProps {
    searchInput: string;

    role?: string;

    skillId?: string;

    minLevel?: number;

    verified?: boolean;

    skillOptions: BenchSkillOption[];

    skillsLoading: boolean;

    loading: boolean;

    onSearchInputChange: (
        value: string,
    ) => void;

    onSearch: () => void;

    onRoleChange: (
        value: string | undefined,
    ) => void;

    onSkillChange: (
        value: string | undefined,
    ) => void;

    onMinLevelChange: (
        value: number | undefined,
    ) => void;

    onVerifiedChange: (
        value: boolean | undefined,
    ) => void;

    onReset: () => void;

    onReload: () => void;
}

const BenchTalentFilters:
    React.FC<
        BenchTalentFiltersProps
    > = ({
        searchInput,
        role,
        skillId,
        minLevel,
        verified,
        skillOptions,
        skillsLoading,
        loading,
        onSearchInputChange,
        onSearch,
        onRoleChange,
        onSkillChange,
        onMinLevelChange,
        onVerifiedChange,
        onReset,
        onReload,
    }) => {
        return (
            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    marginBottom: 16,
                    boxShadow:
                        '0 2px 8px rgba(0,0,0,0.04)',
                }}
                styles={{
                    body: {
                        padding: 16,
                    },
                }}
            >
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={12}
                >
                    <Space
                        wrap
                        size={10}
                    >
                        <Input
                            value={searchInput}
                            onChange={(event) =>
                                onSearchInputChange(
                                    event.target.value,
                                )
                            }
                            onPressEnter={
                                onSearch
                            }
                            placeholder="Tìm theo tên hoặc email..."
                            prefix={
                                <SearchOutlined />
                            }
                            allowClear
                            style={{
                                width: 250,
                            }}
                        />

                        <Button
                            type="primary"
                            icon={
                                <SearchOutlined />
                            }
                            onClick={
                                onSearch
                            }
                        >
                            Tìm kiếm
                        </Button>

                        <Select
                            allowClear
                            value={role}
                            placeholder="Vai trò"
                            style={{
                                width: 170,
                            }}
                            onChange={
                                onRoleChange
                            }
                            options={[
                                {
                                    value:
                                        'DEVELOPER',
                                    label:
                                        'Lập trình viên',
                                },
                                {
                                    value:
                                        'PM',
                                    label:
                                        'Quản lý dự án',
                                },
                                {
                                    value:
                                        'HR',
                                    label:
                                        'Nhân sự',
                                },
                                {
                                    value:
                                        'ADMIN',
                                    label:
                                        'Quản trị viên',
                                },
                            ]}
                        />

                        <Select
                            showSearch
                            allowClear
                            value={skillId}
                            loading={
                                skillsLoading
                            }
                            placeholder="Kỹ năng"
                            optionFilterProp="label"
                            style={{
                                width: 200,
                            }}
                            options={
                                skillOptions
                            }
                            onChange={
                                onSkillChange
                            }
                            notFoundContent={
                                skillsLoading
                                    ? 'Đang tải...'
                                    : 'Không có kỹ năng'
                            }
                        />

                        <Select<number>
                            allowClear
                            value={minLevel}
                            placeholder="Cấp độ tối thiểu"
                            style={{
                                width: 155,
                            }}
                            onChange={
                                onMinLevelChange
                            }
                            options={[
                                {
                                    value: 1,
                                    label: 'Level 1+',
                                },
                                {
                                    value: 2,
                                    label: 'Level 2+',
                                },
                                {
                                    value: 3,
                                    label: 'Level 3+',
                                },
                                {
                                    value: 4,
                                    label: 'Level 4+',
                                },
                                {
                                    value: 5,
                                    label: 'Level 5',
                                },
                            ]}
                        />

                        <Select<string>
                            allowClear
                            value={
                                verified === true
                                    ? 'verified'
                                    : undefined
                            }
                            placeholder="Minh chứng"
                            style={{
                                width: 180,
                            }}
                            onChange={(value) =>
                                onVerifiedChange(
                                    value === 'verified'
                                        ? true
                                        : undefined,
                                )
                            }
                            options={[
                                {
                                    value: 'verified',
                                    label:
                                        'Đã xác minh',
                                },
                            ]}
                        />

                        <Button
                            onClick={
                                onReset
                            }
                        >
                            Xóa bộ lọc
                        </Button>
                    </Space>

                    <Space>
                        <Text type="secondary">
                            Nguồn nhân sự Bench
                        </Text>

                        <Button
                            icon={
                                <ReloadOutlined />
                            }
                            loading={
                                loading
                            }
                            onClick={
                                onReload
                            }
                        >
                            Làm mới
                        </Button>
                    </Space>
                </Flex>
            </Card>
        );
    };

export default BenchTalentFilters;