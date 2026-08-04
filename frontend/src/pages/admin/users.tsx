// src/pages/admin/users.tsx
import { useState } from 'react';
import {
    Avatar,
    Breadcrumb,
    Button,
    Card,
    Flex,
    Input,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title } = Typography;

interface IMockUser {
    id: string;
    fullName: string;
    email: string;
    role: { id: string; name: string };
}

const MOCK_USERS: IMockUser[] = [
    { id: '1', fullName: 'Sarah Jenkins', email: 's.jenkins@f-corp.com', role: { id: 'r1', name: 'Administrator' } },
    { id: '2', fullName: 'Michael Chen', email: 'm.chen@f-corp.com', role: { id: 'r2', name: 'Editor' } },
    { id: '3', fullName: 'Elena Patel', email: 'e.patel@f-corp.com', role: { id: 'r3', name: 'Viewer' } },
    { id: '4', fullName: 'Marcus Reed', email: 'm.reed@f-corp.com', role: { id: 'r2', name: 'Editor' } },
];

// Danh sách role cho dropdown filter — sau này thay bằng gọi GET /roles
const MOCK_ROLES = [
    { id: 'r1', name: 'Administrator' },
    { id: 'r2', name: 'Editor' },
    { id: 'r3', name: 'Viewer' },
];

const roleTagColor = (roleName: string) => {
    switch (roleName) {
        case 'Administrator': return 'blue';
        case 'Editor': return 'default';
        case 'Viewer': return 'default';
        default: return 'default';
    }
};

const UsersPage = () => {
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

    const filteredData = MOCK_USERS.filter((u) => {
        const matchSearch =
            u.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email.toLowerCase().includes(searchText.toLowerCase());
        const matchRole = roleFilter ? u.role.id === roleFilter : true;
        return matchSearch && matchRole;
    });

    const columns: TableProps<IMockUser>['columns'] = [
        {
            title: 'FULL NAME',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => (
                <Flex align="center" gap={8}>
                    <Avatar size={28} icon={<UserOutlined />} />
                    <span style={{ fontWeight: 500 }}>{text}</span>
                </Flex>
            ),
        },
        {
            title: 'EMAIL',
            dataIndex: 'email',
            key: 'email',
            render: (text) => <b style={{ color: '#595959' }}>{text}</b>,
        },
        {
            title: 'ROLE',
            dataIndex: 'role',
            key: 'role',
            render: (role: IMockUser['role']) => (
                <Tag color={roleTagColor(role.name)} bordered={false}>
                    {role.name}
                </Tag>
            ),
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => console.log('edit', record.id)}
                    />
                    <Popconfirm
                        title="Xoá người dùng này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => console.log('delete', record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Breadcrumb
                items={[{ title: <Link to="/admin">Home</Link> }, { title: 'Users' }]}
                style={{ marginBottom: 8 }}
            />

            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Users
                </Title>
                <Button type="primary" icon={<PlusOutlined />}>
                    Add User
                </Button>
            </Flex>

            <Card>
                <Flex justify="space-between" style={{ marginBottom: 16 }} wrap="wrap" gap={12}>
                    <Input
                        placeholder="Search by name or email..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ maxWidth: 320 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by Role"
                        style={{ minWidth: 180 }}
                        allowClear
                        value={roleFilter}
                        onChange={(value) => setRoleFilter(value)}
                        options={MOCK_ROLES.map((r) => ({ label: r.name, value: r.id }))}
                    />
                </Flex>

                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} người dùng` }}
                />
            </Card>
        </>
    );
};

export default UsersPage;