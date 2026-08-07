import { useState } from 'react';
import {
    Breadcrumb,
    Button,
    Card,
    Collapse,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    SafetyOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Text } = Typography;
const { TextArea } = Input;

interface IMockRole {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface IMockPermission {
    id: string;
    description: string;
    api_path: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    module: 'USERS' | 'ROLES' | 'PERMISSIONS';
}

const MOCK_ROLES: IMockRole[] = [
    { id: '1', name: 'SUPER_ADMIN', createdAt: '29-09-2024 14:56:38', updatedAt: '02-07-2025 17:45:48' },
    { id: '2', name: 'hr', createdAt: '02-07-2025 17:43:10', updatedAt: '02-07-2025 17:43:10' },
    { id: '3', name: 'NORMAL_USER', createdAt: '29-09-2024 14:56:38', updatedAt: '02-07-2025 17:41:32' },
];

// Khớp đúng 12 permission thật trong init.ts
const MOCK_PERMISSIONS: IMockPermission[] = [
    { id: '1', description: 'Fetch permission with paginate', api_path: '/api/v1/users', method: 'GET', module: 'USERS' },
    { id: '2', description: 'Create a user', api_path: '/api/v1/users', method: 'POST', module: 'USERS' },
    { id: '3', description: 'Update a user', api_path: '/api/v1/users', method: 'PATCH', module: 'USERS' },
    { id: '4', description: 'Delete a user', api_path: '/api/v1/users', method: 'DELETE', module: 'USERS' },
    { id: '5', description: 'Fetch role with paginate', api_path: '/api/v1/roles', method: 'GET', module: 'ROLES' },
    { id: '6', description: 'Create a role', api_path: '/api/v1/roles', method: 'POST', module: 'ROLES' },
    { id: '7', description: 'Update a role', api_path: '/api/v1/roles', method: 'PATCH', module: 'ROLES' },
    { id: '8', description: 'Delete a role', api_path: '/api/v1/roles', method: 'DELETE', module: 'ROLES' },
    { id: '9', description: 'Fetch permission with paginate', api_path: '/api/v1/permissions', method: 'GET', module: 'PERMISSIONS' },
    { id: '10', description: 'Create a permission', api_path: '/api/v1/permissions', method: 'POST', module: 'PERMISSIONS' },
    { id: '11', description: 'Update a permission', api_path: '/api/v1/permissions', method: 'PATCH', module: 'PERMISSIONS' },
    { id: '12', description: 'Delete a permission', api_path: '/api/v1/permissions', method: 'DELETE', module: 'PERMISSIONS' },
];

const METHOD_COLOR: Record<IMockPermission['method'], string> = {
    GET: 'blue',
    POST: 'green',
    PATCH: 'orange',
    DELETE: 'red',
};

const MODULE_ICON: Record<IMockPermission['module'], React.ReactNode> = {
    USERS: <TeamOutlined />,
    ROLES: <SafetyOutlined />,
    PERMISSIONS: <KeyOutlined />,
};

const MODULES: IMockPermission['module'][] = ['USERS', 'ROLES', 'PERMISSIONS'];

// ============ Component popup Thêm/Sửa Role ============
interface IRoleModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (values: { name: string; description: string; permissions: string[] }) => void;
}

const RoleFormModal = ({ open, onCancel, onSubmit }: IRoleModalProps) => {
    const [form] = Form.useForm();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const isModuleFullySelected = (mod: string) => {
        const idsInModule = MOCK_PERMISSIONS.filter((p) => p.module === mod).map((p) => p.id);
        return idsInModule.every((id) => selectedIds.includes(id));
    };

    const toggleModuleAll = (mod: string, checked: boolean) => {
        const idsInModule = MOCK_PERMISSIONS.filter((p) => p.module === mod).map((p) => p.id);
        setSelectedIds((prev) =>
            checked
                ? Array.from(new Set([...prev, ...idsInModule]))
                : prev.filter((id) => !idsInModule.includes(id))
        );
    };

    const togglePermission = (id: string, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            onSubmit({ ...values, permissions: selectedIds });
            form.resetFields();
            setSelectedIds([]);
        });
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedIds([]);
        onCancel();
    };

    return (
        <Modal
            title="Thêm mới Role"
            open={open}
            onCancel={handleCancel}
            onOk={handleOk}
            okText="Lưu"
            cancelText="Huỷ"
            width={640}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên Role"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên role' }]}
                >
                    <Input placeholder="Nhập tên role" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả role' }]}
                >
                    <TextArea rows={2} placeholder="Nhập mô tả role" />
                </Form.Item>

                <Text strong>Quyền hạn</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    Các quyền hạn được phép cho vai trò này
                </Text>

                <Collapse
                    defaultActiveKey={[]}
                    items={MODULES.map((mod) => {
                        const permsInModule = MOCK_PERMISSIONS.filter((p) => p.module === mod);
                        return {
                            key: mod,
                            label: (
                                <Flex align="center" gap={8}>
                                    {MODULE_ICON[mod]}
                                    <span>{mod}</span>
                                </Flex>
                            ),
                            extra: (
                                <Switch
                                    checked={isModuleFullySelected(mod)}
                                    onClick={(_, e) => e.stopPropagation()}
                                    onChange={(checked) => toggleModuleAll(mod, checked)}
                                />
                            ),
                            children: (
                                <Flex wrap="wrap" gap={16}>
                                    {permsInModule.map((perm) => (
                                        <Flex
                                            key={perm.id}
                                            align="flex-start"
                                            gap={8}
                                            style={{ width: 'calc(50% - 8px)' }}
                                        >
                                            <Switch
                                                checked={selectedIds.includes(perm.id)}
                                                onChange={(checked) => togglePermission(perm.id, checked)}
                                            />
                                            <div>
                                                <div>{perm.description}</div>
                                                <Space size={6}>
                                                    <Tag
                                                        color={METHOD_COLOR[perm.method]}
                                                        bordered={false}
                                                        style={{ fontWeight: 600, marginInlineEnd: 0 }}
                                                    >
                                                        {perm.method}
                                                    </Tag>
                                                    <Text code style={{ fontSize: 12 }}>
                                                        {perm.api_path}
                                                    </Text>
                                                </Space>
                                            </div>
                                        </Flex>
                                    ))}
                                </Flex>
                            ),
                        };
                    })}
                />
            </Form>
        </Modal>
    );
};

// ============ Trang chính Roles ============
const RolesPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [appliedFilter, setAppliedFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const filteredRoles = MOCK_ROLES.filter((r) =>
        r.name.toLowerCase().includes(appliedFilter.toLowerCase())
    );

    const handleSubmitRole = (values: { name: string; description: string; permissions: string[] }) => {
        console.log('Tạo role mới:', values);
        // TODO: gọi API POST /roles khi backend sẵn sàng
        setModalOpen(false);
    };

    const columns: TableProps<IMockRole>['columns'] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'CreatedAt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
        },
        {
            title: 'UpdatedAt',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 90,
            render: () => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => setModalOpen(true)} />
                    <Popconfirm title="Xoá role này?" okText="Xoá" cancelText="Huỷ">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Breadcrumb
                items={[{ title: <Link to="/admin">Home</Link> }, { title: 'Roles' }]}
                style={{ marginBottom: 8 }}
            />

            <Card style={{ marginBottom: 16 }}>
                <Flex gap={12} align="flex-end" wrap="wrap">
                    <div>
                        <Text strong>Name</Text>
                        <Input
                            placeholder="nhập dữ liệu"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            style={{ width: 240, marginTop: 4 }}
                        />
                    </div>
                    <Button type="primary" icon={<SearchOutlined />} onClick={() => setAppliedFilter(nameFilter)}>
                        Tìm kiếm
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            setNameFilter('');
                            setAppliedFilter('');
                        }}
                    >
                        Làm mới
                    </Button>
                </Flex>
            </Card>

            <Card
                title="Danh sách Roles (Vai trò)"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                        Thêm mới
                    </Button>
                }
            >
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredRoles}
                    pagination={{ pageSize: 10, showTotal: (total) => `1-${total} trên ${total} rows` }}
                />
            </Card>

            <RoleFormModal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onSubmit={handleSubmitRole}
            />
        </>
    );
};

export default RolesPage;