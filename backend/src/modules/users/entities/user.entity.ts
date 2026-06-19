import { UserStatusType } from "common/enum/user.enum";
import { Role } from "modules/roles/entities/role.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    // allocation  1-n



    @Column({ type: 'enum', enum: UserStatusType, default: UserStatusType.AVAILABLE })
    status: UserStatusType;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}