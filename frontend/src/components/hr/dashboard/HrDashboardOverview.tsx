import React from 'react';

import {
    Card,
    Col,
    Flex,
    Progress,
    Row,
    Typography,
} from 'antd';

import {
    CheckCircleOutlined,
    TeamOutlined,
    UsergroupAddOutlined,
    WarningOutlined,
} from '@ant-design/icons';

import type {
    HrDashboardSummary,
} from '../../../api/hrDashboard';

const {
    Text,
} = Typography;

interface Props {
    data: HrDashboardSummary;
}

interface DashboardMetric {
    key: string;

    label: string;

    value:
    string |
    number;

    suffix?: string;

    description: string;

    progress?: number;

    icon:
    React.ReactNode;

    iconBackground:
    string;

    iconColor:
    string;

    accent:
    string;
}

const HrDashboardOverview:
    React.FC<Props> = ({
        data,
    }) => {
        const metrics:
            DashboardMetric[] = [
                {
                    key:
                        'employees',

                    label:
                        'Tổng nhân sự',

                    value:
                        data.workforce
                            .totalEmployees,

                    suffix:
                        'người',

                    description:
                        `${data.workforce.available} sẵn sàng · ${data.workforce.inProject} đang tham gia dự án`,

                    icon:
                        <TeamOutlined />,

                    iconBackground:
                        '#eff6ff',

                    iconColor:
                        '#2563eb',

                    accent:
                        '#2563eb',
                },

                {
                    key:
                        'bench',

                    label:
                        'Tỷ lệ nhân sự Bench',

                    value:
                        data.workforce
                            .benchRate,

                    suffix:
                        '%',

                    description:
                        `${data.workforce.bench} nhân sự đang ở trạng thái Bench`,

                    progress:
                        data.workforce
                            .benchRate,

                    icon:
                        <UsergroupAddOutlined />,

                    iconBackground:
                        '#fff7ed',

                    iconColor:
                        '#ea580c',

                    accent:
                        '#f97316',
                },

                {
                    key:
                        'reviews',

                    label:
                        'Hoàn thành đánh giá',

                    value:
                        data.reviews
                            .completionRate,

                    suffix:
                        '%',

                    description:
                        `${data.reviews.completed}/${data.reviews.total} bản ghi đã hoàn thành`,

                    progress:
                        data.reviews
                            .completionRate,

                    icon:
                        <CheckCircleOutlined />,

                    iconBackground:
                        '#ecfdf3',

                    iconColor:
                        '#16a34a',

                    accent:
                        '#22c55e',
                },

                {
                    key:
                        'skill-supply',

                    label:
                        'Kỹ năng chưa có nguồn cung',

                    value:
                        data.skillSupply
                            .zeroSupplySkills,

                    suffix:
                        'kỹ năng',

                    description:
                        `${data.skillSupply.skillsWithSupply}/${data.skillSupply.totalSkills} kỹ năng đang có nguồn lực`,

                    icon:
                        <WarningOutlined />,

                    iconBackground:
                        '#fef2f2',

                    iconColor:
                        '#dc2626',

                    accent:
                        '#ef4444',
                },
            ];

        return (
            <Row
                gutter={[
                    16,
                    16,
                ]}
            >
                {metrics.map(
                    (
                        metric,
                    ) => (
                        <Col
                            xs={24}
                            sm={12}
                            xl={6}
                            key={
                                metric.key
                            }
                        >
                            <Card
                                bordered={false}
                                style={{
                                    position:
                                        'relative',

                                    height:
                                        '100%',

                                    overflow:
                                        'hidden',

                                    border:
                                        '1px solid #eaecf0',

                                    borderRadius:
                                        16,

                                    background:
                                        '#ffffff',

                                    boxShadow:
                                        '0 1px 3px rgba(16,24,40,0.04), 0 1px 2px rgba(16,24,40,0.02)',
                                }}
                                styles={{
                                    body: {
                                        padding:
                                            20,
                                    },
                                }}
                            >
                                <div
                                    style={{
                                        position:
                                            'absolute',

                                        top:
                                            0,

                                        left:
                                            0,

                                        width:
                                            '100%',

                                        height:
                                            3,

                                        background:
                                            metric.accent,
                                    }}
                                />

                                <Flex
                                    justify="space-between"
                                    align="flex-start"
                                    gap={12}
                                >
                                    <Flex
                                        vertical
                                        gap={8}
                                        style={{
                                            minWidth:
                                                0,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color:
                                                    '#667085',

                                                fontSize:
                                                    13,

                                                fontWeight:
                                                    600,
                                            }}
                                        >
                                            {metric.label}
                                        </Text>

                                        <Flex
                                            align="baseline"
                                            gap={6}
                                            wrap="wrap"
                                        >
                                            <Text
                                                style={{
                                                    color:
                                                        '#101828',

                                                    fontSize:
                                                        30,

                                                    fontWeight:
                                                        750,

                                                    lineHeight:
                                                        1.1,

                                                    letterSpacing:
                                                        '-0.03em',
                                                }}
                                            >
                                                {typeof metric.value ===
                                                    'number'
                                                    ? metric.value
                                                    : metric.value}
                                            </Text>

                                            {metric.suffix && (
                                                <Text
                                                    style={{
                                                        color:
                                                            '#667085',

                                                        fontSize:
                                                            13,

                                                        fontWeight:
                                                            500,
                                                    }}
                                                >
                                                    {metric.suffix}
                                                </Text>
                                            )}
                                        </Flex>
                                    </Flex>

                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            width:
                                                42,

                                            height:
                                                42,

                                            flexShrink:
                                                0,

                                            borderRadius:
                                                12,

                                            background:
                                                metric.iconBackground,

                                            color:
                                                metric.iconColor,

                                            fontSize:
                                                19,
                                        }}
                                    >
                                        {metric.icon}
                                    </Flex>
                                </Flex>

                                {metric.progress !==
                                    undefined && (
                                        <Progress
                                            percent={
                                                metric.progress
                                            }
                                            showInfo={
                                                false
                                            }
                                            strokeColor={
                                                metric.accent
                                            }
                                            trailColor="#f2f4f7"
                                            size="small"
                                            style={{
                                                margin:
                                                    '18px 0 5px',
                                            }}
                                        />
                                    )}

                                {metric.progress ===
                                    undefined && (
                                        <div
                                            style={{
                                                height:
                                                    20,
                                            }}
                                        />
                                    )}

                                <Text
                                    style={{
                                        color:
                                            '#98a2b3',

                                        fontSize:
                                            12,

                                        lineHeight:
                                            1.45,
                                    }}
                                >
                                    {metric.description}
                                </Text>
                            </Card>
                        </Col>
                    ),
                )}
            </Row>
        );
    };

export default HrDashboardOverview;