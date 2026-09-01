import axios from "../config/interceptor";
import type {
  ProjectItem,
  TaskCandidate,
  TaskItem,
  TeamMember,
  UserSprintItem,
} from "../common/types/pm";

export const pmApi = {
  // Lấy danh sách nhân sự tham gia Sprint
  getSprintUsers: (sprintId: string) => {
    return axios.get<IBackendRes<UserSprintItem[]>>(
      `/user-sprint/sprint/${sprintId}`,
    );
  },

  getUserCapacity: (userId: string, sprintId: string) => {
    return axios.get<IBackendRes<any>>(`/user-sprint/capacity/${userId}`, {
      params: {
        sprintId,
      },
    });
  },

  // PM gửi yêu cầu gán nhân sự vào Sprint
  assignUserToSprint: (sprintId: string, userId: string, percitant: number) => {
    return axios.post<IBackendRes<UserSprintItem>>("/user-sprint", {
      sprintId,
      userId,
      percitant,
    });
  },

  // phan ben rì suột
  getResourcePlanner: () => {
    return axios.get<IBackendRes<any>>("/user-sprint/resource-planner");
  },

  // Duyệt hoặc đổi trạng thái (assigned / released)
  updateUserSprintStatus: (id: string, status: string) => {
    return axios.patch<IBackendRes<UserSprintItem>>(`/user-sprint/${id}`, {
      status,
    });
  },

  // Lấy tất cả Task của Sprint theo sprintId
  getSprintTasks: (sprintId: string) => {
    return axios.get<IBackendRes<TaskItem[]>>(`/tasks/sprint/${sprintId}`);
  },

  submitAllocationForApproval: (id: string) => {
    return axios.patch<IBackendRes<UserSprintItem>>(
      `/user-sprint/${id}/submit-approval`,
    );
  },

  cancelAllocationRequest: (id: string) => {
    return axios.delete<
      IBackendRes<{
        success: boolean;
        id: string;
      }>
    >(`/user-sprint/${id}/request`);
  },

  getSprintCompletionReadiness: (sprintId: string) => {
    return axios.get<IBackendRes<any>>(
      `/sprints/${sprintId}/completion-readiness`,
    );
  },
  getTaskCandidates: (taskId: string) => {
    return axios.get<IBackendRes<TaskCandidate[]>>(
      `/tasks/${taskId}/candidates`,
    );
  },

  // Tạo Task và gán kĩ năng yêu cầu (Required Skills JSON)
  createTask: (data: Partial<TaskItem>) => {
    return axios.post<IBackendRes<TaskItem>>("/tasks", data);
  },

  updateTask: (
    taskId: string,
    data: {
      title?: string;

      description?: string | null;

      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

      budgetRate?: number | null;

      startDate?: string;

      endDate?: string;

      requiredSkills?: Array<{
        skill_id: string;

        min_level: number;

        weight: number;
      }>;
    },
  ) => {
    return axios.patch<IBackendRes<TaskItem>>(`/tasks/${taskId}`, data);
  },
  updateTaskTimeline: (
    taskId: string,
    data: {
      startDate?: string;
      endDate?: string;
    },
  ) => {
    return axios.patch<IBackendRes<TaskItem>>(
      `/tasks/${taskId}/timeline`,
      data,
    );
  },

  updateTaskLifecycle: (
    taskId: string,
    data: {
      status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

      progress?: number;
    },
  ) => {
    return axios.patch<IBackendRes<TaskItem>>(
      `/tasks/${taskId}/lifecycle`,
      data,
    );
  },
  updateTaskAssignee: (taskId: string, userId: string | null) => {
    return axios.patch<IBackendRes<TaskItem>>(`/tasks/${taskId}/assignee`, {
      userId,
    });
  },

  deleteTask: (taskId: string) => {
    return axios.delete<
      IBackendRes<{
        success: boolean;

        id: string;

        message: string;
      }>
    >(`/tasks/${taskId}`);
  },
  getTaskCarryOverHistory: (taskId: string) => {
    return axios.get<IBackendRes<any>>(`/tasks/${taskId}/carry-over-history`);
  },
  carryOverTask: (
    taskId: string,
    data: {
      targetSprintId: string;

      startDate: string;

      endDate: string;
    },
  ) => {
    return axios.post<IBackendRes<any>>(`/tasks/${taskId}/carry-over`, data);
  },
  // Giải phóng nhân sự kèm Đánh giá (Review)
  releaseUserSprint: (id: string, reviewData: any) => {
    return axios.patch<IBackendRes<any>>(
      `/user-sprint/${id}/release`,
      reviewData,
    );
  },

  getMyTeam: () => {
    return axios.get<IBackendRes<TeamMember[]>>("/users/pm/my-team");
  },

  // 2. Duyệt hoặc Từ chối Bằng chứng kỹ năng (Thêm mới)
  verifyEvidence: (
    id: string,
    data: { status: "verified" | "rejected"; rejectReason?: string },
  ) => {
    return axios.patch<IBackendRes<any>>(`/skill-evidences/${id}/verify`, data);
  },

  getProjects: () => {
    return axios.get<IBackendRes<ProjectItem[]>>("/projects");
  },

  // Tạo Dự án mới
  createProject: (data: Partial<ProjectItem>) => {
    return axios.post<IBackendRes<ProjectItem>>("/projects", data);
  },

  getProjectById: (id: string) => {
    return axios.get<IBackendRes<any>>(`/projects/${id}`);
  },

  getProjectManagers: (projectId: string) =>
    axios.get<IBackendRes<any[]>>(`/projects/${projectId}/managers`),

  searchProjectManagerCandidates: (projectId: string, search = "") =>
    axios.get<IBackendRes<any[]>>(`/projects/${projectId}/manager-candidates`, {
      params: {
        search,
      },
    }),

  addProjectManager: (projectId: string, userId: string) =>
    axios.post<IBackendRes<any[]>>(`/projects/${projectId}/managers`, {
      userId,
    }),

  removeProjectManager: (projectId: string, userId: string) =>
    axios.delete<IBackendRes<any>>(`/projects/${projectId}/managers/${userId}`),

  // Lấy toàn bộ Sprint của 1 Dự án
  getSprintsByProject: (projectId: string) => {
    return axios.get<IBackendRes<any[]>>(`/sprints/project/${projectId}`);
  },
  getSprintById: (sprintId: string) => {
    return axios.get<IBackendRes<any>>(`/sprints/${sprintId}`);
  },

  // Khởi tạo Sprint mới (Có truyền mảng attendant)
  createSprint: (data: any) => {
    return axios.post<IBackendRes<any>>("/sprints", data);
  },

  updateSprintStatus: (
    sprintId: string,
    status: "active" | "completed" | "cancelled",
  ) => {
    return axios.patch<IBackendRes<any>>(`/sprints/${sprintId}/status`, {
      status,
    });
  },
  getSprintRetrospective: (sprintId: string) => {
    return axios.get<IBackendRes<any>>(`/sprints/${sprintId}/retrospective`);
  },
  getProjectSprintTrends: (projectId: string, limit = 5) => {
    return axios.get<IBackendRes<any>>(
      `/sprints/project/${projectId}/retrospective-trends`,
      {
        params: {
          limit,
        },
      },
    );
  },
  getSprintPlanningForecast: (sprintId: string) => {
    return axios.get<IBackendRes<any>>(
      `/sprints/${sprintId}/planning-forecast`,
    );
  },

  getMyProjects: () => {
    return axios.get<IBackendRes<ProjectItem[]>>("/projects/my-projects");
  },

  getNotificationHistory: () => {
    return axios.get<IBackendRes<any[]>>("/notifications");
  },

  markAllNotificationsAsRead: () => {
    return axios.patch<IBackendRes<any>>("/notifications/read-all");
  },

  markNotificationAsRead: (id: string) => {
    return axios.patch<IBackendRes<any>>(`/notifications/${id}/read`);
  },
  //  task dependencies
  getTaskDependencies: (taskId: string) => {
    return axios.get(`/tasks/${taskId}/dependencies`);
  },

  getTaskDependencyStatus: (taskId: string) => {
    return axios.get(`/tasks/${taskId}/dependencies/status`);
  },

  addTaskDependency: (taskId: string, dependsOnTaskId: string) => {
    return axios.post(`/tasks/${taskId}/dependencies`, {
      dependsOnTaskId,
    });
  },

  removeTaskDependency: (taskId: string, dependencyId: string) => {
    return axios.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
  },
};
