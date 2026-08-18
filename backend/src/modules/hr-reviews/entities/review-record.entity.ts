import { ReviewRecordStatus } from 'common/enum/hr-review.enum';
import { User } from 'modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewCycle } from './review-cycle.entity';

/**
 * Entity ánh xạ bảng `hr_review_records`.
 * Đại diện cho bản ghi đánh giá cá nhân của một nhân viên
 * trong một chu kỳ đánh giá cụ thể.
 */
@Entity('hr_review_records')
export class ReviewRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Business Columns ---

  /** Trạng thái của bản ghi đánh giá này */
  @Column({
    type: 'enum',
    enum: ReviewRecordStatus,
    default: ReviewRecordStatus.PENDING,
  })
  status: ReviewRecordStatus;

  /**
   * Điểm số tổng kết cuối cùng (ví dụ: thang điểm 1-5 hoặc 0-100).
   * Nullable vì chỉ có giá trị khi đánh giá hoàn thành.
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalScore: number;

  // --- Relations ---

  /** Chu kỳ đánh giá mà bản ghi này thuộc về */
  @ManyToOne(() => ReviewCycle, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_cycle_id', referencedColumnName: 'id' })
  reviewCycle: ReviewCycle;

  /** Nhân viên được đánh giá trong bản ghi này */
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee: User;

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
