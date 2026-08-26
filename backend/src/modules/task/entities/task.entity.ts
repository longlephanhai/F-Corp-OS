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
import { User } from 'modules/users/entities/user.entity';
import { Sprint } from 'modules/sprints/entities/sprint.entity';

export interface RequiredSkillItem {
  skill_id: string;
  min_level: number;
  weight: number;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({
    name: 'user_id',
    nullable: true,
  })
  userId: string | null;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'int',
    default: 0,
  })
  progress: number;

  // JSON Array lưu danh sách skill yêu cầu cho Task
  @Column({ type: 'json', nullable: true })
  requiredSkills: RequiredSkillItem[];

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetRate: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks)
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

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
