import { useEffect, useState } from 'react';
import {
    Breadcrumb,
    Card,
    Collapse,
    Flex,
    Input,
    Segmented,
    Space,
    Table,
    Tag,
    Typography,
    Button,
    Popconfirm,
    message,
} from 'antd';
import type { TableProps } from 'antd';
import {
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    TeamOutlined,
    SafetyOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { callFetchPermissions, callDeletePermission } from '../../api';
import AddPermissionModal from '../../components/admin/add-permission-modal';
import EditPermissionModal from '../../components/admin/edit-permission-modal';

const { Title, Text, Paragraph } = Typography;

interface IPermission {
    id: string;
    description: string;
    api_path: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    module: string;
}

const METHOD_COLOR: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PATCH: 'orange',
    DELETE: 'red',
};

const MODULE_ICON: Record<string, React.ReactNode> = {
    USERS: <TeamOutlined />,
    ROLES: <SafetyOutlined />,
    PERMISSIONS: <KeyOutlined />,
};

const PermissionsPage = () => {
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [moduleFilter, setModuleFilter] = useState('ALL');
    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<IPermission | null>(null);

    const fetchPermissions = async () => {
        setLoading(true);
        const res: any = await callFetchPermissions();
        if (res?.data) {
            setPermissions(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await callDeletePermission(id);
            message.success('Xoá permission thành công');
            fetchPermissions();
        } catch (error) {
            console.error('Failed to delete permission:', error);
            message.error('Xoá permission thất bại');
        }
    };

    // Danh sách module lấy động từ dữ liệu thật, không hard-code
    const modules = Array.from(new Set(permissions.map((p) => p.module)));

    const filtered = permissions.filter(
        (p) =>
            (p.api_path.toLowerCase().includes(searchText.toLowerCase()) ||
                p.description.toLowerCase().includes(searchText.toLowerCase())) &&
            (moduleFilter === 'ALL' || p.module === moduleFilter)
    );

    const handleSegmentChange = (value: string) => {
        setModuleFilter(value);
        if (value !== 'ALL') {
            setActiveKeys([value]);
        }
    };

    const columns: TableProps<IPermission>['columns'] = [
        {
            title: 'METHOD',
            dataIndex: 'method',
            key: 'method',
            width: 100,
            render: (method: string) => (
                <Tag color={METHOD_COLOR[method] || 'default'} bordered={false} style={{ fontWeight: 600 }}>
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
            width: 100,
            render: (_, record) => (
                <Space size={4}>
                    <button
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={() => setEditingPermission(record)}
                    >
                        <EditOutlined />
                    </button>
                    <Popconfirm
                        title="Xoá permission này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ff4d4f' }}>
                            <DeleteOutlined />
                        </button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

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
                        value={moduleFilter}
                        onChange={(value) => handleSegmentChange(value as string)}
                        options={[
                            { label: 'All', value: 'ALL' },
                            ...modules.map((m) => ({ label: m.charAt(0) + m.slice(1).toLowerCase(), value: m })),
                        ]}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                        Add Permission
                    </Button>
                </Space>
            </Flex>

            <div style={{ marginTop: 24 }}>
                <Collapse
                    activeKey={activeKeys}
                    onChange={(keys) => setActiveKeys(keys as string[])}
                    items={modules
                        .filter((mod) => filtered.some((p) => p.module === mod))
                        .map((mod) => {
                            const items = filtered.filter((p) => p.module === mod);
                            return {
                                key: mod,
                                label: (
                                    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                                        <Flex align="center" gap={8}>
                                            {MODULE_ICON[mod] || <SafetyOutlined />}
                                            <span style={{ fontWeight: 600 }}>
                                                {mod.charAt(0) + mod.slice(1).toLowerCase()} Module
                                            </span>
                                        </Flex>
                                        <Tag bordered={false}>{items.length} Endpoints</Tag>
                                    </Flex>
                                ),
                                children: (
                                    <Table
                                        rowKey="id"
                                        columns={columns}
                                        dataSource={items}
                                        pagination={false}
                                        size="middle"
                                    />
                                ),
                            };
                        })}
                />

                {!loading && filtered.length === 0 && (
                    <Card>
                        <Text type="secondary">Không tìm thấy permission nào khớp.</Text>
                    </Card>
                )}
            </div>

            <AddPermissionModal
                open={addModalOpen}
                existingModules={modules}
                onCancel={() => setAddModalOpen(false)}
                onSuccess={() => {
                    setAddModalOpen(false);
                    fetchPermissions();
                }}
            />

            <EditPermissionModal
                open={!!editingPermission}
                permission={editingPermission}
                existingModules={modules}
                onCancel={() => setEditingPermission(null)}
                onSuccess={() => {
                    setEditingPermission(null);
                    fetchPermissions();
                }}
            />
        </>
    );
};

export default PermissionsPage;