import React from 'react';
import {
    Card,
    Col,
    Flex,
    Progress,
    Row,
    Statistic,
    Tag,
    Typography,
} from 'antd';

import {
    SafetyCertificateOutlined,
    WalletOutlined,
} from '@ant-design/icons';

import type {
    HrDashboardSummary,
} from '../../../api/hrDashboard';

const { Text } = Typography;

interface Props {
    data: HrDashboardSummary;
}

const HrDashboardInsights: React.FC<Props> = ({
    data,
}) => {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
                <Card
                    title="Nguồn cung kỹ năng"
                    style={{
                        height: '100%',
                        borderRadius: 12,
                    }}
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        gap={16}
                        wrap="wrap"
                    >
                        <div>
                            <Text type="secondary">
                                Tỷ lệ kỹ năng đã được xác minh
                            </Text>

                            <div
                                style={{
                                    marginTop: 8,
                                }}
                            >
                                <Progress
                                    percent={
                                        data.skillSupply.verificationRate
                                    }
                                    style={{
                                        width: 260,
                                    }}
                                />
                            </div>
                        </div>

                        <Tag
                            icon={
                                <SafetyCertificateOutlined />
                            }
                        >
                            {data.skillSupply.skillsWithSupply}/
                            {data.skillSupply.totalSkills} kỹ năng có nguồn lực
                        </Tag>
                    </Flex>

                    <div
                        style={{
                            marginTop: 24,
                        }}
                    >
                        <Text strong>
                            Kỹ năng có nguồn cung cao nhất
                        </Text>

                        <Flex
                            vertical
                            gap={10}
                            style={{
                                marginTop: 12,
                            }}
                        >
                            {data.skillSupply.topSupplySkills.map(
                                (skill) => (
                                    <Flex
                                        key={skill.skillId}
                                        justify="space-between"
                                        align="center"
                                    >
                                        <div>
                                            <Text strong>
                                                {skill.name}
                                            </Text>

                                            <br />

                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 12,
                                                }}
                                            >
                                                Cấp độ 4+:{' '}
                                                {skill.level4Plus}
                                            </Text>
                                        </div>

                                        <Tag color="blue">
                                            {skill.totalEmployees} nhân sự
                                        </Tag>
                                    </Flex>
                                ),
                            )}
                        </Flex>
                    </div>

                    <div
                        style={{
                            marginTop: 24,
                        }}
                    >
                        <Text strong>
                            Kỹ năng đang có nguồn lực Bench
                        </Text>

                        <Flex
                            gap={8}
                            wrap="wrap"
                            style={{
                                marginTop: 12,
                            }}
                        >
                            {data.skillSupply.topBenchSkills.map(
                                (skill) => (
                                    <Tag
                                        key={skill.skillId}
                                        color="green"
                                    >
                                        {skill.name}: {skill.benchEmployees} Bench
                                    </Tag>
                                ),
                            )}
                        </Flex>
                    </div>
                </Card>
            </Col>

            <Col xs={24} xl={10}>
                <Card
                    title="F-Token & ghi nhận"
                    style={{
                        height: '100%',
                        borderRadius: 12,
                    }}
                >
                    <Statistic
                        title="Tổng số dư F-Token"
                        value={data.wallet.totalBalance}
                        precision={2}
                        formatter={(value) =>
                            new Intl.NumberFormat('vi-VN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }).format(Number(value))
                        }
                        prefix={<WalletOutlined />}
                        suffix="F-Token"
                    />

                    <Row
                        gutter={[12, 12]}
                        style={{
                            marginTop: 24,
                        }}
                    >
                        <Col span={12}>
                            <Statistic
                                title="Số ví"
                                value={
                                    data.wallet.totalWallets
                                }
                            />
                        </Col>

                        <Col span={12}>
                            <Statistic
                                title="Lượt thưởng"
                                value={
                                    data.wallet.rewardTransactions
                                }
                            />
                        </Col>

                        <Col span={12}>
                            <Statistic
                                title="Lượt phạt"
                                value={
                                    data.wallet.penaltyTransactions
                                }
                            />
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    );
};

export default HrDashboardInsights;