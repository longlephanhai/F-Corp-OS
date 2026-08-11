import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'modules/users/entities/user.entity';
import { Sprint } from 'modules/sprints/entities/sprint.entity';

export interface RequiredSkillItem {
  skill_id: string;
  min_level: number;
  weight: number;
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'sprint_id' })
  sprintId: string;

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
  createdBy: { id: string; email: string; };

  @Column({ type: 'json', nullable: true })
  updatedBy: { id: string; email: string; };

  @Column({ type: 'json', nullable: true })
  deletedBy: { id: string; email: string; };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;
}