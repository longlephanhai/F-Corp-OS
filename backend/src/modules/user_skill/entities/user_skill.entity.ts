import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { SkillEvidence } from '../../skill-evidence/entities/skill-evidence.entity'; // Sắp tạo ở bước dưới

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

  @Column({ type: 'int', default: 1 })
  level: number; // 1-5

  @Column({ type: 'float', nullable: true })
  years: number;

  @Column({ type: 'text', nullable: true, name: 'evidence_note' })
  evidenceNote: string;

  // 🔥 THÊM: Điểm tin cậy (Linh hồn của AI Matching v4)
  // Mặc định lúc tự đánh giá chỉ được 30 điểm. PM duyệt bằng chứng xong hệ thống mới đẩy lên 100.
  @Column({ type: 'int', default: 30, name: 'confidence_score' })
  confidenceScore: number; 

  // 🔥 THÊM: Audit update để biết Dev có lười update profile không
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Relations ---
  @ManyToOne(() => User, (user) => user.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, (skill) => skill.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  // 🔥 THÊM: Nối 1-N sang bảng Bằng chứng sắp tạo
  @OneToMany(() => SkillEvidence, (evidence) => evidence.userSkill)
  evidences: SkillEvidence[];
}