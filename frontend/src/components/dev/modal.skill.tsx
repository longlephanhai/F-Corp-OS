import { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, message } from 'antd';
import { callCreateSkill, callFetchSkillsWithoutPaginate } from '../../api';

interface IProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (skill: any) => void;
}

interface ISkillFormData {
    name: string;
    description: string;
    parentId?: string | null;
}

export const ModalCreateSkill = ({ open, onCancel, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [skills, setSkills] = useState<ISkills[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);

    // Fetch danh sách skills để chọn làm parent
    useEffect(() => {
        if (open) {
            const fetchSkills = async () => {
                setLoadingSkills(true);
                try {
                    const res = await callFetchSkillsWithoutPaginate();
                    setSkills(res.data?.result ?? []);
                } catch {
                    // ignore
                } finally {
                    setLoadingSkills(false);
                }
            };
            fetchSkills();
        }
    }, [open]);

    const handleOk = async (value: ISkillFormData) => {
        setSubmitting(true);
        try {
            const payload = {
                ...value,
                parentId: value.parentId ?? null,
            };
            const response = await callCreateSkill(payload);
            if (response && response.data) {
                message.success('Tạo Skill thành công');
                form.resetFields();
                onCancel();
                if (onSuccess) {
                    onSuccess(response.data);
                }
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi tạo Skill');
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
            title="Tạo mới Skill"
            open={open}
            onOk={() => form.submit()}
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
                onFinish={handleOk}
            >
                <Form.Item
                    label="Tên Skill"
                    name="name"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên Skill' },
                        { max: 100, message: 'Tên Skill không được vượt quá 100 ký tự' },
                    ]}
                >
                    <Input placeholder="Ví dụ: Linux / Bash Shell" allowClear />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mô tả Skill' },
                        { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' },
                    ]}
                >
                    <Input.TextArea
                        placeholder="Ví dụ: Command-line interface and Unix shell scripting..."
                        rows={4}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    label="Skill cha (Parent Skill)"
                    name="parentId"
                    tooltip="Để trống nếu đây là skill gốc. Chọn skill cha nếu muốn skill này là một nhánh con trong cây kỹ năng."
                >
                    <Select
                        placeholder="Chọn skill cha (tuỳ chọn)"
                        allowClear
                        showSearch
                        loading={loadingSkills}
                        optionFilterProp="label"
                        options={skills.map((s) => ({ value: s.id, label: s.name }))}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateSkill;