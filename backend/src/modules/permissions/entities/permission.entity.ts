import { Role } from "modules/roles/entities/role.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column()
    api_path: string;

    @Column()
    method: string;

    @Column()
    module: string;

    // n-n roles
    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}