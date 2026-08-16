import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'modules/users/entities/user.entity';
import { Sprint } from 'modules/sprints/entities/sprint.entity';

export enum UserSprintStatus {
  REQUESTED = 'requested',
  PENDING_APPROVAL = 'pending_approval',
  ASSIGNED = 'assigned',
  RELEASED = 'released',
}

@Entity('user_sprint')
export class UserSprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'float', default: 100 })
  percitant: number; // Phần trăm công suất tham gia sprint

  @Column({ type: 'enum', enum: UserSprintStatus, default: UserSprintStatus.REQUESTED })
  status: UserSprintStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Sprint, (sprint) => sprint.userSprints)
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;


  @Column({ name: 'hard_skill_rate', type: 'int', nullable: true })
  hardSkillRate: number;

  @Column({ name: 'soft_skill_rate', type: 'int', nullable: true })
  softSkillRate: number;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string;
}