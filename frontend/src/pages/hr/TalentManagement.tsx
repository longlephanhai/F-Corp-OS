import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Button,
    Card,
    Flex,
    Input,
    Select,
    Space,
    Typography,
    message,
} from 'antd';
import {
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';

import TalentTable from '../../components/hr/talents/TalentTable';
import TalentProfileDrawer from '../../components/hr/talents/TalentProfileDrawer';

import {
    hrTalentsApi,
    type TalentDirectoryItem,
    type TalentWorkforceStatus,
} from '../../api/hrTalents';

const {
    Title,
    Text,
} = Typography;

const PAGE_SIZE = 10;

const TalentManagement: React.FC =
    () => {
        const [
            talents,
            setTalents,
        ] = useState<
            TalentDirectoryItem[]
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
            selectedEmployeeId,
            setSelectedEmployeeId,
        ] = useState<string | null>(
            null,
        );

        const [
            profileOpen,
            setProfileOpen,
        ] = useState(false);

        const [
            searchInput,
            setSearchInput,
        ] = useState('');

        const [
            search,
            setSearch,
        ] = useState('');

        const [
            status,
            setStatus,
        ] =
            useState<
                TalentWorkforceStatus
            >();

        const loadTalents =
            useCallback(
                async () => {
                    setLoading(true);

                    try {
                        const response =
                            await hrTalentsApi.getAll(
                                {
                                    page,
                                    limit: PAGE_SIZE,

                                    search:
                                        search ||
                                        undefined,

                                    status,
                                },
                            );

                        const data =
                            response?.data;

                        setTalents(
                            data?.result ?? [],
                        );

                        setTotal(
                            data?.meta?.total ??
                            0,
                        );
                    } catch (error) {
                        console.error(
                            'Không tải được HR Talent Directory',
                            error,
                        );

                        setTalents([]);
                        setTotal(0);

                        message.error(
                            'Không thể tải danh sách nhân sự.',
                        );
                    } finally {
                        setLoading(false);
                    }
                },
                [
                    page,
                    search,
                    status,
                ],
            );

        useEffect(() => {
            void loadTalents();
        }, [loadTalents]);

        const handleSearch = () => {
            setPage(1);

            setSearch(
                searchInput.trim(),
            );
        };

        const handleStatusChange = (
            value:
                | TalentWorkforceStatus
                | undefined,
        ) => {
            setPage(1);
            setStatus(value);
        };

        const handleReset = () => {
            setSearchInput('');
            setSearch('');
            setStatus(undefined);
            setPage(1);
        };

        const handleViewProfile = (
            employeeId: string,
        ) => {
            setSelectedEmployeeId(
                employeeId,
            );

            setProfileOpen(true);
        };

        const handleCloseProfile =
            () => {
                setProfileOpen(false);
                setSelectedEmployeeId(
                    null,
                );
            };

        return (
            <div
                style={{
                    fontFamily:
                        'Inter, sans-serif',
                    color: '#1c1b1b',
                }}
            >
                {/* Header */}
                <Flex
                    justify="space-between"
                    align="flex-start"
                    wrap="wrap"
                    gap={16}
                    style={{
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <Title
                            level={3}
                            style={{
                                margin: 0,
                                letterSpacing:
                                    '-0.02em',
                            }}
                        >
                            Nhân sự & Năng lực
                        </Title>

                        <Text
                            type="secondary"
                            style={{
                                fontSize: 14,
                            }}
                        >
                            Theo dõi hồ sơ năng
                            lực, kỹ năng và bằng
                            chứng của nhân sự.
                        </Text>
                    </div>

                    <Button
                        icon={
                            <ReloadOutlined />
                        }
                        loading={loading}
                        onClick={() =>
                            void loadTalents()
                        }
                    >
                        Làm mới
                    </Button>
                </Flex>

                {/* Filter */}
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
                                value={
                                    searchInput
                                }
                                onChange={(event) =>
                                    setSearchInput(
                                        event.target
                                            .value,
                                    )
                                }
                                onPressEnter={
                                    handleSearch
                                }
                                placeholder="Tìm theo tên hoặc email..."
                                prefix={
                                    <SearchOutlined />
                                }
                                allowClear
                                style={{
                                    width: 280,
                                }}
                            />

                            <Button
                                type="primary"
                                icon={
                                    <SearchOutlined />
                                }
                                onClick={
                                    handleSearch
                                }
                            >
                                Tìm kiếm
                            </Button>

                            <Select<
                                TalentWorkforceStatus
                            >
                                allowClear
                                value={status}
                                placeholder="Trạng thái"
                                style={{
                                    width: 170,
                                }}
                                onChange={
                                    handleStatusChange
                                }
                                options={[
                                    {
                                        value:
                                            'AVAILABLE',
                                        label:
                                            'Sẵn sàng',
                                    },

                                    {
                                        value:
                                            'IN_PROJECT',
                                        label:
                                            'Trong dự án',
                                    },

                                    {
                                        value:
                                            'BENCH',
                                        label:
                                            'Bench',
                                    },
                                ]}
                            />

                            <Button
                                onClick={
                                    handleReset
                                }
                            >
                                Xóa bộ lọc
                            </Button>
                        </Space>

                        <Text type="secondary">
                            {total} nhân sự
                        </Text>
                    </Flex>
                </Card>

                {/* Talent table */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 12,
                        boxShadow:
                            '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    styles={{
                        body: {
                            padding: 0,
                        },
                    }}
                >
                    <TalentTable
                        data={talents}
                        loading={loading}
                        page={page}
                        pageSize={
                            PAGE_SIZE
                        }
                        total={total}
                        onPageChange={(
                            nextPage,
                        ) =>
                            setPage(
                                nextPage,
                            )
                        }
                        onViewProfile={
                            handleViewProfile
                        }
                    />
                </Card>

                <TalentProfileDrawer
                    open={profileOpen}
                    employeeId={
                        selectedEmployeeId
                    }
                    onClose={
                        handleCloseProfile
                    }
                />
            </div>
        );
    };

export default TalentManagement;