import axios from '../config/interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewRecordStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED';

export interface ReviewRecordItem {
  id: string;
  status: ReviewRecordStatus;
  finalScore: number | null;
  createdAt: string;
  updatedAt: string;
  /** Nhân viên được đánh giá */
  employee: {
    id: string;
    fullName: string;
    email: string;
    title: string;
    role: {
      id: string;
      name: string;
    };
  };
  /** Chu kỳ đánh giá mà bản ghi thuộc về */
  reviewCycle: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface GetReviewRecordsParams {
  page?: number;
  limit?: number;
  /** UUID của role/department để lọc */
  departmentId?: string;
  status?: ReviewRecordStatus;
}

export interface ReviewRecordListResponse {
  meta: {
    currentPage: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: ReviewRecordItem[];
}

export interface UpdateReviewStatusPayload {
  status: ReviewRecordStatus;
  finalScore?: number;
}

export interface CreateReviewCyclePaylod {
  name: string;
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
  description?: string;
  /** Mảng UUID nhân viên sẽ được gán vào kỳ đánh giá (backend tự tạo ReviewRecord PENDING) */
  employeeIds?: string[];
}

export interface ReviewRecordStats {
  total: number;
  pending: number;
  inReview: number;
  completed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Object
// ─────────────────────────────────────────────────────────────────────────────

export const hrReviewsApi = {
  /**
   * GET /hr-reviews/records
   * Lấy danh sách bản ghi đánh giá với phân trang và bộ lọc tùy chọn.
   */
  getRecords: (params: GetReviewRecordsParams = {}) => {
    // Loại bỏ các field undefined trước khi gửi lên server
    const cleanParams: Record<string, string | number> = {};
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.limit !== undefined) cleanParams.limit = params.limit;
    if (params.status) cleanParams.status = params.status;
    if (params.departmentId) cleanParams.departmentId = params.departmentId;

    return axios.get<IBackendRes<ReviewRecordListResponse>>(
      '/hr-reviews/records',
      { params: cleanParams },
    );
  },

  /**
   * GET /hr-reviews/records/stats
   * Lấy số liệu tổng hợp (total, pending, inReview, completed) từ toàn bộ database.
   */
  getStats: () => {
    return axios.get<IBackendRes<ReviewRecordStats>>('/hr-reviews/records/stats');
  },

  /**
   * PATCH /hr-reviews/records/:id/status
   * Cập nhật trạng thái và điểm số của một bản ghi đánh giá.
   */
  updateRecordStatus: (id: string, payload: UpdateReviewStatusPayload) => {
    return axios.patch<IBackendRes<ReviewRecordItem>>(
      `/hr-reviews/records/${id}/status`,
      payload,
    );
  },

  /**
   * POST /hr-reviews/cycles
   * Tạo mới một Review Cycle (trạng thái mặc định DRAFT).
   */
  createCycle: (data: CreateReviewCyclePaylod) => {
    return axios.post<IBackendRes<{ id: string; name: string }>>('/hr-reviews/cycles', data);
  },

  /**
   * GET /hr-reviews/records/:id
   * Lấy chi tiết một bản ghi đánh giá theo ID, bao gồm đầy đủ relations.
   */
  getRecordDetail: (id: string) => {
    return axios.get<IBackendRes<ReviewRecordItem>>(`/hr-reviews/records/${id}`);
  },
};
