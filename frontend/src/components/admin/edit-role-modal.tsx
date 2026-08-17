import { useEffect, useState } from 'react';
import { Collapse, Flex, Form, Input, Modal, Space, Switch, Tag, Typography } from 'antd';
import { SafetyOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';
import type { IPermission } from './add-role-modal';

const { Text } = Typography;
const { TextArea } = Input;

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

export interface IRoleDetail {
    id: string;
    name: string;
    description: string;
    permissions: IPermission[];
}

interface IProps {
    open: boolean;
    permissions: IPermission[];
    submitting: boolean;
    initialValues: IRoleDetail | null;
    onCancel: () => void;
    onSubmit: (values: { name: string; description: string; permissions: string[] }) => void;
}

const EditRoleModal = ({ open, permissions, submitting, initialValues, onCancel, onSubmit }: IProps) => {
    const [form] = Form.useForm();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Đổ dữ liệu role hiện tại vào form + danh sách quyền đã chọn mỗi khi mở modal
    useEffect(() => {
        if (open && initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                description: initialValues.description,
            });
            setSelectedIds(initialValues.permissions?.map((p) => p.id) ?? []);
        }
    }, [open, initialValues, form]);

    const modules = Array.from(new Set(permissions.map((p) => p.module)));

    const isModuleFullySelected = (mod: string) => {
        const idsInModule = permissions.filter((p) => p.module === mod).map((p) => p.id);
        return idsInModule.length > 0 && idsInModule.every((id) => selectedIds.includes(id));
    };

    const toggleModuleAll = (mod: string, checked: boolean) => {
        const idsInModule = permissions.filter((p) => p.module === mod).map((p) => p.id);
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
        });
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <Modal
            title="Cập nhật Role"
            open={open}
            onCancel={handleCancel}
            onOk={handleOk}
            confirmLoading={submitting}
            okText="Lưu"
            cancelText="Huỷ"
            width={640}
            destroyOnClose
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
                    items={modules.map((mod) => {
                        const permsInModule = permissions.filter((p) => p.module === mod);
                        return {
                            key: mod,
                            label: (
                                <Flex align="center" gap={8}>
                                    {MODULE_ICON[mod] || <SafetyOutlined />}
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
                                                        color={METHOD_COLOR[perm.method] || 'default'}
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

export default EditRoleModal;