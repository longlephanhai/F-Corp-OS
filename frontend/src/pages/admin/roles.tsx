import { useEffect, useState } from 'react';
import { Breadcrumb, Button, Card, Popconfirm, Space, Table, message } from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { callFetchRoles, callFetchPermissions, callCreateRole, callFetchRoleById, callUpdateRole, callDeleteRole } from '../../api';
import AddRoleModal, { type IPermission } from '../../components/admin/add-role-modal';
import EditRoleModal, { type IRoleDetail } from '../../components/admin/edit-role-modal';

interface IRole {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

const RolesPage = () => {
    const [roles, setRoles] = useState<IRole[]>([]);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<IRoleDetail | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchRoles = async () => {
        setLoading(true);
        const res: any = await callFetchRoles();
        setRoles(res?.data || []);
        setLoading(false);
    };

    const fetchPermissions = async () => {
        const res: any = await callFetchPermissions();
        setPermissions(res?.data || []);
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const handleCreateRole = async (values: { name: string; description: string; permissions: string[] }) => {
        setSubmitting(true);
        try {
            const res: any = await callCreateRole(values);
            if (res?.data) {
                message.success('Tạo role thành công');
                setAddModalOpen(false);
                fetchRoles();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi tạo role');
            }
        } catch (err: any) {
            message.error(err?.message || 'Có lỗi xảy ra khi tạo role');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = async (role: IRole) => {
        const res: any = await callFetchRoleById(role.id);
        if (res?.data) {
            setEditingRole(res.data);
            setEditModalOpen(true);
        } else {
            message.error('Không tải được thông tin role');
        }
    };

    const handleUpdateRole = async (values: { name: string; description: string; permissions: string[] }) => {
        if (!editingRole) return;
        setSubmitting(true);
        try {
            const res: any = await callUpdateRole(editingRole.id, values);
            if (res?.data) {
                message.success('Cập nhật role thành công');
                setEditModalOpen(false);
                setEditingRole(null);
                fetchRoles();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi cập nhật role');
            }
        } catch (err: any) {
            message.error(err?.message || 'Có lỗi xảy ra khi cập nhật role');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRole = async (id: string) => {
        setDeletingId(id);
        try {
            const res: any = await callDeleteRole(id);
            if (res?.data !== undefined) {
                message.success('Xoá role thành công');
                fetchRoles();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi xoá role');
            }
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xoá role');
        } finally {
            setDeletingId(null);
        }
    };

    const columns: TableProps<IRole>['columns'] = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
    title: 'Actions',
    key: 'actions',
    width: 90,
    render: (_: unknown, record: IRole) => (
        <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(record)} />
                <Popconfirm
                    title="Xoá role này?"
                    description="Toàn bộ quyền hạn gán cho role này cũng sẽ bị gỡ."
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => handleDeleteRole(record.id)}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingId === record.id}
                    />
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

            <Card
                title="Danh sách Roles (Vai trò)"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                        Thêm mới
                    </Button>
                }
            >
                <Table rowKey="id" loading={loading} columns={columns} dataSource={roles} pagination={false} />
            </Card>

            <AddRoleModal
                open={addModalOpen}
                permissions={permissions}
                submitting={submitting}
                onCancel={() => setAddModalOpen(false)}
                onSubmit={handleCreateRole}
            />

            <EditRoleModal
                open={editModalOpen}
                permissions={permissions}
                submitting={submitting}
                initialValues={editingRole}
                onCancel={() => {
                    setEditModalOpen(false);
                    setEditingRole(null);
                }}
                onSubmit={handleUpdateRole}
            />
        </>
    );
};

export default RolesPage;