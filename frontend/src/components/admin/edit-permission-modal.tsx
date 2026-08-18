import { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, message, AutoComplete } from 'antd';
import { callUpdatePermission } from '../../api';

interface IPermission {
    id: string;
    description: string;
    api_path: string;
    method: string;
    module: string;
}

interface IProps {
    open: boolean;
    permission: IPermission | null;
    existingModules: string[];
    onCancel: () => void;
    onSuccess: () => void;
}

const METHOD_OPTIONS = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' },
];

const EditPermissionModal = ({ open, permission, existingModules, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Mỗi khi mở modal với 1 permission khác, đổ lại dữ liệu cũ vào form
    useEffect(() => {
        if (permission) {
            form.setFieldsValue(permission);
        }
    }, [permission, form]);

    const handleOk = async () => {
        if (!permission) return;
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const res: any = await callUpdatePermission(permission.id, values);

            if (res?.data) {
                message.success('Cập nhật permission thành công');
                onSuccess();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi cập nhật');
            }
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || 'Có lỗi xảy ra khi cập nhật');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <Modal
            title="Chỉnh sửa Permission"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Lưu"
            cancelText="Huỷ"
            width={520}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                >
                    <Input placeholder="VD: GET USER" />
                </Form.Item>

                <Form.Item
                    label="Method"
                    name="method"
                    rules={[{ required: true, message: 'Vui lòng chọn method' }]}
                >
                    <Select placeholder="Chọn method" options={METHOD_OPTIONS} />
                </Form.Item>

                <Form.Item
                    label="Endpoint Path"
                    name="api_path"
                    rules={[{ required: true, message: 'Vui lòng nhập endpoint path' }]}
                >
                    <Input placeholder="/api/v1/users" />
                </Form.Item>

                <Form.Item
                    label="Module"
                    name="module"
                    rules={[{ required: true, message: 'Vui lòng nhập module' }]}
                >
                    <AutoComplete
                        options={existingModules.map((m) => ({ value: m }))}
                        placeholder="VD: USERS"
                        filterOption={(inputValue, option) =>
                            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditPermissionModal;