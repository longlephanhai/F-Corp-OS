import { useEffect, useState } from 'react';
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
import { callFetchUsers, callFetchRoles } from '../../api';
import Access from '../../components/protected-route/access';
import { ALL_PERMISSIONS } from '../../utils/permissions';

const { Title } = Typography;

interface IUser {
    id: string;
    fullName: string;
    email: string;
    role: { id: string; name: string } | null;
    isDeleted: boolean;
}

interface IRole {
    id: string;
    name: string;
}

const roleTagColor = (roleName?: string) => {
    switch (roleName) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
            return 'blue';
        default:
            return 'default';
    }
};

const ALL_ROLES_VALUE = 'ALL';

const UsersPage = () => {
    const [data, setData] = useState<IUser[]>([]);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE);

    const [meta, setMeta] = useState({ current: 1, pageSize: 10, total: 0 });

    // ← ĐỔI: tham số thứ 3 đổi tên fullName -> search, gửi lên đúng key `search`
    const fetchUsers = async (current = 1, pageSize = 10, search = '', role_id?: string) => {
        setLoading(true);
        let query = `current=${current}&pageSize=${pageSize}`;
        if (search) query += `&search=${search}`;
        if (role_id && role_id !== ALL_ROLES_VALUE) query += `&role_id=${role_id}`;

        const res: any = await callFetchUsers(query);
        if (res?.data) {
            setData(res.data.result);
            setMeta({
                current: res.data.meta.currentPage,
                pageSize: res.data.meta.pageSize,
                total: res.data.meta.total,
            });
        }
        setLoading(false);
    };

    const fetchRoles = async () => {
        const res: any = await callFetchRoles();
        if (res?.data) {
            setRoles(res.data);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const handleSearch = () => {
        fetchUsers(1, meta.pageSize, searchText, roleFilter);
    };

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        fetchUsers(1, meta.pageSize, searchText, value);
    };

    const columns: TableProps<IUser>['columns'] = [
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
            render: (text) => <a href={`mailto:${text}`}>{text}</a>,
        },
        {
            title: 'ROLE',
            dataIndex: 'role',
            key: 'role',
            render: (role: IUser['role']) =>
                role ? (
                    <Tag color={roleTagColor(role.name)} bordered={false}>
                        {role.name}
                    </Tag>
                ) : (
                    <Tag bordered={false}>—</Tag>
                ),
        },
        {
            title: 'DISABLED ACCOUNTS',
            dataIndex: 'isDeleted',
            key: 'isDeleted',
            align: 'center',
            render: (isDeleted: boolean) => (
                <Tag color={isDeleted ? 'red' : 'default'} bordered={false}>
                    {isDeleted ? "Disabled Accounts" : "Active Accounts"}
                </Tag>
            ),
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => console.log('edit', record.id)} />
                    <Popconfirm title="Xoá người dùng này?" okText="Xoá" cancelText="Huỷ">
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
                        onPressEnter={handleSearch}
                        allowClear
                        onClear={() => fetchUsers(1, meta.pageSize, '', roleFilter)}
                    />
                    <Select
                        placeholder="Filter by Role"
                        style={{ minWidth: 180 }}
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                        options={[
                            { label: 'All', value: ALL_ROLES_VALUE },
                            ...roles.map((r) => ({ label: r.name, value: r.id })),
                        ]}
                    />
                </Flex>

                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    pagination={{
                        current: meta.current,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showTotal: (total) => `Tổng ${total} người dùng`,
                        onChange: (page, pageSize) => fetchUsers(page, pageSize, searchText, roleFilter),
                    }}
                />
            </Card>
        </>
    );
};

export default UsersPage;