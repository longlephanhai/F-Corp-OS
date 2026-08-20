import { WalletStatus } from 'common/enum/hr-wallet.enum';
import { User } from 'modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity ánh xạ bảng `hr_wallets`.
 * Đại diện cho ví F-Token của một nhân viên.
 * Quan hệ One-to-One với User: mỗi nhân viên có đúng một ví.
 */
@Entity('hr_wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Business Columns ---

  /** Số dư hiện tại của ví, đơn vị F-Token */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  /** Trạng thái của ví (ACTIVE | LOCKED | INACTIVE) */
  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  // --- Relations ---

  /** Nhân viên sở hữu ví này */
  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
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
