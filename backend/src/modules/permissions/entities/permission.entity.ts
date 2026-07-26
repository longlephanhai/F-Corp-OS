import { Role } from "modules/roles/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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