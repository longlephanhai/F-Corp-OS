import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('task_dependencies')
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'task_id',
    type: 'varchar',
    length: 36,
  })
  taskId: string;

  @Column({
    name: 'depends_on_task_id',
    type: 'varchar',
    length: 36,
  })
  dependsOnTaskId: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}