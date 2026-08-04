import React, { useState } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Button,
    Tag,
    Tabs,
    Progress,
    Space,
    Flex,
    theme,
    message,
} from 'antd';
import {
    TeamOutlined,
    ExclamationCircleFilled,
    CheckSquareOutlined,
    WalletOutlined,
    TrophyOutlined,
    SettingOutlined,
    ArrowUpOutlined,
    CheckOutlined,
    CloseOutlined,
    CodeOutlined,
    CloudOutlined,
    DatabaseOutlined,
    NodeExpandOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { useToken } = theme;

// ─── Design Tokens (Material You → Ant Design mapping) ───────────────────────
const colors = {
    primary: '#0057c2',
    primaryHover: '#004398',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    secondary: '#266d00',
    onSecondary: '#ffffff',
    tertiary: '#7d5400',
    tertiaryContainer: '#9d6a00',
    tertiaryFixed: '#ffddb0',
    tertiaryFixedDim: '#ffba45',
    onTertiaryFixed: '#281800',
    secondaryFixed: '#88fd54',
    onSecondaryFixed: '#062100',
    surface: '#fcf9f8',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f6f3f2',
    surfaceContainer: '#f0edec',
    surfaceVariant: '#e5e2e1',
    onSurface: '#1c1b1b',
    onSurfaceVariant: '#414755',
    outline: '#727786',
    outlineVariant: '#c1c6d7',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AISuggestionRecord {
    key: string;
    name: string;
    suggestion: string;
    suggestionType: 'training' | 'transfer';
    score: number;
}

interface RewardRequest {
    id: string;
    requester: string;
    description: string;
    amount: number;
}

interface SkillGap {
    skill: string;
    level: 'high' | 'medium' | 'low';
    icon: React.ReactNode;
    description: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const aiSuggestions: AISuggestionRecord[] = [
    { key: '1', name: 'Nguyễn Văn A', suggestion: 'Đào tạo thêm', suggestionType: 'training', score: 85 },
    { key: '2', name: 'Lê Thị B', suggestion: 'Điều chuyển', suggestionType: 'transfer', score: 92 },
];

const rewardRequests: RewardRequest[] = [
    { id: '1', requester: 'Trần C (PM)', description: 'Thưởng dự án X cho Phạm D', amount: 200 },
    { id: '2', requester: 'Hoàng E (PM)', description: 'Hoàn thành xuất sắc Module Y', amount: 500 },
];

const skillGaps: SkillGap[] = [
    {
        skill: 'ReactJS',
        level: 'high',
        icon: <CodeOutlined style={{ fontSize: 22 }} />,
        description: 'Cần bổ sung gấp 15 nhân sự cho Q1/2024',
    },
    {
        skill: 'AWS',
        level: 'medium',
        icon: <CloudOutlined style={{ fontSize: 22 }} />,
        description: 'Đề xuất tổ chức khóa đào tạo nội bộ',
    },
    {
        skill: 'TypeScript',
        level: 'low',
        icon: <DatabaseOutlined style={{ fontSize: 22 }} />,
        description: 'Đủ nguồn lực hiện tại, cần duy trì',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable card header with icon */
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    iconColor?: string;
}> = ({ icon, title, iconColor = colors.primary }) => (
    <Flex align="center" gap={8}>
        <span style={{ color: iconColor, fontSize: 20, lineHeight: 1, display: 'flex' }}>{icon}</span>
        <Title level={5} style={{ margin: 0, color: colors.onSurface, fontWeight: 600 }}>
            {title}
        </Title>
    </Flex>
);

/** Skill level badge */
const SkillLevelTag: React.FC<{ level: 'high' | 'medium' | 'low' }> = ({ level }) => {
    const config = {
        high: { color: colors.error, bg: colors.error, text: '#fff', label: 'Thiếu hụt cao' },
        medium: { color: colors.tertiaryFixedDim, bg: colors.tertiaryFixedDim, text: colors.onTertiaryFixed, label: 'Trung bình' },
        low: { color: colors.secondary, bg: colors.secondary, text: colors.onSecondary, label: 'Thấp' },
    }[level];

    return (
        <span
            style={{
                padding: '3px 12px',
                borderRadius: 999,
                backgroundColor: config.bg,
                color: config.text,
                fontSize: 11,
                fontWeight: 600,
                display: 'inline-block',
            }}
        >
            {config.label}
        </span>
    );
};

/** Suggestion tag badge */
const SuggestionTag: React.FC<{ type: 'training' | 'transfer' }> = ({ type }) => {
    if (type === 'training') {
        return (
            <Tag
                style={{
                    backgroundColor: colors.tertiaryFixed,
                    color: colors.onTertiaryFixed,
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 500,
                }}
            >
                Đào tạo thêm
            </Tag>
        );
    }
    return (
        <Tag
            style={{
                backgroundColor: colors.secondaryFixed,
                color: colors.onSecondaryFixed,
                border: 'none',
                borderRadius: 4,
                fontWeight: 500,
            }}
        >
            Điều chuyển
        </Tag>
    );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const HRDashboard: React.FC = () => {
    const { token } = useToken();
    const [messageApi, contextHolder] = message.useMessage();
    const [activeTab, setActiveTab] = useState<string>('ai_bench');

    const handleApprove = (name: string) => {
        messageApi.success(`Đã duyệt đề xuất cho ${name}`);
    };

    const handleReject = (name: string) => {
        messageApi.warning(`Đã từ chối đề xuất cho ${name}`);
    };

    // ── AI Suggestions Table Columns ──────────────────────────────────────
    const aiColumns: ColumnsType<AISuggestionRecord> = [
        {
            title: 'Tên nhân viên',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <Text strong style={{ color: colors.onSurface }}>
                    {name}
                </Text>
            ),
        },
        {
            title: 'Đề xuất',
            dataIndex: 'suggestionType',
            key: 'suggestion',
            render: (type: 'training' | 'transfer') => <SuggestionTag type={type} />,
        },
        {
            title: 'Điểm phù hợp',
            dataIndex: 'score',
            key: 'score',
            render: (score: number) => (
                <Flex align="center" gap={8}>
                    <Progress
                        percent={score}
                        size={[72, 6]}
                        showInfo={false}
                        strokeColor={colors.primary}
                        trailColor={colors.surfaceVariant}
                    />
                    <Text style={{ color: colors.onSurface, minWidth: 36 }}>{score}%</Text>
                </Flex>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'right',
            render: (_: unknown, record: AISuggestionRecord) => (
                <Space size={8}>
                    <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => handleReject(record.name)}
                        style={{ borderColor: colors.outline, color: colors.onSurface }}
                    >
                        Từ chối
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApprove(record.name)}
                        style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                    >
                        Duyệt
                    </Button>
                </Space>
            ),
        },
    ];

    // ── Tab items ─────────────────────────────────────────────────────────
    const tabItems = [
        {
            key: 'ai_bench',
            label: 'AI Đề xuất Bench',
            children: (
                <Table<AISuggestionRecord>
                    columns={aiColumns}
                    dataSource={aiSuggestions}
                    pagination={false}
                    size="middle"
                    style={{ marginTop: 0 }}
                />
            ),
        },
        {
            key: 'kpi_okr',
            label: 'Kỳ đánh giá KPI/OKR',
            children: (
                <Flex justify="center" align="center" style={{ minHeight: 120 }}>
                    <Text type="secondary">Chưa có kỳ đánh giá nào đang hoạt động.</Text>
                </Flex>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Section 1: Summary Cards ─────────────────────────────────────── */}
                <Row gutter={[16, 16]}>

                    {/* Card 1 – Tỷ lệ Bench */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            hoverable
                            style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                            }}
                        >
                            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>Tỷ lệ Bench</Text>
                                <TeamOutlined style={{ fontSize: 20, color: colors.outline }} />
                            </Flex>
                            <Flex align="baseline" gap={8}>
                                <Title level={2} style={{ margin: 0, color: colors.onSurface, fontWeight: 600 }}>
                                    12%
                                </Title>
                                <Text style={{ color: colors.error, fontSize: 12 }}>
                                    <ArrowUpOutlined /> +2% (tháng trước)
                                </Text>
                            </Flex>
                        </Card>
                    </Col>

                    {/* Card 2 – Chờ duyệt AI Đề xuất */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            hoverable
                            style={{
                                border: `1px solid ${colors.errorContainer}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                            }}
                        >
                            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
                                    Chờ duyệt AI Đề xuất
                                </Text>
                                <ExclamationCircleFilled style={{ fontSize: 20, color: colors.error }} />
                            </Flex>
                            <Flex align="baseline" gap={8}>
                                <Title level={2} style={{ margin: 0, color: colors.error, fontWeight: 600 }}>
                                    5
                                </Title>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>cảnh báo</Text>
                            </Flex>
                        </Card>
                    </Col>

                    {/* Card 3 – Hoàn thành Đánh giá chéo */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            hoverable
                            style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                            }}
                        >
                            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
                                    Hoàn thành Đánh giá chéo
                                </Text>
                                <CheckSquareOutlined style={{ fontSize: 20, color: colors.outline }} />
                            </Flex>
                            <Flex align="center" gap={16}>
                                <Progress
                                    type="circle"
                                    percent={85}
                                    size={56}
                                    strokeColor={colors.primary}
                                    trailColor={colors.surfaceVariant}
                                    strokeWidth={8}
                                    format={(pct) => (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.onSurface }}>
                                            {pct}%
                                        </span>
                                    )}
                                />
                                <Title level={3} style={{ margin: 0, color: colors.onSurface, fontWeight: 600 }}>
                                    85%
                                </Title>
                            </Flex>
                        </Card>
                    </Col>

                    {/* Card 4 – Ngân sách F-Token */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            hoverable
                            style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                            }}
                        >
                            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
                                    Ngân sách F-Token đã cấp
                                </Text>
                                <WalletOutlined style={{ fontSize: 20, color: colors.outline }} />
                            </Flex>
                            <Flex align="baseline" gap={8}>
                                <Title level={2} style={{ margin: 0, color: colors.onSurface, fontWeight: 600 }}>
                                    50,000
                                </Title>
                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>F-Token</Text>
                            </Flex>
                        </Card>
                    </Col>
                </Row>

                {/* ── Section 2: Action Hub + Gamification ─────────────────────────── */}
                <Row gutter={[16, 16]} align="stretch">

                    {/* Left: Action Hub */}
                    <Col xs={24} lg={16}>
                        <Card
                            style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                                height: '100%',
                            }}
                            styles={{
                                body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
                            }}
                        >
                            {/* Card Header */}
                            <div
                                style={{
                                    padding: '16px 24px',
                                    borderBottom: `1px solid ${colors.outlineVariant}`,
                                }}
                            >
                                <SectionHeader
                                    icon={<NodeExpandOutlined />}
                                    title="Trung tâm xử lý (Action Hub)"
                                />
                            </div>

                            {/* Tabs + Table */}
                            <div style={{ padding: '0 24px 24px', flex: 1 }}>
                                <Tabs
                                    activeKey={activeTab}
                                    onChange={setActiveTab}
                                    items={tabItems}
                                    style={{ marginTop: 0 }}
                                />
                            </div>
                        </Card>
                    </Col>

                    {/* Right: Gamification & Ví */}
                    <Col xs={24} lg={8}>
                        <Card
                            style={{
                                border: `1px solid ${colors.outlineVariant}`,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary,
                                height: '100%',
                            }}
                            styles={{
                                body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
                            }}
                        >
                            {/* Card Header */}
                            <div
                                style={{
                                    padding: '16px 24px',
                                    borderBottom: `1px solid ${colors.outlineVariant}`,
                                    backgroundColor: colors.surfaceContainerLow,
                                    borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`,
                                }}
                            >
                                <SectionHeader
                                    icon={<TrophyOutlined />}
                                    title="Gamification & Ví"
                                    iconColor={colors.tertiary}
                                />
                            </div>

                            {/* Reward list */}
                            <div
                                style={{
                                    padding: 16,
                                    flex: 1,
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.onSurfaceVariant,
                                        fontWeight: 600,
                                        fontSize: 14,
                                    }}
                                >
                                    Yêu cầu cấp thưởng gần đây
                                </Text>

                                {rewardRequests.map((req) => (
                                    <div
                                        key={req.id}
                                        style={{
                                            padding: 12,
                                            borderRadius: token.borderRadiusLG,
                                            border: `1px solid ${colors.outlineVariant}`,
                                            backgroundColor: colors.surface,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                        }}
                                    >
                                        <Flex justify="space-between" align="flex-start">
                                            <div>
                                                <Text
                                                    strong
                                                    style={{ color: colors.onSurface, display: 'block', fontSize: 14 }}
                                                >
                                                    {req.requester}
                                                </Text>
                                                <Text
                                                    style={{
                                                        color: colors.onSurfaceVariant,
                                                        fontSize: 12,
                                                        display: 'block',
                                                    }}
                                                >
                                                    {req.description}
                                                </Text>
                                            </div>
                                            <Text
                                                strong
                                                style={{
                                                    color: colors.tertiaryContainer,
                                                    fontSize: 14,
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: 8,
                                                }}
                                            >
                                                +{req.amount} FT
                                            </Text>
                                        </Flex>
                                        <Flex justify="flex-end" gap={8}>
                                            <Button
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={() => handleReject(req.requester)}
                                                danger
                                            >
                                                Từ chối
                                            </Button>
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<CheckOutlined />}
                                                onClick={() => handleApprove(req.requester)}
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    borderColor: colors.primary,
                                                }}
                                            >
                                                Duyệt
                                            </Button>
                                        </Flex>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderTop: `1px solid ${colors.outlineVariant}`,
                                }}
                            >
                                <Button
                                    icon={<SettingOutlined />}
                                    block
                                    style={{ borderColor: colors.outline, color: colors.onSurface }}
                                >
                                    Quản lý luật thưởng
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* ── Section 3: Skill Gap Overview ────────────────────────────────── */}
                <Card
                    style={{
                        border: `1px solid ${colors.outlineVariant}`,
                        borderRadius: token.borderRadiusLG,
                        boxShadow: token.boxShadowTertiary,
                    }}
                >
                    <div style={{ marginBottom: 24 }}>
                        <SectionHeader
                            icon={<CheckSquareOutlined />}
                            title="Tổng quan thiếu hụt kỹ năng (Skill Gap)"
                            iconColor={colors.secondary}
                        />
                    </div>

                    <Row gutter={[16, 16]}>
                        {skillGaps.map((item) => {
                            const styleMap = {
                                high: {
                                    bg: 'rgba(186,26,26,0.06)',
                                    border: colors.errorContainer,
                                    iconBg: colors.errorContainer,
                                    iconColor: colors.onErrorContainer,
                                },
                                medium: {
                                    bg: 'rgba(255,221,176,0.20)',
                                    border: colors.tertiaryFixed,
                                    iconBg: colors.tertiaryFixed,
                                    iconColor: colors.onTertiaryFixed,
                                },
                                low: {
                                    bg: 'rgba(136,253,84,0.10)',
                                    border: colors.secondaryFixed,
                                    iconBg: colors.secondaryFixed,
                                    iconColor: colors.onSecondaryFixed,
                                },
                            }[item.level];

                            return (
                                <Col xs={24} md={8} key={item.skill}>
                                    <div
                                        style={{
                                            padding: 20,
                                            borderRadius: token.borderRadiusLG,
                                            backgroundColor: styleMap.bg,
                                            border: `1px solid ${styleMap.border}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        {/* Icon circle */}
                                        <div
                                            style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: '50%',
                                                backgroundColor: styleMap.iconBg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: styleMap.iconColor,
                                            }}
                                        >
                                            {item.icon}
                                        </div>

                                        <Title level={5} style={{ margin: 0, color: colors.onSurface }}>
                                            {item.skill}
                                        </Title>

                                        <SkillLevelTag level={item.level} />

                                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                                            {item.description}
                                        </Text>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Card>

            </div>
        </>
    );
};

export default HRDashboard;