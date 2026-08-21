import { User } from "modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('websocket')
export class Websocket {
    @PrimaryColumn()
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.websockets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
