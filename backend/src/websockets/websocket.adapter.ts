import { INestApplicationContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions, Socket } from "socket.io";
import { Repository } from "typeorm";
import { Websocket } from "./entities/websocket.entity";

export class WebsocketAdapter extends IoAdapter {
    private webSocketRepository: Repository<Websocket>;
    private jwtService: JwtService;

    constructor(app: INestApplicationContext) {
        super(app);
        this.webSocketRepository = app.get('WebsocketRepository');
        this.jwtService = app.get(JwtService);
    }

    createIOServer(port: number, options?: ServerOptions) {
        const server: Server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: '*',
                credentials: true
            }
        });
        // server.of('/payment').use(this.authMiddleware);
        // server.of('/chat').use(this.authMiddleware);
        server.use((socket, next) => {
            this.authMiddleware(socket, next);
        });
        server.of(/.*/).use((socket, next) => {
            this.authMiddleware(socket, next);
        });

        return server;
    }

    async authMiddleware(socket: Socket, next: (err?: any) => void) {
    const authToken = socket.handshake.auth?.token;
    const { authorization } = socket.handshake.headers;

    const accessToken = authToken || (authorization ? authorization.split(' ')[1] : undefined);

    if (!accessToken) {
        return next(new Error('Access token is missing'));
    }

    try {
        const payload = await this.jwtService.verifyAsync(accessToken, {
            secret: process.env.JWT_SECRET_KEY
        })
        const userId = payload.id;

        socket.data.user = {
            id: payload.id,
            email: payload.email,
            fullName: payload.fullName,
            role: payload.role,
        };

        await this.webSocketRepository.save({
            id: socket.id,
            userId: userId
        })

        socket.on('disconnect', async () => {
            await this.webSocketRepository.delete({ id: socket.id }).catch((error) => {
                console.error(`Error deleting websocket with id ${socket.id}:`, error);
            });
        })
        next();
    }
    catch (error) {
        next(error);
    }
}
}