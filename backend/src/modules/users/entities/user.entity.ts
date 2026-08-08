import { UserStatusType } from "common/enum/user.enum";
import { Role } from "modules/roles/entities/role.entity";
import { UserSkill } from "modules/user-skill/entities/user-skill.entity";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'varchar', length: 100 })
    fullName: string;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
    role: Role;


    @Column({ type: 'varchar', length: 100, nullable: true })
    title: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    costRate: number;

    @Column({ type: 'uuid', nullable: true })
    managerId: string;

    @ManyToOne(() => User, (user) => user.employees, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'managerId' })
    manager: User;

    @OneToMany(() => User, (user) => user.manager)
    employees: User[];

    @OneToMany(() => UserSkill, (userSkill) => userSkill.user)
    userSkills: UserSkill[];

    @Column({ type: 'text', nullable: true })
    refreshToken: string;

    @Column({ type: 'enum', enum: UserStatusType, default: UserStatusType.AVAILABLE })
    status: UserStatusType;

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