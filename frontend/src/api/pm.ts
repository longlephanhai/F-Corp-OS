import axios from "../config/interceptor";
import { TaskItem, UserSprintItem } from "../common/types/pm";

export const pmApi = {
  // Lấy danh sách nhân sự tham gia Sprint
  getSprintUsers: (sprintId: string) => {
    return axios.get<IBackendRes<UserSprintItem[]>>(`/user-sprint/sprint/${sprintId}`);
  },

  // PM gửi yêu cầu gán nhân sự vào Sprint
  assignUserToSprint: (sprintId: string, userId: string, percitant: number) => {
    return axios.post<IBackendRes<UserSprintItem>>('/user-sprint', {
      sprintId,
      userId,
      percitant,
      status: 'requested',
    });
  },

  // Duyệt hoặc đổi trạng thái (assigned / released)
  updateUserSprintStatus: (id: string, status: string) => {
    return axios.patch<IBackendRes<UserSprintItem>>(`/user-sprint/${id}`, { status });
  },

  // Tạo Task và gán kĩ năng yêu cầu (Required Skills JSON)
  createTask: (data: Partial<TaskItem>) => {
    return axios.post<IBackendRes<TaskItem>>('/tasks', data);
  },
};