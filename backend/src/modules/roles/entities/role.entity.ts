
import { Permission } from "modules/permissions/entities/permission.entity";
import { User } from "modules/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    name: string;

    @Column()
    description: string;

    // n-n permissions
    @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: {
            name: 'role_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'permission_id',
            referencedColumnName: 'id',
        },
    })
    permissions: Permission[];

    // 1-n users
    @OneToMany(() => User, (user) => user.role)
    users: User[];

    @Column({ type: 'json', nullable: true })
    createdBy: {
        id: string;
        email: string;
    }

    @Column({ type: 'json', nullable: true })
    updatedBy: {
        id: string;
        email: string;
    }

    @Column({ type: 'json', nullable: true })
    deletedBy: {
        id: string;
        email: string;
    };


    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp' })
    deletedAt: Date;

    @Column({ default: false })
    isDeleted: boolean;
}