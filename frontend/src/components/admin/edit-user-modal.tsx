import { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, message } from 'antd';
import { callUpdateUser } from '../../api';

const { Option } = Select;

const TITLE_OPTIONS = [
    { label: 'Junior Dev', value: 'JUNIOR_DEV' },
    { label: 'Senior Dev', value: 'SENIOR_DEV' },
    { label: 'PM', value: 'PM' },
    { label: 'HR', value: 'HR' },
];

const STATUS_OPTIONS = [
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'In Project', value: 'IN_PROJECT' },
];

interface IRole {
    id: string;
    name: string;
}

interface IUserRecord {
    id: string;
    email: string;
    fullName: string;
    role: { id: string; name: string } | null;
    title: string;
    status: string;
}

interface IProps {
    open: boolean;
    roles: IRole[];
    user: IUserRecord | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const EditUserModal = ({ open, roles, user, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && user) {
            form.setFieldsValue({
                email: user.email,
                fullName: user.fullName,
                role_id: user.role?.id,
                title: user.title,
                status: user.status,
            });
        }
    }, [open, user, form]);

    const handleOk = async () => {
        if (!user) return;
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const res: any = await callUpdateUser(user.id, values);

            if (res?.data || res?.message) {
                message.success('Cập nhật user thành công');
                onSuccess();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi cập nhật user');
            }
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || 'Có lỗi xảy ra khi cập nhật user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <Modal
            title="Chỉnh sửa User"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Lưu"
            cancelText="Huỷ"
            width={560}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Email không đúng định dạng' },
                    ]}
                >
                    <Input placeholder="ten@f-corp.com" />
                </Form.Item>

                <Form.Item
                    label="Họ tên"
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input placeholder="Nguyen Van A" />
                </Form.Item>

                <Form.Item
                    label="Role"
                    name="role_id"
                    rules={[{ required: true, message: 'Vui lòng chọn role' }]}
                >
                    <Select placeholder="Chọn role">
                        {roles.map((r) => (
                            <Option key={r.id} value={r.id}>
                                {r.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Vui lòng chọn title' }]}
                >
                    <Select placeholder="Chọn title" options={TITLE_OPTIONS} />
                </Form.Item>

                <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Vui lòng chọn status' }]}
                >
                    <Select options={STATUS_OPTIONS} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditUserModal;