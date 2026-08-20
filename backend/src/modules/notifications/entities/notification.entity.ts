import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string; // ID của người nhận (Ví dụ: ID của ông PM)

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'info' }) // info, success, warning
  type: string;

  @Column({ name: 'is_read', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}