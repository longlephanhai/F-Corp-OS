import React from 'react';

import {
    Card,
    Col,
    Flex,
    Progress,
    Row,
    Tag,
    Typography,
} from 'antd';

import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    FileSearchOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
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

interface StatusRowProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    iconColor: string;
    iconBackground: string;
}

const StatusRow: React.FC<StatusRowProps> = ({
    label,
    value,
    icon,
    iconColor,
    iconBackground,
}) => (
    <Flex
        justify="space-between"
        align="center"
        gap={12}
        style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: '#f9fafb',
            border: '1px solid #f2f4f7',
        }}
    >
        <Flex
            align="center"
            gap={10}
            style={{
                minWidth: 0,
            }}
        >
            <Flex
                align="center"
                justify="center"
                style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 9,
                    color: iconColor,
                    background: iconBackground,
                    fontSize: 15,
                }}
            >
                {icon}
            </Flex>

            <Text
                style={{
                    color: '#475467',
                    fontSize: 13,
                    fontWeight: 500,
                }}
            >
                {label}
            </Text>
        </Flex>

        <Text
            strong
            style={{
                color: '#101828',
                fontSize: 15,
            }}
        >
            {value}
        </Text>
    </Flex>
);

const SectionTitle = ({
    title,
    description,
}: {
    title: string;
    description: string;
}) => (
    <div>
        <Text
            style={{
                display: 'block',
                color: '#101828',
                fontSize: 16,
                fontWeight: 700,
            }}
        >
            {title}
        </Text>

        <Text
            style={{
                display: 'block',
                marginTop: 3,
                color: '#98a2b3',
                fontSize: 12,
            }}
        >
            {description}
        </Text>
    </div>
);

const HrDashboardOperations: React.FC<Props> = ({
    data,
}) => {
    const {
        reviews,
        benchReadiness,
        dataQuality,
    } = data;

    return (
        <Row
            gutter={[16, 16]}
            align="stretch"
        >
            {/* Review */}
            <Col
                xs={24}
                xl={9}
            >
                <Card
                    bordered={false}
                    style={{
                        height: '100%',
                        borderRadius: 16,
                        border: '1px solid #eaecf0',
                        boxShadow:
                            '0 1px 3px rgba(16,24,40,0.04)',
                    }}
                    styles={{
                        body: {
                            padding: 20,
                        },
                    }}
                >
                    <Flex
                        vertical
                        gap={20}
                    >
                        <SectionTitle
                            title="Tình trạng đánh giá"
                            description="Theo dõi tiến độ đánh giá nhân sự hiện tại"
                        />

                        <Flex
                            align="center"
                            gap={20}
                            wrap="wrap"
                        >
                            <Progress
                                type="circle"
                                percent={
                                    reviews.completionRate
                                }
                                size={112}
                                strokeWidth={9}
                                strokeColor="#2563eb"
                                trailColor="#eef2f6"
                                format={(percent) => (
                                    <div>
                                        <Text
                                            style={{
                                                display: 'block',
                                                color: '#101828',
                                                fontSize: 21,
                                                fontWeight: 750,
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            {percent}%
                                        </Text>

                                        <Text
                                            style={{
                                                color: '#98a2b3',
                                                fontSize: 10,
                                            }}
                                        >
                                            hoàn thành
                                        </Text>
                                    </div>
                                )}
                            />

                            <Flex
                                vertical
                                gap={8}
                                style={{
                                    flex: 1,
                                    minWidth: 180,
                                }}
                            >
                                <StatusRow
                                    label="Chờ đánh giá"
                                    value={
                                        reviews.pending
                                    }
                                    icon={
                                        <ClockCircleOutlined />
                                    }
                                    iconColor="#d97706"
                                    iconBackground="#fff7ed"
                                />

                                <StatusRow
                                    label="Đang đánh giá"
                                    value={
                                        reviews.inReview
                                    }
                                    icon={
                                        <FileSearchOutlined />
                                    }
                                    iconColor="#2563eb"
                                    iconBackground="#eff6ff"
                                />

                                <StatusRow
                                    label="Đã hoàn thành"
                                    value={
                                        reviews.completed
                                    }
                                    icon={
                                        <CheckCircleOutlined />
                                    }
                                    iconColor="#16a34a"
                                    iconBackground="#ecfdf3"
                                />
                            </Flex>
                        </Flex>

                        <Flex
                            justify="space-between"
                            align="center"
                            style={{
                                paddingTop: 14,
                                borderTop:
                                    '1px solid #f2f4f7',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#667085',
                                    fontSize: 12,
                                }}
                            >
                                Tổng bản ghi đánh giá
                            </Text>

                            <Tag
                                bordered={false}
                                style={{
                                    margin: 0,
                                    borderRadius: 999,
                                    padding: '3px 10px',
                                    color: '#344054',
                                    background: '#f2f4f7',
                                    fontWeight: 600,
                                }}
                            >
                                {reviews.total}
                            </Tag>
                        </Flex>
                    </Flex>
                </Card>
            </Col>

            {/* Bench readiness */}
            <Col
                xs={24}
                md={12}
                xl={7}
            >
                <Card
                    bordered={false}
                    style={{
                        height: '100%',
                        borderRadius: 16,
                        border: '1px solid #eaecf0',
                        boxShadow:
                            '0 1px 3px rgba(16,24,40,0.04)',
                    }}
                    styles={{
                        body: {
                            padding: 20,
                        },
                    }}
                >
                    <Flex
                        vertical
                        gap={18}
                    >
                        <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={12}
                        >
                            <SectionTitle
                                title="Mức độ sẵn sàng Bench"
                                description="Khả năng huy động nguồn lực đang Bench"
                            />

                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    minWidth: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    color: '#7c3aed',
                                    background: '#f5f3ff',
                                    fontSize: 18,
                                }}
                            >
                                <UserOutlined />
                            </Flex>
                        </Flex>

                        <Flex
                            align="baseline"
                            gap={6}
                        >
                            <Text
                                style={{
                                    color: '#101828',
                                    fontSize: 30,
                                    fontWeight: 750,
                                    lineHeight: 1,
                                }}
                            >
                                {benchReadiness.totalBench}
                            </Text>

                            <Text
                                style={{
                                    color: '#667085',
                                    fontSize: 13,
                                }}
                            >
                                nhân sự Bench
                            </Text>
                        </Flex>

                        <Flex
                            vertical
                            gap={8}
                        >
                            <StatusRow
                                label="Sẵn sàng"
                                value={
                                    benchReadiness.ready
                                }
                                icon={
                                    <CheckCircleOutlined />
                                }
                                iconColor="#16a34a"
                                iconBackground="#ecfdf3"
                            />

                            <StatusRow
                                label="Sẵn sàng một phần"
                                value={
                                    benchReadiness.partiallyReady
                                }
                                icon={
                                    <ExclamationCircleOutlined />
                                }
                                iconColor="#2563eb"
                                iconBackground="#eff6ff"
                            />

                            <StatusRow
                                label="Cần xác minh năng lực"
                                value={
                                    benchReadiness.needsVerification
                                }
                                icon={
                                    <SafetyCertificateOutlined />
                                }
                                iconColor="#d97706"
                                iconBackground="#fff7ed"
                            />

                            <StatusRow
                                label="Cần cập nhật hồ sơ"
                                value={
                                    benchReadiness.needsProfileUpdate
                                }
                                icon={
                                    <WarningOutlined />
                                }
                                iconColor="#dc2626"
                                iconBackground="#fef2f2"
                            />
                        </Flex>
                    </Flex>
                </Card>
            </Col>

            {/* Data quality */}
            <Col
                xs={24}
                md={12}
                xl={8}
            >
                <Card
                    bordered={false}
                    style={{
                        height: '100%',
                        borderRadius: 16,
                        border: '1px solid #eaecf0',
                        boxShadow:
                            '0 1px 3px rgba(16,24,40,0.04)',
                    }}
                    styles={{
                        body: {
                            padding: 20,
                        },
                    }}
                >
                    <Flex
                        vertical
                        gap={18}
                    >
                        <SectionTitle
                            title="Chất lượng dữ liệu nhân sự"
                            description="Các vấn đề dữ liệu cần HR ưu tiên xử lý"
                        />

                        <Flex
                            vertical
                            gap={8}
                        >
                            <StatusRow
                                label="Chưa có kỹ năng"
                                value={
                                    dataQuality.employeesWithoutSkills
                                }
                                icon={
                                    <WarningOutlined />
                                }
                                iconColor="#dc2626"
                                iconBackground="#fef2f2"
                            />

                            <StatusRow
                                label="Chưa có minh chứng được duyệt"
                                value={
                                    dataQuality.employeesWithoutApprovedEvidence
                                }
                                icon={
                                    <SafetyCertificateOutlined />
                                }
                                iconColor="#d97706"
                                iconBackground="#fff7ed"
                            />

                            <StatusRow
                                label="Nhân sự có minh chứng chờ duyệt"
                                value={
                                    dataQuality.employeesWithPendingEvidence
                                }
                                icon={
                                    <ClockCircleOutlined />
                                }
                                iconColor="#2563eb"
                                iconBackground="#eff6ff"
                            />

                            <StatusRow
                                label="Tổng minh chứng chờ duyệt"
                                value={
                                    dataQuality.totalPendingEvidences
                                }
                                icon={
                                    <FileSearchOutlined />
                                }
                                iconColor="#7c3aed"
                                iconBackground="#f5f3ff"
                            />

                            <StatusRow
                                label="Hồ sơ lâu chưa cập nhật"
                                value={
                                    dataQuality.staleProfiles
                                }
                                icon={
                                    <ExclamationCircleOutlined />
                                }
                                iconColor="#ea580c"
                                iconBackground="#fff7ed"
                            />
                        </Flex>
                    </Flex>
                </Card>
            </Col>
        </Row>
    );
};

export default HrDashboardOperations;