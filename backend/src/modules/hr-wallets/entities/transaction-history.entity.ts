import { TransactionType } from 'common/enum/hr-wallet.enum';
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
import { Wallet } from './wallet.entity';

/**
 * Entity ánh xạ bảng `hr_transaction_histories`.
 * Ghi lại từng lần biến động số dư F-Token trong một Wallet cụ thể.
 * Quan hệ Many-to-One với Wallet: một ví có nhiều lịch sử giao dịch.
 */
@Entity('hr_transaction_histories')
export class TransactionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Business Columns ---

  /** Số lượng F-Token trong giao dịch này */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  /** Loại giao dịch: REWARD (thưởng) | PENALTY (phạt) | TRANSFER (chuyển) */
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  /** Lý do / mô tả giao dịch */
  @Column({ type: 'text' })
  reason: string;

  /**
   * ID tham chiếu đến đối tượng nghiệp vụ liên quan (ví dụ: ReviewRecord ID).
   * Nullable vì không phải mọi giao dịch đều gắn với một đối tượng cụ thể.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId: string;

  // --- Relations ---

  /** Ví mà giao dịch này thuộc về */
  @ManyToOne(() => Wallet, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id', referencedColumnName: 'id' })
  wallet: Wallet;

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
