import React from 'react';

import {
    Card,
    Col,
    Flex,
    Row,
    Skeleton,
    Typography,
} from 'antd';

import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    TeamOutlined,
} from '@ant-design/icons';

import type {
    ReviewRecordStats,
} from '../../../api/hrReviews';

const { Text } = Typography;

interface ReviewStatsSectionProps {
    stats: ReviewRecordStats;
    loading: boolean;
}

const ReviewStatsSection: React.FC<
    ReviewStatsSectionProps
> = ({
    stats,
    loading,
}) => {
    const items = [
        {
            key: 'total',
            label: 'Tổng bản ghi',
            value: stats.total,
            description:
                'Tổng số lượt đánh giá trong hệ thống',
            icon: <TeamOutlined />,
            accent: '#2563eb',
            iconColor: '#2563eb',
            iconBg: '#eff6ff',
        },
        {
            key: 'completed',
            label: 'Đã hoàn thành',
            value: stats.completed,
            description:
                stats.total > 0
                    ? `${Math.round(
                        (
                            stats.completed /
                            stats.total
                        ) *
                            100,
                    )}% tổng bản ghi`
                    : 'Chưa có dữ liệu đánh giá',
            icon: <CheckCircleOutlined />,
            accent: '#22c55e',
            iconColor: '#16a34a',
            iconBg: '#ecfdf3',
        },
        {
            key: 'pending',
            label: 'Chờ đánh giá',
            value: stats.pending,
            description:
                'Các bản ghi chưa bắt đầu xét duyệt',
            icon: <ClockCircleOutlined />,
            accent: '#f59e0b',
            iconColor: '#d97706',
            iconBg: '#fff7ed',
        },
        {
            key: 'in-review',
            label: 'Đang đánh giá',
            value: stats.inReview,
            description:
                'Các bản ghi đang trong quá trình đánh giá',
            icon: <ExclamationCircleOutlined />,
            accent: '#8b5cf6',
            iconColor: '#7c3aed',
            iconBg: '#f5f3ff',
        },
    ];

    return (
        <Row
            gutter={[16, 16]}
            style={{ marginBottom: 22 }}
        >
            {items.map((item) => (
                <Col
                    xs={24}
                    sm={12}
                    xl={6}
                    key={item.key}
                >
                    <Card
                        bordered={false}
                        style={{
                            position: 'relative',
                            height: '100%',
                            overflow: 'hidden',
                            borderRadius: 16,
                            border:
                                '1px solid #eaecf0',
                            background: '#ffffff',
                            boxShadow:
                                '0 1px 3px rgba(16,24,40,0.04)',
                        }}
                        styles={{
                            body: {
                                padding: 20,
                            },
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background:
                                    item.accent,
                            }}
                        />

                        <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={12}
                        >
                            <div>
                                <Text
                                    style={{
                                        display:
                                            'block',
                                        color:
                                            '#667085',
                                        fontSize:
                                            13,
                                        fontWeight:
                                            600,
                                    }}
                                >
                                    {item.label}
                                </Text>

                                {loading ? (
                                    <Skeleton.Input
                                        active
                                        size="small"
                                        style={{
                                            width: 70,
                                            marginTop:
                                                10,
                                        }}
                                    />
                                ) : (
                                    <Text
                                        style={{
                                            display:
                                                'block',
                                            marginTop:
                                                8,
                                            color:
                                                '#101828',
                                            fontSize:
                                                30,
                                            fontWeight:
                                                750,
                                            lineHeight:
                                                1,
                                            letterSpacing:
                                                '-0.03em',
                                        }}
                                    >
                                        {item.value}
                                    </Text>
                                )}
                            </div>

                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: 42,
                                    height: 42,
                                    flexShrink: 0,
                                    borderRadius:
                                        12,
                                    background:
                                        item.iconBg,
                                    color:
                                        item.iconColor,
                                    fontSize: 18,
                                }}
                            >
                                {item.icon}
                            </Flex>
                        </Flex>

                        <Text
                            style={{
                                display: 'block',
                                marginTop: 18,
                                color: '#98a2b3',
                                fontSize: 12,
                                lineHeight: 1.45,
                            }}
                        >
                            {item.description}
                        </Text>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default ReviewStatsSection;