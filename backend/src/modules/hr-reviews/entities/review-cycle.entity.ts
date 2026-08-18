import { ReviewCycleStatus } from 'common/enum/hr-review.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity ánh xạ bảng `hr_review_cycles`.
 * Đại diện cho một chu kỳ đánh giá hiệu suất (ví dụ: Q1-2025, H1-2025).
 */
@Entity('hr_review_cycles')
export class ReviewCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Business Columns ---

  /** Tên chu kỳ đánh giá, ví dụ: "Q1 2025", "Midyear Review 2025" */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Ngày bắt đầu chu kỳ */
  @Column({ type: 'date' })
  startDate: Date;

  /** Ngày kết thúc chu kỳ */
  @Column({ type: 'date' })
  endDate: Date;

  /** Trạng thái hiện tại của chu kỳ */
  @Column({
    type: 'enum',
    enum: ReviewCycleStatus,
    default: ReviewCycleStatus.DRAFT,
  })
  status: ReviewCycleStatus;

  // --- Audit Fields (BẮT BUỘC theo guidelines) ---

  @Column({ type: 'json', nullable: true })
  createdBy: { id: string; email: string };

  @Column({ type: 'json', nullable: true })
  updatedBy: { id: string; email: string };

  @Column({ type: 'json', nullable: true })
  deletedBy: { id: string; email: string };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}
