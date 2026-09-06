import React from 'react';
import {
    Card,
    Col,
    Progress,
    Row,
    Statistic,
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

const { Text } = Typography;

interface Props {
    data: HrDashboardSummary;
}

const HrDashboardOverview: React.FC<Props> = ({
    data,
}) => {
    const cards = [
        {
            title: 'Tổng nhân sự',
            value:
                data.workforce.totalEmployees,
            suffix: 'người',
            icon: <TeamOutlined />,
            extra: `${data.workforce.available} sẵn sàng · ${data.workforce.inProject} đang tham gia dự án`,
        },
        {
            title: 'Tỷ lệ nhân sự Bench',
            value:
                data.workforce.benchRate,
            suffix: '%',
            icon: <UsergroupAddOutlined />,
            extra: `${data.workforce.bench} nhân sự đang Bench`,
        },
        {
            title: 'Hoàn thành đánh giá',
            value:
                data.reviews.completionRate,
            suffix: '%',
            icon: <CheckCircleOutlined />,
            extra: `${data.reviews.completed}/${data.reviews.total} bản ghi đã hoàn thành`,
        },
        {
            title: 'Kỹ năng chưa có nguồn cung',
            value:
                data.skillSupply.zeroSupplySkills,
            suffix: 'kỹ năng',
            icon: <WarningOutlined />,
            extra: `${data.skillSupply.skillsWithSupply}/${data.skillSupply.totalSkills} kỹ năng đang có nguồn lực`,
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card) => (
                <Col
                    xs={24}
                    sm={12}
                    xl={6}
                    key={card.title}
                >
                    <Card
                        style={{
                            height: '100%',
                            borderRadius: 12,
                        }}
                    >
                        <Statistic
                            title={card.title}
                            value={card.value}
                            precision={
                                card.title ===
                                    'Tỷ lệ Bench' ||
                                    card.title ===
                                    'Hoàn thành đánh giá'
                                    ? 1
                                    : 0
                            }
                            suffix={card.suffix}
                            prefix={card.icon}
                        />

                        {(card.title ===
                            'Tỷ lệ Bench' ||
                            card.title ===
                            'Hoàn thành đánh giá') && (
                                <Progress
                                    percent={Number(
                                        card.value,
                                    )}
                                    showInfo={false}
                                    size="small"
                                    style={{
                                        marginTop: 12,
                                        marginBottom: 4,
                                    }}
                                />
                            )}

                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                            }}
                        >
                            {card.extra}
                        </Text>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default HrDashboardOverview;