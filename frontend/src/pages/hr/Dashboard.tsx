import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Alert,
    Button,
    Flex,
    Skeleton,
    Typography,
    message,
} from 'antd';

import {
    ReloadOutlined,
} from '@ant-design/icons';

import {
    hrDashboardApi,
    type HrDashboardSummary,
} from '../../api/hrDashboard';

import HrDashboardOverview from '../../components/hr/dashboard/HrDashboardOverview';
import HrDashboardOperations from '../../components/hr/dashboard/HrDashboardOperations';
import HrDashboardInsights from '../../components/hr/dashboard/HrDashboardInsights';

const {
    Title,
    Text,
} = Typography;

const HRDashboard: React.FC = () => {
    const [data, setData] =
        useState<HrDashboardSummary | null>(
            null,
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    const fetchDashboard =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await hrDashboardApi
                        .getSummary();

                const payload =
                    (response as any)?.data;

                if (!payload) {
                    throw new Error(
                        'Không nhận được dữ liệu Dashboard.',
                    );
                }

                setData(payload);
            } catch (err: any) {
                const errorMessage =
                    err?.message ??
                    'Không thể tải dữ liệu Dashboard.';

                setError(
                    errorMessage,
                );

                message.error(
                    errorMessage,
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const pageStyle:
        React.CSSProperties = {
        minHeight: '100%',
        background:
            'linear-gradient(180deg, #f8fafc 0%, #ffffff 420px)',
        padding:
            '28px 28px 48px',
    };

    const containerStyle:
        React.CSSProperties = {
        width: '100%',
        maxWidth: 1480,
        margin: '0 auto',
    };

    if (
        loading &&
        !data
    ) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <Flex
                        vertical
                        gap={20}
                    >
                        <Skeleton
                            active
                            paragraph={{
                                rows: 1,
                            }}
                        />

                        <Skeleton
                            active
                            paragraph={{
                                rows: 4,
                            }}
                        />

                        <Skeleton
                            active
                            paragraph={{
                                rows: 6,
                            }}
                        />
                    </Flex>
                </div>
            </div>
        );
    }

    if (
        error &&
        !data
    ) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <Alert
                        type="error"
                        showIcon
                        message="Không thể tải Bảng điều khiển Nhân sự"
                        description={error}
                        action={
                            <Button
                                icon={
                                    <ReloadOutlined />
                                }
                                onClick={
                                    fetchDashboard
                                }
                            >
                                Thử lại
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                <Flex
                    vertical
                    gap={22}
                >
                    {/* Header */}
                    <Flex
                        justify="space-between"
                        align="flex-start"
                        gap={20}
                        wrap="wrap"
                    >
                        <div>
                            <Text
                                style={{
                                    display:
                                        'block',

                                    marginBottom:
                                        4,

                                    color:
                                        '#2563eb',

                                    fontSize:
                                        12,

                                    fontWeight:
                                        700,

                                    letterSpacing:
                                        '0.08em',

                                    textTransform:
                                        'uppercase',
                                }}
                            >
                                Tổng quan nhân sự
                            </Text>

                            <Title
                                level={2}
                                style={{
                                    margin:
                                        0,

                                    color:
                                        '#101828',

                                    fontSize:
                                        28,

                                    lineHeight:
                                        1.25,

                                    letterSpacing:
                                        '-0.025em',
                                }}
                            >
                                Bảng điều khiển Nhân sự
                            </Title>

                            <Text
                                style={{
                                    display:
                                        'block',

                                    marginTop:
                                        6,

                                    color:
                                        '#667085',

                                    fontSize:
                                        14,
                                }}
                            >
                                Theo dõi nguồn lực, đánh giá, năng lực và chất lượng dữ liệu.
                            </Text>
                        </div>

                        <Button
                            icon={
                                <ReloadOutlined />
                            }
                            loading={
                                loading
                            }
                            onClick={
                                fetchDashboard
                            }
                            style={{
                                height:
                                    40,

                                padding:
                                    '0 16px',

                                borderRadius:
                                    10,

                                borderColor:
                                    '#d0d5dd',

                                color:
                                    '#344054',

                                fontWeight:
                                    600,

                                background:
                                    '#ffffff',

                                boxShadow:
                                    '0 1px 2px rgba(16,24,40,0.04)',
                            }}
                        >
                            Làm mới dữ liệu
                        </Button>
                    </Flex>

                    <HrDashboardOverview
                        data={data}
                    />

                    <HrDashboardOperations
                        data={data}
                    />

                    <HrDashboardInsights
                        data={data}
                    />
                </Flex>
            </div>
        </div>
    );
};

export default HRDashboard;