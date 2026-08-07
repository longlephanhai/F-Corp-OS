    import { UserStatusType } from "common/enum/user.enum";
    import { Role } from "modules/roles/entities/role.entity";
    import { UserSkill } from "modules/user_skill/entities/user_skill.entity";
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

        @Column({ type: 'varchar', length: 255, select: false }) // Thêm select: false để bảo mật
        password: string;

        @Column({ type: 'varchar', length: 100 })
        fullName: string;

        @ManyToOne(() => Role, { eager: true })
        @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
        role: Role;

        
        @Column({ type: 'varchar', length: 100, nullable: true })
        title: string; // Chức danh (VD: Senior Dev, PM...)


        @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
        costRate: number; // Mức lương / Chi phí

        // =========================================================================
        // QUAN HỆ SẾP - LÍNH (SELF-REFERENCING)
        // =========================================================================

        // Cột thực tế dưới DB lưu ID của Sếp
        @Column({ type: 'uuid', nullable: true })
        managerId: string;

        // Lính trỏ lên Sếp (Nhiều lính có 1 sếp)
        @ManyToOne(() => User, (user) => user.employees, { onDelete: 'SET NULL' })
        @JoinColumn({ name: 'managerId' })
        manager: User;

        // Sếp quản lý Lính (1 Sếp có nhiều lính) - Mảng này TypeORM tự sinh ra khi query
        @OneToMany(() => User, (user) => user.manager)
        employees: User[];

        // =========================================================================

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

        @OneToMany(() => UserSkill, (userSkill) => userSkill.user)
        userSkills: UserSkill[];
    }