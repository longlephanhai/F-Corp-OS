import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSprint } from '../../user-sprints/entities/user-sprint.entity'; // Đường dẫn tới entity UserSprint
import { Task } from 'modules/task/entities/task.entity'; // Đường dẫn tới entity Task
// import { Project } from '../../projects/entities/project.entity'; // Mở comment khi bạn đã tạo bảng Project

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
  @Column({ type: 'jsonb', nullable: true })
  attendant: string[]; 

  // =========================================================================
  // CÁC MỐI QUAN HỆ (RELATIONS)
  // =========================================================================

  // 1 Sprint có nhiều bản ghi phân bổ nhân sự (UserSprint)
  @OneToMany(() => UserSprint, (userSprint) => userSprint.sprint)
  userSprints: UserSprint[];

  // 1 Sprint có nhiều Task
  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];

  // Nhiều Sprint thuộc về 1 Project (Tạm comment phần liên kết thực thể nếu chưa có Entity Project)
  /*
  @ManyToOne(() => Project, (project) => project.sprints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
  */

  // =========================================================================
  // AUDIT LOG
  // =========================================================================
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}