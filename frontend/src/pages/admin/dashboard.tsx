import { Avatar, Breadcrumb, Card, Col, Flex, List, Row, Spin, Statistic, Tag, Typography } from 'antd';
import {
    TeamOutlined,
    SafetyOutlined,
    KeyOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { callCountUsers, callCountRoles, callCountPermissions, callCountDisableAccount } from '../../api';

const { Title } = Typography;

const activityData = [
    {
        color: '#e6f4ff',
        icon: <TeamOutlined style={{ color: '#1677ff' }} />,
        content: <>User John Doe updated role <Link to="/admin/roles">'Developer'</Link></>,
        time: '2 hours ago',
    },
    {
        color: '#f6ffed',
        icon: <SafetyOutlined style={{ color: '#52c41a' }} />,
        content: <>New permission added to <Link to="/admin/roles">'Admin'</Link></>,
        time: '4 hours ago',
    },
    {
        color: '#fff2f0',
        icon: <TeamOutlined style={{ color: '#ff4d4f' }} />,
        content: <>User Jane Smith was deactivated.</>,
        time: 'Yesterday',
    },
];

const DashboardPage = () => {
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [totalRoles, setTotalRoles] = useState<number>(0);
    const [totalPermissions, setTotalPermissions] = useState<number>(0);
    const [totalDisableAccount, setDisableAccount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        Promise.all([
            callCountUsers(),
            callCountRoles(),
            callCountPermissions(),
            callCountDisableAccount(),
        ])
            .then(([resUsers, resRoles, resPermissions, resDisableAccount]: any[]) => {
                if (resUsers?.data?.total !== undefined) setTotalUsers(resUsers.data.total);
                if (resRoles?.data?.total !== undefined) setTotalRoles(resRoles.data.total);
                if (resPermissions?.data?.total !== undefined) setTotalPermissions(resPermissions.data.total);
                if (resDisableAccount?.data?.total !== undefined) setDisableAccount(resDisableAccount.data.total);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Breadcrumb
                items={[{ title: <Link to="/admin">Home</Link> }, { title: 'Dashboard' }]}
                style={{ marginBottom: 8 }}
            />
            <Title level={2} style={{ marginTop: 0, marginBottom: 24 }}>
                Dashboard
            </Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Flex justify="space-between" align="flex-start">
                            <div
                                style={{
                                    width: 40, height: 40, borderRadius: 8,
                                    background: '#e6f4ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <TeamOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                            </div>
                        </Flex>
                        {loading ? (
                            <Spin size="small" style={{ marginTop: 16, display: 'block' }} />
                        ) : (
                            <Statistic
                                title={<span style={{ letterSpacing: 0.5 }}>TOTAL USERS</span>}
                                value={totalUsers}
                                valueStyle={{ fontWeight: 600 }}
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Flex justify="space-between" align="flex-start">
                            <div
                                style={{
                                    width: 40, height: 40, borderRadius: 8,
                                    background: '#e6f4ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <SafetyOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                            </div>
                            <Tag color="success" bordered={false}></Tag>
                        </Flex>
                        {loading ? (
                            <Spin size="small" style={{ marginTop: 16, display: 'block' }} />
                        ) : (
                            <Statistic
                                title={<span style={{ letterSpacing: 0.5 }}>TOTAL ROLES</span>}
                                value={totalRoles}
                                valueStyle={{ fontWeight: 600 }}
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Flex justify="space-between" align="flex-start">
                            <div
                                style={{
                                    width: 40, height: 40, borderRadius: 8,
                                    background: '#e6f4ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <KeyOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                            </div>
                        </Flex>
                        {loading ? (
                            <Spin size="small" style={{ marginTop: 16, display: 'block' }} />
                        ) : (
                            <Statistic
                                title={<span style={{ letterSpacing: 0.5 }}>TOTAL PERMISSIONS</span>}
                                value={totalPermissions}
                                valueStyle={{ fontWeight: 600 }}
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                       <Card>
                        <Flex justify="space-between" align="flex-start">
                            <div
                                style={{
                                    width: 40, height: 40, borderRadius: 8,
                                    background: '#e6f4ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <LockOutlined style={{ color: '#ff1616', fontSize: 18 }} />
                            </div>
                        </Flex>
                        {loading ? (
                            <Spin size="small" style={{ marginTop: 16, display: 'block' }} />
                        ) : (
                            <Statistic
                                title={<span style={{ letterSpacing: 0.5 }}>TOTAL DISABLE ACCOUNT</span>}
                                value={totalDisableAccount}
                                valueStyle={{ fontWeight: 600 }}
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <Card
                style={{ marginTop: 16 }}
                title="Recent Activity"
                extra={<Link to="/admin/users">View All</Link>}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={activityData}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar style={{ background: item.color }} icon={item.icon} />}
                                title={item.content}
                                description={item.time}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </>
    );
};

export default DashboardPage;