import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Button,
  Card,
  Empty,
  List,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";

import {
  CrownOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { pmApi } from "../../../api/pm";
import { usePmProjectRealtime } from "../../../hooks/usePmProjectRealtime";

const { Text } = Typography;

interface ProjectManagerUser {
  id: string;

  fullName?: string;

  email?: string;

  title?: string;

  status?: string;

  role?: {
    id?: string;

    name?: string;
  } | null;
}

interface ProjectManagerItem {
  id: string;

  projectId: string;

  userId: string;

  managerRole: "PRIMARY" | "CO_MANAGER";

  createdAt?: string;

  user?: ProjectManagerUser;
}

interface ManagerCandidate extends ProjectManagerUser {}

interface Props {
  projectId: string;
}

export const ProjectManagersPanel: React.FC<Props> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);

  const [managers, setManagers] = useState<ProjectManagerItem[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [candidates, setCandidates] = useState<ManagerCandidate[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  const [submitting, setSubmitting] = useState(false);

  // ========================================
  // LOAD MANAGERS
  // ========================================

  const loadManagers = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      setLoading(true);

      const response = await pmApi.getProjectManagers(projectId);

      const data = response?.data?.data ?? response?.data ?? [];

      setManagers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Không load được Project Managers:", error);

      message.error("Không thể tải danh sách Project Manager.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadManagers();
  }, [loadManagers]);

  usePmProjectRealtime({
    projectId,

    onChange: async (event) => {
      if (event.entity !== "PROJECT_MANAGER") {
        return;
      }

      await loadManagers();
    },
  });
  // ========================================
  // SORT:
  // PRIMARY ALWAYS FIRST
  // ========================================

  const sortedManagers = useMemo(() => {
    return [...managers].sort((a, b) => {
      if (a.managerRole === "PRIMARY" && b.managerRole !== "PRIMARY") {
        return -1;
      }

      if (b.managerRole === "PRIMARY" && a.managerRole !== "PRIMARY") {
        return 1;
      }

      return (a.user?.fullName ?? "").localeCompare(b.user?.fullName ?? "");
    });
  }, [managers]);

  // ========================================
  // SEARCH PM CANDIDATES
  //
  // Debounce 300ms.
  // ========================================

  useEffect(() => {
    if (!isAddOpen) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await pmApi.searchProjectManagerCandidates(
          projectId,
          searchText,
        );

        const data = response?.data?.data ?? response?.data ?? [];

        setCandidates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Không tìm được PM candidates:", error);

        setCandidates([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAddOpen, projectId, searchText]);

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setSearchText("");

    setSelectedUserId(undefined);

    setCandidates([]);

    setIsAddOpen(true);
  };

  // ========================================
  // ADD CO-PM
  // ========================================

  const handleAdd = async () => {
    if (!selectedUserId) {
      message.warning("Vui lòng chọn Project Manager.");

      return;
    }

    try {
      setSubmitting(true);

      await pmApi.addProjectManager(projectId, selectedUserId);

      message.success("Đã thêm Co-PM vào Project.");

      setIsAddOpen(false);

      setSelectedUserId(undefined);

      await loadManagers();
    } catch (error: any) {
      console.error("Không thể thêm Co-PM:", error);

      const errorData = error?.response?.data;

      const code = errorData?.code ?? errorData?.error?.code;

      if (code === "PROJECT_MANAGER_ALREADY_ASSIGNED") {
        message.warning("Người này đã là Manager của Project.");

        return;
      }

      if (code === "PROJECT_MANAGER_ALREADY_PRIMARY") {
        message.warning("Người này đã là Primary PM.");

        return;
      }

      if (code === "USER_IS_NOT_PROJECT_MANAGER") {
        message.warning("User được chọn không có role Project Manager.");

        return;
      }

      message.error(errorData?.message ?? "Không thể thêm Co-PM.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // REMOVE CO-PM
  // ========================================

  const handleRemove = (manager: ProjectManagerItem) => {
    if (manager.managerRole === "PRIMARY") {
      return;
    }

    Modal.confirm({
      title: "Xóa Co-PM khỏi Project?",

      content: (
        <Space direction="vertical" size={4}>
          <Text>
            Bạn đang xóa{" "}
            <strong>{manager.user?.fullName ?? manager.userId}</strong> khỏi
            danh sách quản lý Project.
          </Text>

          <Text type="secondary">User và dữ liệu Project không bị xóa.</Text>
        </Space>
      ),

      okText: "Xóa Co-PM",

      okButtonProps: {
        danger: true,
      },

      cancelText: "Hủy",

      onOk: async () => {
        try {
          await pmApi.removeProjectManager(projectId, manager.userId);

          message.success("Đã xóa Co-PM.");

          await loadManagers();
        } catch (error: any) {
          console.error("Không thể xóa Co-PM:", error);

          const errorData = error?.response?.data;

          const code = errorData?.code ?? errorData?.error?.code;

          if (code === "PRIMARY_PM_CANNOT_REMOVE") {
            message.warning("Primary PM không thể bị xóa.");

            return;
          }

          message.error(errorData?.message ?? "Không thể xóa Co-PM.");
        }
      },
    });
  };

  return (
    <>
      <Card
        title={
          <Space>
            <TeamOutlined />

            <span>Quản lý Project</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm Co-PM
          </Button>
        }
        style={{
          marginBottom: 20,
        }}
      >
        <Spin spinning={loading}>
          {sortedManagers.length > 0 ? (
            <List
              dataSource={sortedManagers}
              renderItem={(manager) => (
                <List.Item
                  actions={
                    manager.managerRole === "CO_MANAGER"
                      ? [
                          <Button
                            key="remove"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(manager)}
                          >
                            Xóa
                          </Button>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space wrap>
                        <Text strong>{manager.user?.fullName ?? "PM"}</Text>

                        {manager.managerRole === "PRIMARY" ? (
                          <Tag color="gold" icon={<CrownOutlined />}>
                            Primary PM
                          </Tag>
                        ) : (
                          <Tag color="blue">Co-PM</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {manager.user?.email ?? manager.userId}
                        </Text>

                        {manager.user?.title && (
                          <Text type="secondary">{manager.user?.title}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            !loading && <Empty description="Project chưa có Manager" />
          )}
        </Spin>
      </Card>

      <Modal
        title="Thêm Co-PM"
        open={isAddOpen}
        onCancel={() => setIsAddOpen(false)}
        onOk={handleAdd}
        confirmLoading={submitting}
        okText="Thêm Co-PM"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Space
          direction="vertical"
          size={12}
          style={{
            width: "100%",
          }}
        >
          <Text type="secondary">
            Chỉ User có role Project Manager và chưa quản lý Project này mới
            xuất hiện.
          </Text>

          <Select
            showSearch
            value={selectedUserId}
            placeholder="Tìm theo tên hoặc email"
            filterOption={false}
            onSearch={setSearchText}
            onChange={setSelectedUserId}
            loading={searchLoading}
            style={{
              width: "100%",
            }}
            notFoundContent={
              searchLoading ? "Đang tìm..." : "Không tìm thấy PM phù hợp"
            }
            options={candidates.map((candidate) => ({
              value: candidate.id,

              label: (
                <Space direction="vertical" size={0}>
                  <Text>{candidate.fullName}</Text>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    {candidate.email}
                  </Text>
                </Space>
              ),
            }))}
          />
        </Space>
      </Modal>
    </>
  );
};
