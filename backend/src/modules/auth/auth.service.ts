import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'common/types/user.interface';
import { access } from 'fs';
import { UsersService } from 'modules/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            const isValid = this.usersService.isValidPassword(pass, user.password);
            if (isValid === true) {
                return {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    status: user.status,
                };
            }
        }
        return null;
    }

    async login(user: IUser) {

        const { id, email, fullName, status } = user;
        const payload = {
            sub: "Token Login",
            iss: "from server",
            id,
            email,
            fullName,
            status,
        }
        // const refresh_token = this.createdRefreshToken(payload);
        // await this.usersService.updateUserToken(refresh_token, user_name);
        // response.cookie('refresh_token', refresh_token, {
        //     httpOnly: true,
        //     maxAge: this.configService.get<number>('JWT_REFRESH_EXPIRE'),
        // })
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id,
                email,
                fullName,
                status,
            }
        };

    }
}
