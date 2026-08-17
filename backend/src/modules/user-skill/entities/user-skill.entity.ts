import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { SkillEvidence } from 'modules/skill-evidences/entities/skill-evidence.entity';

@Entity('user_skills')
export class UserSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'skill_id' })
  skillId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  level: number; // 1-5

  @Column({ type: 'float', nullable: true })
  years: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenceNote: string;

  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  @ManyToOne(() => User, (user) => user.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, (skill) => skill.userSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @OneToMany(() => SkillEvidence, (evidence) => evidence.userSkill)
  evidences: SkillEvidence[];

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
