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

  // PM gửi yêu cầu gán nhân sự vào Sprint
  assignUserToSprint: (sprintId: string, userId: string, percitant: number) => {
    return axios.post<IBackendRes<UserSprintItem>>("/user-sprint", {
      sprintId,
      userId,
      percitant,
      status: "requested",
    });
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

  getTaskCandidates: (taskId: string) => {
    return axios.get<IBackendRes<TaskCandidate[]>>(
      `/tasks/${taskId}/candidates`,
    );
  },

  // Tạo Task và gán kĩ năng yêu cầu (Required Skills JSON)
  createTask: (data: Partial<TaskItem>) => {
    return axios.post<IBackendRes<TaskItem>>("/tasks", data);
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

  // Lấy toàn bộ Sprint của 1 Dự án
  getSprintsByProject: (projectId: string) => {
    return axios.get<IBackendRes<any[]>>(`/sprints/project/${projectId}`);
  },

  // Khởi tạo Sprint mới (Có truyền mảng attendant)
  createSprint: (data: any) => {
    console.log("tao la khanh o pmts", data);
    return axios.post<IBackendRes<any>>("/sprints", data);
  },

  getMyProjects: () => {
    return axios.get<IBackendRes<ProjectItem[]>>("/projects/my-projects");
  },
};
