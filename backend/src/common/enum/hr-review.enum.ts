/**
 * Trạng thái của một chu kỳ đánh giá (Review Cycle).
 */
export enum ReviewCycleStatus {
  DRAFT = 'DRAFT',         // Đang chuẩn bị, chưa kích hoạt
  ACTIVE = 'ACTIVE',       // Đang diễn ra
  COMPLETED = 'COMPLETED', // Đã hoàn thành
  CANCELLED = 'CANCELLED', // Đã hủy
}

/**
 * Trạng thái của một bản ghi đánh giá cá nhân (Review Record).
 */
export enum ReviewRecordStatus {
  PENDING = 'PENDING',       // Chờ đánh giá
  IN_REVIEW = 'IN_REVIEW',   // Đang được đánh giá
  COMPLETED = 'COMPLETED',   // Đã hoàn thành đánh giá
}
