import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Đảm bảo đường dẫn này trỏ đúng tới User entity của team
import { Skill } from '../../skills/entities/skill.entity';

@Entity('user_skills')
export class UserSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'skill_id' })
  skillId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // --- Các field bắt buộc theo task MVP của team ---
  @Column({ type: 'int', default: 1 })
  level: number; // Đánh giá level từ 1-5

  @Column({ type: 'float', nullable: true })
  years: number; // Số năm kinh nghiệm

  @Column({ type: 'text', nullable: true, name: 'evidence_note' })
  evidenceNote: string; // Minh chứng cho kỹ năng

  // --- Thiết lập quan hệ (Relations) ---
  @ManyToOne(() => User, (user) => user.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, (skill) => skill.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;
}