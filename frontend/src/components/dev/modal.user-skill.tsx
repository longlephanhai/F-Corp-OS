import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateUserSkill } from '../../api';

type EvidenceType = 'CERTIFICATE' | 'PROJECT_LINK';

interface UserSkillEvidenceForm {
    type: EvidenceType;
    title: string;
    url: string;
    description: string;
}

export interface UserSkillFormData {
    skillId: string;
    description: string;
    years: number;
    evidences: UserSkillEvidenceForm[];
}

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (data: UserSkillFormData) => void;
    skills: ISkills[];
}

const evidenceTypeOptions = [
    { label: 'CERTIFICATE', value: 'CERTIFICATE' },
    { label: 'PROJECT_LINK', value: 'PROJECT_LINK' },
    { label: 'ASSESSMENT', value: 'ASSESSMENT' },
    { label: 'WORK_HISTORY', value: 'WORK_HISTORY' },
    { label: 'OTHER', value: 'OTHER' },
];

const ModalCreateUserSkill = ({ open, onCancel, onSuccess, skills }: Props) => {
    const [form] = Form.useForm<UserSkillFormData>();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload: UserSkillFormData = {
                skillId: values.skillId,
                description: values.description,
                years: values.years,
                evidences: values.evidences ?? [],
            };

            const response = await callCreateUserSkill(payload.skillId, payload.description, payload.years, payload.evidences);
            if (response && response.data) {
                message.success('Đã tạo form user skill');
                onSuccess?.(payload);
                form.resetFields();
            }
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Tạo User Skill"
            open={open}
            onOk={handleSubmit}
            onCancel={handleClose}
            okText="Tạo"
            cancelText="Hủy"
            confirmLoading={submitting}
            width={860}
        >
            <Form form={form} layout="vertical" autoComplete="off" initialValues={{ years: 1, evidences: [{ type: 'CERTIFICATE' }] }}>
                <Form.Item
                    label="Skill"
                    name="skillId"
                    rules={[{ required: true, message: 'Vui lòng nhập skillId' }]}
                >
                    <Select placeholder="Chọn skill" allowClear>
                        {skills.map((skill) => (
                            <Select.Option key={skill.id} value={skill.id}>
                                {skill.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mô tả' },
                        { max: 1000, message: 'Mô tả không được vượt quá 1000 ký tự' },
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Thành thạo lập trình Backend với NestJS, TypeORM và Microservices"
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Số năm kinh nghiệm"
                    name="years"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số năm kinh nghiệm' },
                        { type: 'number', min: 0, message: 'Số năm kinh nghiệm phải lớn hơn hoặc bằng 0' },
                    ]}
                >
                    <InputNumber
                        min={0}
                        step={0.5}
                        precision={1}
                        style={{ width: '100%' }}
                        placeholder="3.5"
                    />
                </Form.Item>

                <Form.List name="evidences">
                    {(fields, { add, remove }) => (
                        <Space direction="vertical" style={{ width: '100%' }} size={16}>
                            {fields.map((field, index) => (
                                <div
                                    key={field.key}
                                    style={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 8,
                                        padding: 16,
                                        background: '#fafafa',
                                    }}
                                >
                                    <Space
                                        align="start"
                                        style={{ width: '100%', justifyContent: 'space-between' }}
                                    >
                                        <strong>Bằng chứng {index + 1}</strong>
                                        {fields.length > 1 && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<MinusCircleOutlined />}
                                                onClick={() => remove(field.name)}
                                            >
                                                Xóa
                                            </Button>
                                        )}
                                    </Space>

                                    <Form.Item
                                        label="Loại"
                                        name={[field.name, 'type']}
                                        rules={[{ required: true, message: 'Vui lòng chọn loại bằng chứng' }]}
                                    >
                                        <Select options={evidenceTypeOptions} placeholder="Chọn loại" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Tiêu đề"
                                        name={[field.name, 'title']}
                                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                                    >
                                        <Input placeholder="AWS Certified Solutions Architect – Associate" allowClear />
                                    </Form.Item>

                                    <Form.Item
                                        label="URL"
                                        name={[field.name, 'url']}
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập URL' },
                                            { type: 'url', message: 'URL không hợp lệ' },
                                        ]}
                                    >
                                        <Input placeholder="https://www.credly.com/..." allowClear />
                                    </Form.Item>

                                    <Form.Item
                                        label="Mô tả"
                                        name={[field.name, 'description']}
                                        rules={[{ required: true, message: 'Vui lòng nhập mô tả bằng chứng' }]}
                                    >
                                        <Input.TextArea
                                            rows={3}
                                            placeholder="Chứng chỉ AWS Architect cấp tháng 01/2025"
                                            allowClear
                                        />
                                    </Form.Item>
                                </div>
                            ))}

                            <Button
                                type="dashed"
                                block
                                icon={<PlusOutlined />}
                                onClick={() => add({ type: 'CERTIFICATE' })}
                            >
                                Thêm bằng chứng
                            </Button>
                        </Space>
                    )}
                </Form.List>
            </Form>
        </Modal>
    );
};

export default ModalCreateUserSkill;