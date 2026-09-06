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
    SafetyCertificateOutlined,
    TrophyOutlined,
    WalletOutlined,
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

const formatNumber = (
    value: number,
    minimumFractionDigits = 0,
) =>
    new Intl.NumberFormat(
        'vi-VN',
        {
            minimumFractionDigits,
            maximumFractionDigits: 2,
        },
    ).format(value);

const HrDashboardInsights: React.FC<Props> = ({
    data,
}) => {
    const {
        skillSupply,
        wallet,
    } = data;

    const maxSkillSupply =
        Math.max(
            1,
            ...skillSupply.topSupplySkills.map(
                (skill) =>
                    skill.totalEmployees,
            ),
        );

    return (
        <Row
            gutter={[16, 16]}
            align="stretch"
        >
            {/* Skill Supply */}
            <Col
                xs={24}
                xl={15}
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
                            padding: 22,
                        },
                    }}
                >
                    <Flex
                        vertical
                        gap={22}
                    >
                        {/* Header */}
                        <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={16}
                            wrap="wrap"
                        >
                            <div>
                                <Text
                                    style={{
                                        display: 'block',
                                        color: '#101828',
                                        fontSize: 16,
                                        fontWeight: 700,
                                    }}
                                >
                                    Nguồn cung kỹ năng
                                </Text>

                                <Text
                                    style={{
                                        display: 'block',
                                        marginTop: 3,
                                        color: '#98a2b3',
                                        fontSize: 12,
                                    }}
                                >
                                    Tổng quan năng lực hiện có trong đội ngũ
                                </Text>
                            </div>

                            <Tag
                                bordered={false}
                                icon={
                                    skillSupply.zeroSupplySkills > 0
                                        ? <WarningOutlined />
                                        : <CheckCircleOutlined />
                                }
                                style={{
                                    margin: 0,
                                    padding: '5px 11px',
                                    borderRadius: 999,
                                    background:
                                        skillSupply.zeroSupplySkills > 0
                                            ? '#fef2f2'
                                            : '#ecfdf3',
                                    color:
                                        skillSupply.zeroSupplySkills > 0
                                            ? '#dc2626'
                                            : '#16a34a',
                                    fontWeight: 600,
                                }}
                            >
                                {skillSupply.zeroSupplySkills > 0
                                    ? `${skillSupply.zeroSupplySkills} kỹ năng chưa có nguồn cung`
                                    : 'Tất cả kỹ năng đều có nguồn lực'}
                            </Tag>
                        </Flex>

                        {/* Verification */}
                        <div
                            style={{
                                padding: 16,
                                borderRadius: 12,
                                background:
                                    'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                                border:
                                    '1px solid #dbeafe',
                            }}
                        >
                            <Flex
                                justify="space-between"
                                align="center"
                                gap={16}
                                wrap="wrap"
                            >
                                <Flex
                                    align="center"
                                    gap={12}
                                >
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 12,
                                            background: '#ffffff',
                                            color: '#2563eb',
                                            fontSize: 18,
                                            boxShadow:
                                                '0 1px 2px rgba(16,24,40,0.05)',
                                        }}
                                    >
                                        <SafetyCertificateOutlined />
                                    </Flex>

                                    <div>
                                        <Text
                                            style={{
                                                display: 'block',
                                                color: '#344054',
                                                fontSize: 13,
                                                fontWeight: 600,
                                            }}
                                        >
                                            Tỷ lệ kỹ năng đã được xác minh
                                        </Text>

                                        <Text
                                            style={{
                                                color: '#667085',
                                                fontSize: 12,
                                            }}
                                        >
                                            Dựa trên minh chứng năng lực đã được duyệt
                                        </Text>
                                    </div>
                                </Flex>

                                <Text
                                    style={{
                                        color: '#2563eb',
                                        fontSize: 25,
                                        fontWeight: 750,
                                        letterSpacing: '-0.025em',
                                    }}
                                >
                                    {skillSupply.verificationRate}%
                                </Text>
                            </Flex>

                            <Progress
                                percent={
                                    skillSupply.verificationRate
                                }
                                showInfo={false}
                                strokeColor="#2563eb"
                                trailColor="#dbeafe"
                                style={{
                                    margin:
                                        '12px 0 0',
                                }}
                            />
                        </div>

                        {/* Top supply */}
                        <div>
                            <Flex
                                justify="space-between"
                                align="center"
                                style={{
                                    marginBottom: 14,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#344054',
                                        fontSize: 13,
                                        fontWeight: 700,
                                    }}
                                >
                                    Kỹ năng có nguồn cung cao nhất
                                </Text>

                                <Text
                                    style={{
                                        color: '#98a2b3',
                                        fontSize: 11,
                                    }}
                                >
                                    Theo số nhân sự sở hữu kỹ năng
                                </Text>
                            </Flex>

                            <Flex
                                vertical
                                gap={13}
                            >
                                {skillSupply.topSupplySkills.map(
                                    (
                                        skill,
                                        index,
                                    ) => {
                                        const percent =
                                            Math.round(
                                                (
                                                    skill.totalEmployees /
                                                    maxSkillSupply
                                                ) *
                                                100,
                                            );

                                        return (
                                            <Flex
                                                key={
                                                    skill.skillId
                                                }
                                                align="center"
                                                gap={12}
                                            >
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        flexShrink: 0,
                                                        borderRadius: 8,
                                                        background:
                                                            index === 0
                                                                ? '#eff6ff'
                                                                : '#f9fafb',
                                                        color:
                                                            index === 0
                                                                ? '#2563eb'
                                                                : '#667085',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {index + 1}
                                                </Flex>

                                                <div
                                                    style={{
                                                        width: 100,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: '#344054',
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        {skill.name}
                                                    </Text>

                                                    <Text
                                                        style={{
                                                            display: 'block',
                                                            color: '#98a2b3',
                                                            fontSize: 10,
                                                        }}
                                                    >
                                                        {skill.level4Plus} nhân sự cấp 4+
                                                    </Text>
                                                </div>

                                                <Progress
                                                    percent={
                                                        percent
                                                    }
                                                    showInfo={false}
                                                    strokeColor={
                                                        index === 0
                                                            ? '#2563eb'
                                                            : '#84adff'
                                                    }
                                                    trailColor="#f2f4f7"
                                                    size="small"
                                                    style={{
                                                        flex: 1,
                                                        margin: 0,
                                                    }}
                                                />

                                                <Text
                                                    style={{
                                                        minWidth: 64,
                                                        textAlign: 'right',
                                                        color: '#344054',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {skill.totalEmployees} nhân sự
                                                </Text>
                                            </Flex>
                                        );
                                    },
                                )}
                            </Flex>
                        </div>

                        {/* Bench skill supply */}
                        <div
                            style={{
                                paddingTop: 18,
                                borderTop:
                                    '1px solid #f2f4f7',
                            }}
                        >
                            <Text
                                style={{
                                    display: 'block',
                                    marginBottom: 10,
                                    color: '#344054',
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            >
                                Kỹ năng đang có nguồn lực Bench
                            </Text>

                            <Flex
                                gap={8}
                                wrap="wrap"
                            >
                                {skillSupply.topBenchSkills.length >
                                    0 ? (
                                    skillSupply.topBenchSkills.map(
                                        (skill) => (
                                            <Tag
                                                key={
                                                    skill.skillId
                                                }
                                                bordered={false}
                                                style={{
                                                    margin: 0,
                                                    padding:
                                                        '5px 10px',
                                                    borderRadius: 8,
                                                    color: '#067647',
                                                    background: '#ecfdf3',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {skill.name}
                                                {' · '}
                                                {skill.benchEmployees} Bench
                                            </Tag>
                                        ),
                                    )
                                ) : (
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                        }}
                                    >
                                        Hiện chưa có nguồn lực Bench theo kỹ năng.
                                    </Text>
                                )}
                            </Flex>
                        </div>
                    </Flex>
                </Card>
            </Col>

            {/* Wallet */}
            <Col
                xs={24}
                xl={9}
            >
                <Card
                    bordered={false}
                    style={{
                        position: 'relative',
                        height: '100%',
                        overflow: 'hidden',
                        borderRadius: 16,
                        border: '1px solid #eaecf0',
                        background:
                            'linear-gradient(160deg, #ffffff 0%, #fffbeb 100%)',
                        boxShadow:
                            '0 1px 3px rgba(16,24,40,0.04)',
                    }}
                    styles={{
                        body: {
                            padding: 22,
                            height: '100%',
                        },
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: -60,
                            right: -60,
                            width: 170,
                            height: 170,
                            borderRadius: '50%',
                            background:
                                'rgba(245,158,11,0.08)',
                        }}
                    />

                    <Flex
                        vertical
                        gap={24}
                        style={{
                            position: 'relative',
                            height: '100%',
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="flex-start"
                        >
                            <div>
                                <Text
                                    style={{
                                        display: 'block',
                                        color: '#101828',
                                        fontSize: 16,
                                        fontWeight: 700,
                                    }}
                                >
                                    F-Token & ghi nhận
                                </Text>

                                <Text
                                    style={{
                                        display: 'block',
                                        marginTop: 3,
                                        color: '#98a2b3',
                                        fontSize: 12,
                                    }}
                                >
                                    Tổng quan hoạt động ghi nhận nhân sự
                                </Text>
                            </div>

                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 13,
                                    background: '#fffbeb',
                                    color: '#d97706',
                                    fontSize: 20,
                                    border: '1px solid #fde68a',
                                }}
                            >
                                <WalletOutlined />
                            </Flex>
                        </Flex>

                        {/* Hero balance */}
                        <div
                            style={{
                                padding: '22px 18px',
                                borderRadius: 14,
                                background: '#ffffff',
                                border: '1px solid #fef3c7',
                                boxShadow:
                                    '0 1px 2px rgba(16,24,40,0.03)',
                            }}
                        >
                            <Text
                                style={{
                                    display: 'block',
                                    color: '#667085',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                Tổng số dư đang lưu hành
                            </Text>

                            <Flex
                                align="baseline"
                                gap={7}
                                wrap="wrap"
                                style={{
                                    marginTop: 7,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#92400e',
                                        fontSize: 32,
                                        fontWeight: 760,
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.035em',
                                    }}
                                >
                                    {formatNumber(
                                        wallet.totalBalance,
                                        2,
                                    )}
                                </Text>

                                <Text
                                    style={{
                                        color: '#b45309',
                                        fontSize: 13,
                                        fontWeight: 600,
                                    }}
                                >
                                    F-Token
                                </Text>
                            </Flex>
                        </div>

                        {/* Wallet metrics */}
                        <Row
                            gutter={[10, 10]}
                        >
                            <Col span={8}>
                                <Flex
                                    vertical
                                    gap={5}
                                    style={{
                                        height: '100%',
                                        padding: 13,
                                        borderRadius: 12,
                                        background: '#f9fafb',
                                        border:
                                            '1px solid #f2f4f7',
                                    }}
                                >
                                    <WalletOutlined
                                        style={{
                                            color: '#667085',
                                            fontSize: 16,
                                        }}
                                    />

                                    <Text
                                        style={{
                                            color: '#101828',
                                            fontSize: 20,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {wallet.totalWallets}
                                    </Text>

                                    <Text
                                        style={{
                                            color: '#98a2b3',
                                            fontSize: 11,
                                        }}
                                    >
                                        Ví đang có
                                    </Text>
                                </Flex>
                            </Col>

                            <Col span={8}>
                                <Flex
                                    vertical
                                    gap={5}
                                    style={{
                                        height: '100%',
                                        padding: 13,
                                        borderRadius: 12,
                                        background: '#ecfdf3',
                                        border:
                                            '1px solid #d1fadf',
                                    }}
                                >
                                    <TrophyOutlined
                                        style={{
                                            color: '#16a34a',
                                            fontSize: 16,
                                        }}
                                    />

                                    <Text
                                        style={{
                                            color: '#067647',
                                            fontSize: 20,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {wallet.rewardTransactions}
                                    </Text>

                                    <Text
                                        style={{
                                            color: '#067647',
                                            fontSize: 11,
                                        }}
                                    >
                                        Lượt thưởng
                                    </Text>
                                </Flex>
                            </Col>

                            <Col span={8}>
                                <Flex
                                    vertical
                                    gap={5}
                                    style={{
                                        height: '100%',
                                        padding: 13,
                                        borderRadius: 12,
                                        background: '#fef2f2',
                                        border:
                                            '1px solid #fee2e2',
                                    }}
                                >
                                    <WarningOutlined
                                        style={{
                                            color: '#dc2626',
                                            fontSize: 16,
                                        }}
                                    />

                                    <Text
                                        style={{
                                            color: '#b42318',
                                            fontSize: 20,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {wallet.penaltyTransactions}
                                    </Text>

                                    <Text
                                        style={{
                                            color: '#b42318',
                                            fontSize: 11,
                                        }}
                                    >
                                        Lượt phạt
                                    </Text>
                                </Flex>
                            </Col>
                        </Row>

                        <Flex
                            align="center"
                            gap={8}
                            style={{
                                marginTop: 'auto',
                                paddingTop: 16,
                                borderTop:
                                    '1px solid #f2f4f7',
                            }}
                        >
                            <TrophyOutlined
                                style={{
                                    color: '#d97706',
                                }}
                            />

                            <Text
                                style={{
                                    color: '#667085',
                                    fontSize: 12,
                                }}
                            >
                                Dữ liệu được tổng hợp từ lịch sử giao dịch F-Token.
                            </Text>
                        </Flex>
                    </Flex>
                </Card>
            </Col>
        </Row>
    );
};

export default HrDashboardInsights;