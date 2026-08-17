import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Sprint } from '../../sprints/entities/sprint.entity'; // Đường dẫn tùy máy bạn
import { User } from '../../users/entities/user.entity'; // Đảm bảo đường dẫn trỏ đúng tới Entity User

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'status', default: 'active' }) // active, completed, delayed
  status: string;

  // =========================================================================
  // THÊM CHỦ DỰ ÁN (PROJECT MANAGER)
  // =========================================================================
  @Column({ name: 'pm_id', nullable: true }) // Cho phép null vì Admin có thể tạo Project trước rồi gán PM sau
  pmId: string;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'pm_id',
    referencedColumnName: 'id',
  })
  pm: User;

  // =========================================================================
  // QUAN HỆ VỚI SPRINT
  // =========================================================================
  // Quan hệ 1 Project có nhiều Sprints
  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  // =========================================================================
  // AUDIT LOG (Đồng bộ với chuẩn của team)
  // =========================================================================
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
