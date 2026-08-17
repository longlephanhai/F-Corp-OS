import { useState } from 'react';
import { Form, Input, Modal, message } from 'antd';
import { callCreateSkill } from '../../api';

interface IProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (skill: any) => void;
}

interface ISkillFormData {
    name: string;
    description: string;
}

export const ModalCreateSkill = ({ open, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const handleOk = async (value: ISkillFormData) => {
        try {
            const response = await callCreateSkill(value);
            if (response && response.data) {
                message.success('Tạo Skill thành công');
                form.resetFields();
                onCancel();
                if (onSuccess) {
                    onSuccess(response.data);
                }
            }
            setSubmitting(false);
        } catch (error) {
            message.error('Có lỗi xảy ra khi tạo Skill');
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Tạo mới Skill"
            open={open}
            onOk={() => handleOk(form.getFieldsValue() as ISkillFormData)}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Tạo"
            cancelText="Hủy"
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    label="Tên Skill"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập tên Skill',
                        },
                        {
                            max: 100,
                            message: 'Tên Skill không được vượt quá 100 ký tự',
                        },
                    ]}
                >
                    <Input
                        placeholder="Ví dụ: Linux / Bash Shell"
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập mô tả Skill',
                        },
                        {
                            max: 500,
                            message: 'Mô tả không được vượt quá 500 ký tự',
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder="Ví dụ: Command-line interface and Unix shell scripting for managing systems, automation, and deployment environments."
                        rows={4}
                        allowClear
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateSkill;