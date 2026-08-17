import React, { useState } from 'react';
import { 
    Button, Table, Tag, Progress, Avatar, Modal, Form, 
    Input, DatePicker, Space, Typography, Card, Divider, Flex, Tooltip 
} from 'antd';
import { 
    PlusOutlined, UserOutlined, CalendarOutlined, 
    DollarOutlined, SettingOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    // Dữ liệu giả lập cho Bảng
    const sprints = [
        {
            id: 'SP-1012',
            name: 'Sprint 12 - API Layer',
            timeline: 'Oct 1 - Oct 14',
            status: 'completed',
            progress: 100,
            members: 4
        },
        {
            id: 'SP-1013',
            name: 'Sprint 13 - Database Auth',
            timeline: 'Oct 15 - Oct 28',
            status: 'active',
            progress: 45,
            members: 3
        }
    ];

    // Cấu hình Cột cho Ant Design Table
    const columns = [
        {
            title: 'CHI TIẾT SPRINT',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '15px' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
                </Space>
            ),
        },
        {
            title: 'THỜI GIAN',
            dataIndex: 'timeline',
            key: 'timeline',
            render: (text: string) => <Text type="secondary">{text}</Text>,
        },
        {
            title: 'TRẠNG THÁI',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color = status === 'completed' ? 'default' : 'processing';
                const label = status === 'completed' ? 'Đã hoàn thành' : 'Đang chạy';
                return <Tag color={color}>{label.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'TIẾN ĐỘ',
            dataIndex: 'progress',
            key: 'progress',
            width: 200,
            render: (percent: number) => (
                <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
            ),
        },
        {
            title: 'NHÂN SỰ',
            key: 'team',
            render: (_: any, record: any) => (
                <Avatar.Group maxCount={3} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" />
                    {record.members > 2 && <Avatar style={{ backgroundColor: '#1677ff' }}>+{record.members - 2}</Avatar>}
                </Avatar.Group>
            ),
        },
        {
            title: 'THAO TÁC',
            key: 'action',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Button 
                    type="default" 
                    icon={<SettingOutlined />}
                    onClick={() => navigate(`/pm/sprints/${record.id}`)}
                >
                    Quản lý Task
                </Button>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* --- SECTION 1: HEADER (COMMAND CENTER) --- */}
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
                <Flex justify="space-between" align="flex-start">
                    <Space direction="vertical" size="small">
                        <Space align="center" size="middle">
                            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>Alpha Cloud Migration</Title>
                            <Tag color="success" style={{ fontWeight: 'bold' }}>ACTIVE</Tag>
                        </Space>
                        
                        <Space size="large" style={{ color: '#6b7280', marginTop: '8px' }}>
                            <Space><UserOutlined /> <Text type="secondary">PM: Khanh Nguyễn</Text></Space>
                            <Space><CalendarOutlined /> <Text type="secondary">Oct 1 - Dec 31, 2026</Text></Space>
                            <Space><DollarOutlined /> <Text type="secondary">Ngân sách: $250k</Text></Space>
                        </Space>
                    </Space>
                    
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsModalOpen(true)}
                    >
                        Tạo Sprint Mới
                    </Button>
                </Flex>

                <Divider style={{ margin: '20px 0' }} />

                <div>
                    <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                        <Text strong type="secondary" style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                            Tiến độ tổng thể dự án
                        </Text>
                        <Title level={4} style={{ margin: 0, color: '#1677ff' }}>65%</Title>
                    </Flex>
                    <Progress percent={65} showInfo={false} size={['100%', 12]} strokeColor="#1677ff" />
                </div>
            </Card>

            {/* --- SECTION 2: BẢNG DANH SÁCH SPRINT --- */}
            <Card 
                title={<Title level={4} style={{ margin: 0 }}>Lộ trình Sprint (Roadmap)</Title>} 
                bordered={false} 
                style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
                bodyStyle={{ padding: 0 }} // Bỏ padding để bảng full viền
            >
                <Table 
                    columns={columns} 
                    dataSource={sprints} 
                    rowKey="id" 
                    pagination={false}
                />
            </Card>

            {/* --- SECTION 3: MODAL TẠO SPRINT MỚI --- */}
            <Modal
                title={<Title level={3} style={{ margin: 0 }}>Khởi tạo Sprint Mới</Title>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                width={700}
                footer={[
                    <Button key="back" onClick={() => setIsModalOpen(false)}>
                        Hủy bỏ
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => form.submit()}>
                        Chốt Tạo Sprint
                    </Button>,
                ]}
                destroyOnClose
            >
                <div style={{ marginBottom: '24px', color: '#6b7280' }}>
                    Xác định phạm vi, thời gian và phân bổ tài nguyên cho chặng tiếp theo.
                </div>
                
                <Form form={form} layout="vertical" onFinish={(values) => console.log(values)}>
                    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                        <Flex gap="middle">
                            <Form.Item 
                                name="name" 
                                label="Tên Sprint" 
                                style={{ flex: 2 }}
                                rules={[{ required: true, message: 'Vui lòng nhập tên Sprint!' }]}
                            >
                                <Input placeholder="Ví dụ: Frontend Refactor Phase 1" size="large" />
                            </Form.Item>
                            
                            <Form.Item label="Mã Sprint ID" style={{ flex: 1 }}>
                                <Input value="SP-1015" disabled size="large" />
                            </Form.Item>
                        </Flex>

                        <Form.Item 
                            name="dateRange" 
                            label="Thời gian diễn ra" 
                            rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
                        >
                            <RangePicker size="large" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item name="goal" label="Mục tiêu Sprint (Sprint Goal)">
                            <Input.TextArea 
                                rows={4} 
                                placeholder="Nhập mục tiêu và kết quả kỳ vọng của Sprint này..." 
                            />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>
        </div>
    );
};