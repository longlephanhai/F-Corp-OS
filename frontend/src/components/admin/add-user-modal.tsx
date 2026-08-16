import { useState } from 'react';
import { Form, Input, Modal, Select, message } from 'antd';
import { callCreateUser } from '../../api';
import { generateEmailFromFullName } from '../../utils/generateEmail';

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

const DEFAULT_PASSWORD = '123456';

interface IRole {
    id: string;
    name: string;
}

interface IProps {
    open: boolean;
    roles: IRole[];
    onCancel: () => void;
    onSuccess: () => void;
}

const AddUserModal = ({ open, roles, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    
    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fullName = e.target.value;
        if (fullName?.trim()) {
            form.setFieldValue('email', generateEmailFromFullName(fullName));
        } else {
            form.setFieldValue('email', '');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload = { ...values, password: DEFAULT_PASSWORD };
            const res: any = await callCreateUser(payload);

            if (res?.data) {
                message.success('Tạo user thành công');
                form.resetFields();
                onSuccess();
            } else {
                message.error(res?.message || 'Có lỗi xảy ra khi tạo user');
            }
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || 'Có lỗi xảy ra khi tạo user');
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
            title="Thêm mới User"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Tạo mới"
            cancelText="Huỷ"
            width={560}
        >
            <Form form={form} layout="vertical" initialValues={{ status: 'AVAILABLE' }}>
                <Form.Item
                    label="Họ tên"
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input placeholder="Nguyễn Văn A" onChange={handleFullNameChange} />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Email được tự sinh từ họ tên' },
                        { type: 'email', message: 'Email không đúng định dạng' },
                    ]}
                >
                    <Input placeholder="Tự động điền sau khi nhập họ tên" />
                </Form.Item>

                <Form.Item label="Mật khẩu">
                    <Input.Password value={DEFAULT_PASSWORD} disabled />
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

                <Form.Item label="Status" name="status">
                    <Select options={STATUS_OPTIONS} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddUserModal;