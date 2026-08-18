import { useEffect, useState } from 'react';
import { Button, Card, message, Space, Typography } from 'antd';
import ModalCreateUserSkill from '../../components/dev/modal.user-skill';
import { callFetchSkillsWithoutPaginate } from '../../api';

const { Title, Text } = Typography;


const UserSkillPage = () => {
    const [skills, setSkills] = useState<ISkills[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const res = await callFetchSkillsWithoutPaginate();
            if (res?.data) {
                setSkills((res.data.result ?? []) as ISkills[]);
            }
        } catch (error) {
            message.error("Không thể tải danh sách skills.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);



    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card bordered={false}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                        <Title level={3} style={{ marginBottom: 4 }}>
                            User Skills
                        </Title>
                        <Text type="secondary">Quản lý kỹ năng của user.</Text>
                    </div>

                    <Button type="primary" onClick={() => setOpen(true)}>
                        + Tạo mới
                    </Button>
                </Space>
            </Card>

            <ModalCreateUserSkill
                skills={skills}
                open={open}
                onCancel={() => setOpen(false)}
                onSuccess={() => setOpen(false)}
            />
        </Space>
    );
};

export default UserSkillPage;