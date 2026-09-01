import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Project } from './project.entity';

import { User } from '../../users/entities/user.entity';

export enum ProjectManagerRole {
  PRIMARY = 'PRIMARY',

  CO_MANAGER = 'CO_MANAGER',
}

@Entity('project_managers')
@Unique('uq_project_manager_project_user', ['projectId', 'userId'])
@Index('idx_project_manager_project', ['projectId'])
@Index('idx_project_manager_user', ['userId'])
export class ProjectManager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // PROJECT
  // ==========================================

  @Column({
    name: 'project_id',
    type: 'varchar',
    length: 36,
  })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.managers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'project_id',
  })
  project: Project;

  // ==========================================
  // USER / PM
  // ==========================================

  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 36,
  })
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  // ==========================================
  // ROLE IN PROJECT
  // ==========================================

  @Column({
    name: 'manager_role',
    type: 'enum',
    enum: ProjectManagerRole,
    default: ProjectManagerRole.CO_MANAGER,
  })
  managerRole: ProjectManagerRole;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;
}
