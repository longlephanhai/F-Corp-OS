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
    Avatar,
    Badge,
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
    RiseOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { useToken } = theme;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const colors = {
    primary:              '#0057c2',
    primaryLight:         '#e8f0fe',
    error:                '#ba1a1a',
    errorContainer:       '#ffdad6',
    onErrorContainer:     '#93000a',
    secondary:            '#266d00',
    secondaryLight:       '#edffd6',
    onSecondary:          '#ffffff',
    tertiary:             '#7d5400',
    tertiaryContainer:    '#9d6a00',
    tertiaryFixed:        '#ffddb0',
    tertiaryFixedDim:     '#ffba45',
    tertiaryLight:        '#fff3e0',
    onTertiaryFixed:      '#281800',
    secondaryFixed:       '#88fd54',
    onSecondaryFixed:     '#062100',
    surface:              '#fcf9f8',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow:  '#f6f3f2',
    surfaceContainer:     '#f0edec',
    surfaceVariant:       '#e5e2e1',
    onSurface:            '#1c1b1b',
    onSurfaceVariant:     '#414755',
    outline:              '#727786',
    outlineVariant:       '#e8eaf0',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AISuggestionRecord {
    key: string;
    name: string;
    initials: string;
    avatarColor: string;
    suggestion: string;
    suggestionType: 'training' | 'transfer';
    score: number;
}

interface RewardRequest {
    id: string;
    requester: string;
    requesterInitials: string;
    requesterColor: string;
    description: string;
    amount: number;
}

interface SkillGap {
    skill: string;
    level: 'high' | 'medium' | 'low';
    icon: React.ReactNode;
    description: string;
    count: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const aiSuggestions: AISuggestionRecord[] = [
    { key: '1', name: 'Nguyễn Văn A', initials: 'NA', avatarColor: '#0057c2', suggestion: 'Đào tạo thêm',  suggestionType: 'training', score: 85 },
    { key: '2', name: 'Lê Thị B',     initials: 'LB', avatarColor: '#266d00', suggestion: 'Điều chuyển',  suggestionType: 'transfer', score: 92 },
];

const rewardRequests: RewardRequest[] = [
    { id: '1', requester: 'Trần C (PM)',   requesterInitials: 'TC', requesterColor: '#7d5400', description: 'Thưởng dự án X cho Phạm D',          amount: 200 },
    { id: '2', requester: 'Hoàng E (PM)',  requesterInitials: 'HE', requesterColor: '#0057c2', description: 'Hoàn thành xuất sắc Module Y',         amount: 500 },
];

const skillGaps: SkillGap[] = [
    { skill: 'ReactJS',    level: 'high',   icon: <CodeOutlined />,     description: 'Cần bổ sung gấp 15 nhân sự cho Q1/2024', count: 15 },
    { skill: 'AWS',        level: 'medium', icon: <CloudOutlined />,    description: 'Đề xuất tổ chức khóa đào tạo nội bộ',     count: 6  },
    { skill: 'TypeScript', level: 'low',    icon: <DatabaseOutlined />, description: 'Đủ nguồn lực hiện tại, cần duy trì',      count: 2  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon: React.ReactNode;
    accentColor: string;
    iconBg: string;
    borderColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, accentColor, iconBg, borderColor }) => (
    <Card
        hoverable
        bordered={false}
        style={{
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${borderColor ?? colors.outlineVariant}`,
            overflow: 'hidden',
            height: '100%',
            transition: 'box-shadow 0.25s, transform 0.25s',
        }}
        styles={{ body: { padding: '20px 24px' } }}
        onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
    >
        {/* Decorative accent strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '16px 16px 0 0' }} />

        <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
            </Text>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: accentColor }}>
                {icon}
            </div>
        </Flex>

        <div style={{ fontSize: 30, fontWeight: 700, color: accentColor, lineHeight: 1.1, marginBottom: 6 }}>
            {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{sub}</div>}
    </Card>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; iconColor?: string }> = ({
    icon, title, iconColor = colors.primary,
}) => (
    <Flex align="center" gap={10}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: iconColor }}>
            {icon}
        </div>
        <Title level={5} style={{ margin: 0, color: colors.onSurface, fontWeight: 700 }}>
            {title}
        </Title>
    </Flex>
);

// ─── Suggestion Tag ───────────────────────────────────────────────────────────
const SuggestionTag: React.FC<{ type: 'training' | 'transfer' }> = ({ type }) =>
    type === 'training' ? (
        <Tag style={{ background: colors.tertiaryFixed, color: colors.onTertiaryFixed, border: 'none', borderRadius: 6, fontWeight: 600, padding: '2px 10px' }}>
            🎓 Đào tạo
        </Tag>
    ) : (
        <Tag style={{ background: colors.secondaryFixed, color: colors.onSecondaryFixed, border: 'none', borderRadius: 6, fontWeight: 600, padding: '2px 10px' }}>
            🔀 Điều chuyển
        </Tag>
    );

// ─── Skill Level Tag ──────────────────────────────────────────────────────────
const SkillLevelTag: React.FC<{ level: 'high' | 'medium' | 'low' }> = ({ level }) => {
    const cfg = {
        high:   { bg: colors.errorContainer,   color: colors.onErrorContainer, label: '🔴 Thiếu hụt cao' },
        medium: { bg: colors.tertiaryFixed,     color: colors.onTertiaryFixed,  label: '🟡 Trung bình'   },
        low:    { bg: colors.secondaryFixed,    color: colors.onSecondaryFixed, label: '🟢 Thấp'          },
    }[level];
    return (
        <span style={{ padding: '4px 14px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
            {cfg.label}
        </span>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const HRDashboard: React.FC = () => {
    const { token } = useToken();
    const [messageApi, contextHolder] = message.useMessage();
    const [activeTab, setActiveTab] = useState<string>('ai_bench');

    const handleApprove = (name: string) => messageApi.success(`✅ Đã duyệt đề xuất cho ${name}`);
    const handleReject  = (name: string) => messageApi.warning(`❌ Đã từ chối đề xuất cho ${name}`);

    // ── AI Suggestions Columns ────────────────────────────────────────────
    const aiColumns: ColumnsType<AISuggestionRecord> = [
        {
            title: 'Nhân viên',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, r) => (
                <Flex align="center" gap={10}>
                    <Avatar style={{ background: r.avatarColor, flexShrink: 0, fontWeight: 700 }} size={34}>{r.initials}</Avatar>
                    <Text strong style={{ color: colors.onSurface, fontSize: 13 }}>{name}</Text>
                </Flex>
            ),
        },
        {
            title: 'Đề xuất AI',
            dataIndex: 'suggestionType',
            key: 'suggestion',
            render: (type: 'training' | 'transfer') => <SuggestionTag type={type} />,
        },
        {
            title: 'Điểm phù hợp',
            dataIndex: 'score',
            key: 'score',
            render: (score: number) => (
                <Flex align="center" gap={10} style={{ minWidth: 130 }}>
                    <Progress
                        percent={score}
                        size={[90, 6]}
                        showInfo={false}
                        strokeColor={score >= 90 ? colors.secondary : colors.primary}
                        trailColor={colors.surfaceVariant}
                    />
                    <Text strong style={{ color: score >= 90 ? colors.secondary : colors.primary, fontSize: 13, minWidth: 36 }}>{score}%</Text>
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
                        style={{ borderRadius: 6, borderColor: colors.outline, color: colors.onSurfaceVariant }}
                    >
                        Từ chối
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApprove(record.name)}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                    >
                        Duyệt
                    </Button>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'ai_bench',
            label: (
                <span>
                    <ThunderboltOutlined style={{ color: colors.primary, marginRight: 6 }} />
                    AI Đề xuất Bench
                </span>
            ),
            children: (
                <Table<AISuggestionRecord>
                    columns={aiColumns}
                    dataSource={aiSuggestions}
                    pagination={false}
                    size="middle"
                    style={{ marginTop: 4 }}
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

    // ── Skill gap style map ───────────────────────────────────────────────
    const skillStyleMap = {
        high:   { bg: 'rgba(186,26,26,0.05)',    border: colors.errorContainer,  iconBg: colors.errorContainer,  iconColor: colors.onErrorContainer  },
        medium: { bg: 'rgba(255,221,176,0.18)',  border: colors.tertiaryFixed,   iconBg: colors.tertiaryFixed,   iconColor: colors.onTertiaryFixed    },
        low:    { bg: 'rgba(136,253,84,0.10)',   border: '#b7eb8f',              iconBg: colors.secondaryFixed,  iconColor: colors.onSecondaryFixed   },
    };

    return (
        <>
            {contextHolder}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter, sans-serif' }}>

                {/* ── Page Header ──────────────────────────────────────────────────── */}
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <div>
                        <Title level={3} style={{ margin: 0, letterSpacing: '-0.02em', color: colors.onSurface }}>
                            Bảng điều khiển HR
                        </Title>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            Tổng quan hoạt động nhân sự · Quý 3/2026
                        </Text>
                    </div>
                    <Space size={10}>
                        <Button
                            icon={<RiseOutlined />}
                            size="large"
                            style={{ borderRadius: 8, fontWeight: 600, borderColor: colors.primary, color: colors.primary }}
                        >
                            Xuất báo cáo
                        </Button>
                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            size="large"
                            style={{ borderRadius: 8, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,87,194,0.25)' }}
                        >
                            Hành động nhanh
                        </Button>
                    </Space>
                </Flex>

                {/* ── Section 1: Stat Cards ─────────────────────────────────────────── */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            label="Tỷ lệ Bench"
                            value="12%"
                            sub={<Flex align="center" gap={4}><ArrowUpOutlined style={{ color: colors.error }} /><span style={{ color: colors.error }}>+2% so với tháng trước</span></Flex>}
                            icon={<TeamOutlined />}
                            accentColor={colors.error}
                            iconBg={colors.errorContainer}
                            borderColor={colors.errorContainer}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            label="Chờ duyệt AI Đề xuất"
                            value={<Badge count={5} offset={[8, 0]} color={colors.error}><span>5</span></Badge>}
                            sub="cảnh báo cần xử lý ngay"
                            icon={<ExclamationCircleFilled />}
                            accentColor="#d46b08"
                            iconBg={colors.tertiaryFixed}
                            borderColor={colors.tertiaryFixed}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            label="Hoàn thành Đánh giá chéo"
                            value={
                                <Flex align="center" gap={12}>
                                    <Progress
                                        type="circle"
                                        percent={85}
                                        size={52}
                                        strokeColor={colors.primary}
                                        trailColor={colors.surfaceVariant}
                                        strokeWidth={9}
                                        format={pct => <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>{pct}%</span>}
                                    />
                                    <span style={{ fontSize: 26, fontWeight: 700, color: colors.primary }}>85%</span>
                                </Flex>
                            }
                            sub="17/20 nhân viên đã hoàn thành"
                            icon={<CheckSquareOutlined />}
                            accentColor={colors.primary}
                            iconBg={colors.primaryLight}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            label="Ngân sách F-Token đã cấp"
                            value="50,000"
                            sub={<span style={{ color: colors.secondary }}>🪙 F-Token còn lại: 75,000</span>}
                            icon={<WalletOutlined />}
                            accentColor={colors.secondary}
                            iconBg={colors.secondaryLight}
                            borderColor="#b7eb8f"
                        />
                    </Col>
                </Row>

                {/* ── Section 2: Action Hub + Gamification ─────────────────────────── */}
                <Row gutter={[16, 16]} align="stretch">

                    {/* Left: Action Hub */}
                    <Col xs={24} lg={16}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                border: `1px solid ${colors.outlineVariant}`,
                                height: '100%',
                            }}
                            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.outlineVariant}` }}>
                                <SectionHeader icon={<NodeExpandOutlined />} title="Trung tâm xử lý (Action Hub)" />
                            </div>
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

                    {/* Right: Gamification */}
                    <Col xs={24} lg={8}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 16,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                border: `1px solid ${colors.outlineVariant}`,
                                height: '100%',
                            }}
                            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                            <div style={{
                                padding: '18px 24px',
                                borderBottom: `1px solid ${colors.outlineVariant}`,
                                background: 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%)',
                                borderRadius: '16px 16px 0 0',
                            }}>
                                <SectionHeader icon={<TrophyOutlined />} title="Gamification & Ví" iconColor={colors.tertiary} />
                            </div>

                            <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Text style={{ color: colors.onSurfaceVariant, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Yêu cầu cấp thưởng gần đây
                                </Text>

                                {rewardRequests.map(req => (
                                    <div
                                        key={req.id}
                                        style={{
                                            padding: 14,
                                            borderRadius: 12,
                                            border: `1px solid ${colors.outlineVariant}`,
                                            background: colors.surfaceContainerLowest,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                            transition: 'box-shadow 0.2s',
                                        }}
                                    >
                                        <Flex align="flex-start" gap={10}>
                                            <Avatar
                                                style={{ background: req.requesterColor, flexShrink: 0, fontWeight: 700, fontSize: 11 }}
                                                size={34}
                                            >
                                                {req.requesterInitials}
                                            </Avatar>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ color: colors.onSurface, display: 'block', fontSize: 13 }}>{req.requester}</Text>
                                                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, display: 'block' }}>{req.description}</Text>
                                            </div>
                                            <Tag
                                                color="gold"
                                                style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '2px 10px', whiteSpace: 'nowrap' }}
                                            >
                                                +{req.amount} 🪙
                                            </Tag>
                                        </Flex>
                                        <Flex justify="flex-end" gap={8}>
                                            <Button
                                                size="small"
                                                danger
                                                icon={<CloseOutlined />}
                                                onClick={() => handleReject(req.requester)}
                                                style={{ borderRadius: 6, fontWeight: 500 }}
                                            >
                                                Từ chối
                                            </Button>
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<CheckOutlined />}
                                                onClick={() => handleApprove(req.requester)}
                                                style={{ borderRadius: 6, fontWeight: 600 }}
                                            >
                                                Duyệt
                                            </Button>
                                        </Flex>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.outlineVariant}` }}>
                                <Button
                                    icon={<SettingOutlined />}
                                    block
                                    style={{ borderRadius: 8, borderColor: colors.outline, color: colors.onSurface, height: 36, fontWeight: 500 }}
                                >
                                    Quản lý luật thưởng
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* ── Section 3: Skill Gap ──────────────────────────────────────────── */}
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 16,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: `1px solid ${colors.outlineVariant}`,
                    }}
                >
                    <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                        <SectionHeader
                            icon={<CheckSquareOutlined />}
                            title="Tổng quan thiếu hụt kỹ năng (Skill Gap)"
                            iconColor={colors.secondary}
                        />
                        <Button
                            size="small"
                            style={{ borderRadius: 6, borderColor: colors.outline, color: colors.onSurfaceVariant, fontWeight: 500 }}
                        >
                            Xem chi tiết
                        </Button>
                    </Flex>

                    <Row gutter={[16, 16]}>
                        {skillGaps.map(item => {
                            const s = skillStyleMap[item.level];
                            return (
                                <Col xs={24} md={8} key={item.skill}>
                                    <div
                                        style={{
                                            padding: 24,
                                            borderRadius: 14,
                                            background: s.bg,
                                            border: `1px solid ${s.border}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            gap: 12,
                                            transition: 'transform 0.2s',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                                    >
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor, fontSize: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                            {item.icon}
                                        </div>

                                        <div>
                                            <Title level={5} style={{ margin: 0, color: colors.onSurface }}>{item.skill}</Title>
                                            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>
                                                {item.count > 0 ? `${item.count} vị trí cần tuyển` : 'Đủ nguồn lực'}
                                            </Text>
                                        </div>

                                        <SkillLevelTag level={item.level} />

                                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 1.5 }}>
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