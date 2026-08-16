import React from 'react';
import { Button, Row, Col, Card, Tag, Typography, Space, Flex } from 'antd';
import type { TableProps } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import ActionTable from '../../components/ui/ActionTable';

const { Title, Text } = Typography;

// ── Shared design tokens (đồng bộ với ReviewConsole & WalletAdmin) ──────────
const CARD_STYLE = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' } as const;
const CARD_BODY  = { padding: '16px 20px' } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BenchStatus = 'bench' | 'soon';

interface BenchRecord {
    key: string;
    name: string;
    avatarColor: string;
    avatarChar: string;
    position: string;
    currentProject: string;
    endDate: string;
    status: BenchStatus;
    skill: string; // primary skill key: 'ReactJS' | 'NodeJS' | 'Java' | 'Tester' | 'BA'
    tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const dataSource: BenchRecord[] = [
    {
        key: '1',
        name: 'Nguyễn Văn A',
        avatarColor: '#1677ff',
        avatarChar: 'A',
        position: 'Senior ReactJS',
        currentProject: 'Không có',
        endDate: '-',
        status: 'bench',
        skill: 'ReactJS',
        tags: ['React', 'TypeScript'],
    },
    {
        key: '2',
        name: 'Trần Thị B',
        avatarColor: '#faad14',
        avatarChar: 'B',
        position: 'Mid NodeJS',
        currentProject: 'E-Commerce App',
        endDate: '15/11/2023',
        status: 'soon',
        skill: 'NodeJS',
        tags: ['NodeJS', 'Express'],
    },
    {
        key: '3',
        name: 'Lê Văn C',
        avatarColor: '#52c41a',
        avatarChar: 'C',
        position: 'Junior Tester',
        currentProject: 'Không có',
        endDate: '-',
        status: 'bench',
        skill: 'Tester',
        tags: ['Manual Test', 'API Test'],
    },
    {
        key: '4',
        name: 'Phạm Thị D',
        avatarColor: '#eb2f96',
        avatarChar: 'D',
        position: 'Senior BA',
        currentProject: 'Fintech Portal',
        endDate: '20/11/2023',
        status: 'soon',
        skill: 'BA',
        tags: ['UML', 'Figma'],
    },
    {
        key: '5',
        name: 'Hoàng Văn E',
        avatarColor: '#722ed1',
        avatarChar: 'E',
        position: 'Mid Java',
        currentProject: 'Không có',
        endDate: '-',
        status: 'bench',
        skill: 'Java',
        tags: ['Java Core', 'Spring Boot'],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Table Columns
// ─────────────────────────────────────────────────────────────────────────────

const columns: TableProps<BenchRecord>['columns'] = [
    {
        title: 'Nhân sự',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) => (
            <Space>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: record.avatarColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                    }}
                >
                    {record.avatarChar}
                </div>
                <Text strong>{record.name}</Text>
            </Space>
        ),
    },
    {
        title: 'Vị trí & Cấp bậc',
        dataIndex: 'position',
        key: 'position',
    },
    {
        title: 'Dự án hiện tại',
        dataIndex: 'currentProject',
        key: 'currentProject',
        render: (val: string) => <Text type="secondary">{val}</Text>,
    },
    {
        title: 'Ngày kết thúc dự kiến',
        dataIndex: 'endDate',
        key: 'endDate',
        render: (val: string) => <Text type="secondary">{val}</Text>,
    },
    {
        title: 'Tình trạng',
        dataIndex: 'status',
        key: 'status',
        render: (val: BenchStatus) =>
            val === 'bench' ? (
                <Tag color="error">Đang Bench</Tag>
            ) : (
                <Tag color="warning">Sắp rảnh việc</Tag>
            ),
    },
    {
        title: 'Kỹ năng nổi bật',
        dataIndex: 'tags',
        key: 'tags',
        render: (tags: string[]) => (
            <Space size={4} wrap>
                {tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                ))}
            </Space>
        ),
    },
    {
        title: 'Hành động',
        key: 'action',
        align: 'right',
        render: () => (
            <Space>
                <Button type="primary" size="small">
                    Gán dự án
                </Button>
                <Button size="small">Xem hồ sơ</Button>
            </Space>
        ),
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

const BenchForecast: React.FC = () => {
    return (
        <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* 1. Page Header */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0, letterSpacing: '-0.02em' }}>
                        Dự báo Bench & Điều phối nhân sự
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Theo dõi và điều phối lập trình viên sắp trống việc.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    size="large"
                    style={{ borderRadius: 8, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,87,194,0.25)' }}
                >
                    Điều phối nhanh
                </Button>
            </Flex>

            {/* 2. Overview Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Tỷ lệ Bench hiện tại</Text>
                        <div style={{ fontSize: 26, fontWeight: 700, color: '#cf1322', marginTop: 8, lineHeight: 1.2 }}>
                            12%
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Nhân sự đang Bench</Text>
                        <div style={{ marginTop: 8 }}>
                            <span style={{ fontSize: 26, fontWeight: 700, color: '#cf1322', lineHeight: 1.2 }}>8</span>
                            <Text type="secondary" style={{ marginLeft: 6, fontSize: 13 }}>người</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={CARD_STYLE} styles={{ body: CARD_BODY }}>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Sắp rảnh việc</Text>
                        <div style={{ marginTop: 8 }}>
                            <span style={{ fontSize: 26, fontWeight: 700, color: '#d46b08', lineHeight: 1.2 }}>15</span>
                            <Text type="secondary" style={{ marginLeft: 6, fontSize: 13 }}>người</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* 3. ActionTable — thay thế Filter Bar + Table cũ */}
            <ActionTable<BenchRecord>
                columns={columns}
                dataSource={dataSource}
                rowKey="key"
                searchPlaceholder="Tìm kiếm nhân sự..."
                onSearch={(row, query) =>
                    row.name.toLowerCase().includes(query.toLowerCase())
                }
                filterOptions={[
                    {
                        key: 'skill',
                        placeholder: 'Kỹ năng chính',
                        options: [
                            { value: 'ReactJS', label: 'ReactJS' },
                            { value: 'NodeJS', label: 'NodeJS' },
                            { value: 'Java', label: 'Java' },
                            { value: 'Tester', label: 'Tester' },
                            { value: 'BA', label: 'BA' },
                        ],
                        width: 180,
                    },
                    {
                        key: 'status',
                        placeholder: 'Tình trạng',
                        options: [
                            { value: 'bench', label: 'Đang Bench' },
                            { value: 'soon', label: 'Sắp rảnh việc' },
                        ],
                        width: 180,
                    },
                ]}
                filterPredicates={{
                    skill: (row, value) => row.skill === value,
                    status: (row, value) => row.status === value,
                }}
                resultLabel="Nhân sự"
                scrollX={900}
            />
        </div>
    );
};

export default BenchForecast;