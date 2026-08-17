import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Progress,
    Space,
    Tag,
    Timeline,
    Button,
} from 'antd';
import {
    CodeOutlined,
    BugOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ArrowUpOutlined,
    GithubOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ColumnsType } from 'antd/es/table';

interface TaskItem {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    progress: number;
}

interface ProjectItem {
    id: string;
    name: string;
    status: string;
    progress: number;
    tasksCompleted: number;
    totalTasks: number;
    team: number;
}

interface CodeMetrics {
    date: string;
    commits: number;
    pullRequests: number;
    codeReview: number;
}

interface ActivityItem {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: string;
}

const DashBoardDev = () => {
    // Mock data for code metrics
    const codeMetricsData: CodeMetrics[] = [
        { date: 'Mon', commits: 12, pullRequests: 3, codeReview: 2 },
        { date: 'Tue', commits: 19, pullRequests: 5, codeReview: 4 },
        { date: 'Wed', commits: 15, pullRequests: 4, codeReview: 3 },
        { date: 'Thu', commits: 22, pullRequests: 6, codeReview: 5 },
        { date: 'Fri', commits: 18, pullRequests: 4, codeReview: 3 },
        { date: 'Sat', commits: 8, pullRequests: 2, codeReview: 1 },
        { date: 'Sun', commits: 5, pullRequests: 1, codeReview: 1 },
    ];

    // Mock data for tasks
    const tasksData: TaskItem[] = [
        {
            id: '1',
            title: 'Implement user authentication module',
            status: 'In Progress',
            priority: 'High',
            dueDate: '2024-08-20',
            progress: 75,
        },
        {
            id: '2',
            title: 'Fix dashboard performance issues',
            status: 'In Progress',
            priority: 'High',
            dueDate: '2024-08-18',
            progress: 60,
        },
        {
            id: '3',
            title: 'Refactor API service layer',
            status: 'Not Started',
            priority: 'Medium',
            dueDate: '2024-08-25',
            progress: 0,
        },
        {
            id: '4',
            title: 'Write unit tests for components',
            status: 'In Progress',
            priority: 'Medium',
            dueDate: '2024-08-22',
            progress: 45,
        },
        {
            id: '5',
            title: 'Update documentation',
            status: 'Completed',
            priority: 'Low',
            dueDate: '2024-08-15',
            progress: 100,
        },
    ];

    // Mock data for projects
    const projectsData: ProjectItem[] = [
        {
            id: '1',
            name: 'F-Corp Portal',
            status: 'Active',
            progress: 85,
            tasksCompleted: 42,
            totalTasks: 50,
            team: 5,
        },
        {
            id: '2',
            name: 'Mobile App',
            status: 'Active',
            progress: 60,
            tasksCompleted: 30,
            totalTasks: 50,
            team: 3,
        },
        {
            id: '3',
            name: 'API Gateway',
            status: 'Planning',
            progress: 20,
            tasksCompleted: 5,
            totalTasks: 25,
            team: 2,
        },
    ];

    // Mock data for activities
    const activitiesData: ActivityItem[] = [
        {
            id: '1',
            title: 'Pushed code to main branch',
            description: 'Completed authentication module implementation',
            timestamp: '2 hours ago',
            type: 'push',
        },
        {
            id: '2',
            title: 'Created pull request',
            description: 'PR #234 - Dashboard performance improvements',
            timestamp: '4 hours ago',
            type: 'pr',
        },
        {
            id: '3',
            title: 'Code review completed',
            description: 'Approved PR #232 for API refactoring',
            timestamp: '6 hours ago',
            type: 'review',
        },
        {
            id: '4',
            title: 'Task assigned',
            description: 'New task: Implement notification system',
            timestamp: '1 day ago',
            type: 'task',
        },
    ];

    // Bug statistics
    const bugStats = [
        { name: 'Critical', value: 2, fill: '#ff4d4f' },
        { name: 'High', value: 5, fill: '#ff7a45' },
        { name: 'Medium', value: 12, fill: '#ffa940' },
        { name: 'Low', value: 8, fill: '#faad14' },
    ];

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'Completed': 'green',
            'In Progress': 'blue',
            'Not Started': 'default',
            'Active': 'green',
            'Planning': 'orange',
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority: string) => {
        const colors: { [key: string]: string } = {
            'High': 'red',
            'Medium': 'orange',
            'Low': 'green',
        };
        return colors[priority] || 'default';
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'push':
                return <GithubOutlined style={{ color: '#1f6feb' }} />;
            case 'pr':
                return <CodeOutlined style={{ color: '#28a745' }} />;
            case 'review':
                return <CheckCircleOutlined style={{ color: '#6f42c1' }} />;
            case 'task':
                return <ClockCircleOutlined style={{ color: '#fd7e14' }} />;
            default:
                return <CodeOutlined />;
        }
    };

    const tasksColumns: ColumnsType<TaskItem> = [
        {
            title: 'Task',
            dataIndex: 'title',
            key: 'title',
            width: '35%',
            render: (text) => <span className="font-semibold">{text}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '15%',
            render: (status) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
            ),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: '12%',
            render: (priority) => (
                <Tag color={getPriorityColor(priority)}>{priority}</Tag>
            ),
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            width: '18%',
            render: (progress) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Progress percent={progress} size="small" />
                    <span style={{ minWidth: '30px' }}>{progress}%</span>
                </div>
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: '15%',
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
    ];

    const projectColumns: ColumnsType<ProjectItem> = [
        {
            title: 'Project Name',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (text) => <span className="font-semibold">{text}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '15%',
            render: (status) => (
                <Tag color={getStatusColor(status)}>{status}</Tag>
            ),
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            width: '20%',
            render: (progress) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Progress percent={progress} size="small" />
                    <span style={{ minWidth: '30px' }}>{progress}%</span>
                </div>
            ),
        },
        {
            title: 'Tasks',
            dataIndex: 'tasksCompleted',
            key: 'tasks',
            width: '15%',
            render: (_, record) => `${record.tasksCompleted}/${record.totalTasks}`,
        },
        {
            title: 'Team',
            dataIndex: 'team',
            key: 'team',
            width: '10%',
            render: (team) => (
                <Tag icon={<CodeOutlined />} color="cyan">{team} members</Tag>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Statistics Row */}
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title="Total Commits"
                            value={99}
                            prefix={<ArrowUpOutlined />}
                            suffix="this week"
                            valueStyle={{ color: '#1f6feb' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title="Active Pull Requests"
                            value={12}
                            prefix={<CodeOutlined />}
                            valueStyle={{ color: '#28a745' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title="Code Reviews"
                            value={8}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#6f42c1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable>
                        <Statistic
                            title="Bugs Reported"
                            value={27}
                            prefix={<BugOutlined />}
                            valueStyle={{ color: '#fd7e14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={16}>
                <Col xs={24} lg={16}>
                    <Card title="Weekly Activity" hoverable>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={codeMetricsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="commits" stroke="#1f6feb" strokeWidth={2} />
                                <Line type="monotone" dataKey="pullRequests" stroke="#28a745" strokeWidth={2} />
                                <Line type="monotone" dataKey="codeReview" stroke="#6f42c1" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Bug Distribution" hoverable>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={bugStats}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {bugStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Tasks and Projects Row */}
            <Row gutter={16}>
                <Col xs={24}>
                    <Card title="Assigned Tasks" extra={<Button type="primary">View All</Button>} hoverable>
                        <Table
                            columns={tasksColumns}
                            dataSource={tasksData}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 800 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Projects Row */}
            <Row gutter={16}>
                <Col xs={24}>
                    <Card title="My Projects" extra={<Button type="primary">View All</Button>} hoverable>
                        <Table
                            columns={projectColumns}
                            dataSource={projectsData}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 800 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Activity Timeline Row */}
            <Row gutter={16}>
                <Col xs={24} lg={12}>
                    <Card title="Recent Activity" hoverable>
                        <Timeline
                            items={activitiesData.map((activity) => ({
                                color: activity.type === 'push' ? 'blue' : activity.type === 'pr' ? 'green' : activity.type === 'review' ? 'purple' : 'orange',
                                dot: getActivityIcon(activity.type),
                                children: (
                                    <div>
                                        <p style={{ marginBottom: '4px' }} className="font-semibold">
                                            {activity.title}
                                        </p>
                                        <p style={{ marginBottom: '8px', color: '#999' }}>
                                            {activity.description}
                                        </p>
                                        <span style={{ fontSize: '12px', color: '#bbb' }}>
                                            {activity.timestamp}
                                        </span>
                                    </div>
                                ),
                            }))}
                        />
                    </Card>
                </Col>

                {/* Quick Actions */}
                <Col xs={24} lg={12}>
                    <Card title="Quick Actions" hoverable>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Button type="primary" block size="large">
                                Create New Pull Request
                            </Button>
                            <Button block size="large">
                                Start New Sprint
                            </Button>
                            <Button block size="large">
                                Review Code
                            </Button>
                            <Button block size="large">
                                Report Bug
                            </Button>
                            <Button block size="large">
                                View Documentation
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashBoardDev;