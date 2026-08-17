import { EvidenceType } from "common/enum/evidence.enum";
import { UserSkill } from "modules/user-skill/entities/user-skill.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('skill_evidences')
export class SkillEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_skill_id' })
  userSkillId: string;

  @ManyToOne(() => UserSkill, (userSkill) => userSkill.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_skill_id' })
  userSkill: UserSkill;

  @Column({
    type: 'enum',
    enum: EvidenceType,
    default: EvidenceType.PROJECT_LINK,
  })
  type: EvidenceType;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;
}