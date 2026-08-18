import { useState } from 'react';
import { Form, Input, Modal, Select, message, AutoComplete } from 'antd';
import { callCreatePermission } from '../../api';

interface IProps {
    open: boolean;
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

const AddPermissionModal = ({ open, existingModules, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const res: any = await callCreatePermission(values);

            if (res?.data) {
                message.success('Tạo permission thành công');
                form.resetFields();
                onSuccess();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi tạo permission');
            }
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || 'Có lỗi xảy ra khi tạo permission');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Thêm mới Permission"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Tạo mới"
            cancelText="Huỷ"
            width={520}
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
                        placeholder="VD: USERS (gõ mới hoặc chọn có sẵn)"
                        filterOption={(inputValue, option) =>
                            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddPermissionModal;