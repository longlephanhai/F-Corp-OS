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

import type {
    HrDashboardSummary,
} from '../../../api/hrDashboard';

const { Text } = Typography;

interface Props {
    data: HrDashboardSummary;
}

const MetricRow = ({
    label,
    value,
}: {
    label: string;
    value: number;
}) => (
    <Flex
        justify="space-between"
        align="center"
    >
        <Text type="secondary">
            {label}
        </Text>

        <Text strong>
            {value}
        </Text>
    </Flex>
);

const HrDashboardOperations: React.FC<Props> = ({
    data,
}) => {
    const reviewPercent =
        data.reviews.total === 0
            ? 0
            : data.reviews.completionRate;

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={8}>
                <Card
                    title="Tình trạng đánh giá"
                    style={{
                        height: '100%',
                        borderRadius: 12,
                    }}
                >
                    <Progress
                        percent={reviewPercent}
                        strokeWidth={10}
                    />

                    <Flex
                        gap={8}
                        wrap="wrap"
                        style={{
                            marginTop: 16,
                        }}
                    >
                        <Tag>
                            Chờ đánh giá: {data.reviews.pending}
                        </Tag>

                        <Tag color="blue">
                            Đang đánh giá: {data.reviews.inReview}
                        </Tag>

                        <Tag color="green">
                            Hoàn thành: {data.reviews.completed}
                        </Tag>
                    </Flex>
                </Card>
            </Col>

            <Col xs={24} xl={8}>
                <Card
                    title="Mức độ sẵn sàng Bench"
                    style={{
                        height: '100%',
                        borderRadius: 12,
                    }}
                >
                    <Flex vertical gap={12}>
                        <MetricRow
                            label="Tổng nhân sự Bench"
                            value={
                                data.benchReadiness.totalBench
                            }
                        />

                        <MetricRow
                            label="Sẵn sàng"
                            value={
                                data.benchReadiness.ready
                            }
                        />

                        <MetricRow
                            label="Sẵn sàng một phần"
                            value={
                                data.benchReadiness.partiallyReady
                            }
                        />

                        <MetricRow
                            label="Cần xác minh năng lực"
                            value={
                                data.benchReadiness.needsVerification
                            }
                        />

                        <MetricRow
                            label="Cần cập nhật hồ sơ"
                            value={
                                data.benchReadiness.needsProfileUpdate
                            }
                        />
                    </Flex>
                </Card>
            </Col>

            <Col xs={24} xl={8}>
                <Card
                    title="Chất lượng dữ liệu nhân sự"
                    style={{
                        height: '100%',
                        borderRadius: 12,
                    }}
                >
                    <Flex vertical gap={12}>
                        <MetricRow
                            label="Chưa có kỹ năng"
                            value={
                                data.dataQuality.employeesWithoutSkills
                            }
                        />

                        <MetricRow
                            label="Chưa có minh chứng được duyệt"
                            value={
                                data.dataQuality
                                    .employeesWithoutApprovedEvidence
                            }
                        />

                        <MetricRow
                            label="Có minh chứng chờ duyệt"
                            value={
                                data.dataQuality
                                    .employeesWithPendingEvidence
                            }
                        />

                        <MetricRow
                            label="Tổng minh chứng chờ duyệt"
                            value={
                                data.dataQuality.totalPendingEvidences
                            }
                        />

                        <MetricRow
                            label="Hồ sơ lâu chưa cập nhật"
                            value={
                                data.dataQuality.staleProfiles
                            }
                        />
                    </Flex>
                </Card>
            </Col>
        </Row>
    );
};

export default HrDashboardOperations;