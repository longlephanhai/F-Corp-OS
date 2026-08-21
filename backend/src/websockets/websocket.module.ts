import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Websocket } from './entities/websocket.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Websocket]),
    ],
})
export class WebsocketModule { }
