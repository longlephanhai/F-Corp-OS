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
import { UserSprint } from '../../user-sprints/entities/user-sprint.entity';
import { Task } from 'modules/task/entities/task.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Khóa ngoại trỏ đến Project
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string; // Tên của Sprint (VD: Sprint 1, Sprint MVP...)

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date; // Ngày bắt đầu

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date; // Ngày kết thúc

  // Lưu trữ các role tham gia (attendant) dưới dạng mảng JSON
  @Column({ type: 'json', nullable: true })
  attendant: string[];

  // =========================================================================
  // AUDIT LOG
  // =========================================================================
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
  @Column({
    type: 'enum',
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming',
  })
  status: string;

  // =========================================================================
  // CÁC MỐI QUAN HỆ (RELATIONS)
  // =========================================================================
  // 1 Sprint có nhiều bản ghi phân bổ nhân sự (UserSprint)
  @OneToMany(() => UserSprint, (userSprint) => userSprint.sprint)
  userSprints: UserSprint[];

  // 1 Sprint có nhiều Task
  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];

  // Nhiều Sprint thuộc về 1 Project
  @ManyToOne(() => Project, (project) => project.sprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
