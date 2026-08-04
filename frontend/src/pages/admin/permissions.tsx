// src/pages/admin/permissions.tsx
import { useRef, useState } from 'react';
import {
    Breadcrumb,
    Card,
    Flex,
    Input,
    Segmented,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
    SearchOutlined,
    EditOutlined,
    TeamOutlined,
    SafetyOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// ⚠️ MOCK DATA — khớp đúng 12 permission thật đang seed trong init.ts (backend)
// Sau này thay bằng gọi API GET /permissions
interface IMockPermission {
    id: string;
    description: string;
    api_path: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    module: 'USERS' | 'ROLES' | 'PERMISSIONS';
}

const MOCK_PERMISSIONS: IMockPermission[] = [
    { id: '1', description: 'GET USER', api_path: '/api/v1/users', method: 'GET', module: 'USERS' },
    { id: '2', description: 'POST USER', api_path: '/api/v1/users', method: 'POST', module: 'USERS' },
    { id: '3', description: 'PATCH USER', api_path: '/api/v1/users', method: 'PATCH', module: 'USERS' },
    { id: '4', description: 'DELETE USER', api_path: '/api/v1/users', method: 'DELETE', module: 'USERS' },
    { id: '5', description: 'GET ROLE', api_path: '/api/v1/roles', method: 'GET', module: 'ROLES' },
    { id: '6', description: 'POST ROLE', api_path: '/api/v1/roles', method: 'POST', module: 'ROLES' },
    { id: '7', description: 'PATCH ROLE', api_path: '/api/v1/roles', method: 'PATCH', module: 'ROLES' },
    { id: '8', description: 'DELETE ROLE', api_path: '/api/v1/roles', method: 'DELETE', module: 'ROLES' },
    { id: '9', description: 'GET PERMISSION', api_path: '/api/v1/permissions', method: 'GET', module: 'PERMISSIONS' },
    { id: '10', description: 'POST PERMISSION', api_path: '/api/v1/permissions', method: 'POST', module: 'PERMISSIONS' },
    { id: '11', description: 'PATCH PERMISSION', api_path: '/api/v1/permissions', method: 'PATCH', module: 'PERMISSIONS' },
    { id: '12', description: 'DELETE PERMISSION', api_path: '/api/v1/permissions', method: 'DELETE', module: 'PERMISSIONS' },
];

const METHOD_COLOR: Record<IMockPermission['method'], string> = {
    GET: 'blue',
    POST: 'green',
    PATCH: 'orange',
    DELETE: 'red',
};

const MODULE_ICON: Record<IMockPermission['module'], React.ReactNode> = {
    USERS: <TeamOutlined style={{ color: '#1677ff' }} />,
    ROLES: <SafetyOutlined style={{ color: '#1677ff' }} />,
    PERMISSIONS: <KeyOutlined style={{ color: '#1677ff' }} />,
};

const columns: TableProps<IMockPermission>['columns'] = [
    {
        title: 'METHOD',
        dataIndex: 'method',
        key: 'method',
        width: 100,
        render: (method: IMockPermission['method']) => (
            <Tag color={METHOD_COLOR[method]} bordered={false} style={{ fontWeight: 600 }}>
                {method}
            </Tag>
        ),
    },
    {
        title: 'ENDPOINT PATH',
        dataIndex: 'api_path',
        key: 'api_path',
        render: (text) => <Text code>{text}</Text>,
    },
    {
        title: 'DESCRIPTION',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'ACTIONS',
        key: 'actions',
        width: 80,
        render: (_, record) => (
            <Space>
                <button
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={() => console.log('edit', record.id)}
                >
                    <EditOutlined />
                </button>
            </Space>
        ),
    },
];

const MODULES: IMockPermission['module'][] = ['USERS', 'ROLES', 'PERMISSIONS'];

const PermissionsPage = () => {
    const [searchText, setSearchText] = useState('');

    // Ref cho từng khối module — dùng để scrollIntoView khi bấm filter
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const filtered = MOCK_PERMISSIONS.filter(
        (p) =>
            p.api_path.toLowerCase().includes(searchText.toLowerCase()) ||
            p.description.toLowerCase().includes(searchText.toLowerCase())
    );

    const scrollToModule = (mod: string) => {
        if (mod === 'ALL') return;
        const el = sectionRefs.current[mod];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <Breadcrumb
                items={[{ title: <Link to="/admin">Home</Link> }, { title: 'Permissions' }]}
                style={{ marginBottom: 8 }}
            />

            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }} wrap="wrap" gap={12}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Permissions
                    </Title>
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                        Quản lý danh sách quyền truy cập API và phân quyền endpoint.
                    </Paragraph>
                </div>

                <Space wrap>
                    <Input
                        placeholder="Search paths..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ width: 220 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Segmented
                        options={[
                            { label: 'All', value: 'ALL' },
                            { label: 'Users', value: 'USERS' },
                            { label: 'Roles', value: 'ROLES' },
                            { label: 'Permissions', value: 'PERMISSIONS' },
                        ]}
                        onChange={(value) => scrollToModule(value as string)}
                    />
                </Space>
            </Flex>

            <div style={{ marginTop: 24 }}>
                {MODULES.map((mod) => {
                    const items = filtered.filter((p) => p.module === mod);
                    if (items.length === 0) return null;

                    return (
                        <div
                            key={mod}
                            ref={(el) => {
                                sectionRefs.current[mod] = el;
                            }}
                        >
                            <Card
                                style={{ marginBottom: 16, scrollMarginTop: 24 }}
                                title={
                                    <Flex align="center" gap={8}>
                                        {MODULE_ICON[mod]}
                                        <span>{mod.charAt(0) + mod.slice(1).toLowerCase()} Module</span>
                                    </Flex>
                                }
                                extra={<Tag bordered={false}>{items.length} Endpoints</Tag>}
                            >
                                <Table
                                    rowKey="id"
                                    columns={columns}
                                    dataSource={items}
                                    pagination={false}
                                    size="middle"
                                />
                            </Card>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <Card>
                        <Text type="secondary">Không tìm thấy permission nào khớp.</Text>
                    </Card>
                )}
            </div>
        </>
    );
};

export default PermissionsPage;