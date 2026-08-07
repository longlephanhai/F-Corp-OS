import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
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
}