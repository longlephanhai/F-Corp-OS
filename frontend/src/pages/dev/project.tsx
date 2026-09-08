import { useEffect, useState } from "react";
import { Table, Tag, Typography, Button } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { callFetchUserSprintProjects } from "../../api";
import { ProjectChatDrawer } from "../../components/pm/ProjectChatDrawer";
import type { ProjectItem } from "../../common/types/pm";

const { Title } = Typography;

const UserPorjectPage = () => {

  const [data, setData] = useState<{ projects: any[], sprints: any[] }>({ projects: [], sprints: [] });
  const [loading, setLoading] = useState(false);

  const [chatProject, setChatProject] = useState<ProjectItem | null>(null);

  const fetchUserSprintProjects = async () => {
    setLoading(true);
    try {
      const response = await callFetchUserSprintProjects();
      if (response && response.data) {
        setData({
          projects: response.data.projects || [],
          sprints: response.data.sprints || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserSprintProjects();
  }, [])

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'active' ? 'green' : 'geekblue';
        return status ? <Tag color={color}>{status.toUpperCase()}</Tag> : null;
      },
    },
    {
      title: 'Chat',
      key: 'chat',
      render: (_: any, record: ProjectItem) => (
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          onClick={() => setChatProject(record)}
        />
      ),
    }
  ];

  const sprintColumns = [
    {
      title: 'Sprint Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'Attendant',
      dataIndex: 'attendant',
      key: 'attendant',
      render: (attendants: string[]) => (
        <>
          {attendants?.map(attendant => (
            <Tag color="blue" key={attendant}>
              {attendant}
            </Tag>
          ))}
        </>
      ),
    },
  ];

  const expandedRowRender = (record: any) => {
    const projectSprints = data.sprints.filter(sprint => sprint.projectId === record.id);
    return <Table columns={sprintColumns} dataSource={projectSprints} pagination={false} rowKey="id" />;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Projects & Sprints</Title>
      <Table
        columns={projectColumns}
        dataSource={data.projects}
        rowKey="id"
        expandable={{ expandedRowRender }}
        loading={loading}
      />

      {chatProject && (
        <ProjectChatDrawer
          open={!!chatProject}
          onClose={() => setChatProject(null)}
          projectId={chatProject.id}
          projectName={chatProject.name}
        />
      )}

    </div>
  );
};

export default UserPorjectPage;