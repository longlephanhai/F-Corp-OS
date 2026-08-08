import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { UserSkill } from '../../user-skill/entities/user-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Quan hệ 1-N: Một kỹ năng có thể được nhiều nhân sự (user) sở hữu
  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  userSkills: UserSkill[];

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