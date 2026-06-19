import { UserStatusType } from "common/enum/user.enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

   
    // role_id n-1
    // @Column({ type: 'enum', enum: ['ADMIN', 'PM', 'DEV'], default: 'DEV' })
    // role: string;

    // allocation  1-n



    @Column({ type: 'enum', enum: UserStatusType, default: UserStatusType.AVAILABLE })
    status: UserStatusType;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}