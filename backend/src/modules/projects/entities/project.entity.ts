import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Sprint } from '../../sprints/entities/sprint.entity'; // Đường dẫn tùy máy bạn

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

  // Quan hệ 1 Project có nhiều Sprints
  @OneToMany(() => Sprint, sprint => sprint.project)
  sprints: Sprint[];
}