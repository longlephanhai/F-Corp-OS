import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'common/types/user.interface';
import { RolesService } from 'modules/roles/roles.service';
import { UsersService } from 'modules/users/users.service';
import { Response } from 'express';
import { permission, ref } from 'process';


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private rolesService: RolesService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            const isValid = this.usersService.isValidPassword(pass, user.password);
            if (isValid === true) {
                const temp = await this.rolesService.findOne(user.role?.id) as any;

                const objUser = {
                    ...user,
                    permissions: temp?.permissions
                }
                // return {
                //     id: user.id,
                //     email: user.email,
                //     fullName: user.fullName,
                //     status: user.status,
                //     role: user.role,
                // };
                return objUser;
            }
        }
        return null;
    }

    createdRefreshToken = (payload) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') as any
        })
        return refresh_token
    }

    async login(user: IUser, response: Response) {

        const { id, email, fullName, status, role } = user;
        const payload = {
            sub: "Token Login",
            iss: "from server",
            id,
            email,
            fullName,
            status,
            role: {
                name: role?.name,
                id: role?.id
            },
        }
        const refresh_token = this.createdRefreshToken(payload);
        await this.usersService.updateUserToken(refresh_token, id);
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: this.configService.get<number>('JWT_REFRESH_EXPIRATION_TIME'),
        })
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id,
                email,
                fullName,
                status,
                role: {
                    name: role?.name
                },
                permissions: role?.permissions
            },
            refresh_token: refresh_token
        };

    }

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY')
            })
            let user = await this.usersService.findUserByToken(refreshToken);
            if (user) {
                const { id, email, fullName, status, role } = user;
                const payload = {
                    sub: "Token Refresh",
                    iss: "from server",
                    id,
                    email,
                    fullName,
                    status,
                    role: {
                        name: role?.name,
                        id: role?.id
                    }
                }
                const refresh_token = this.createdRefreshToken(payload);

                await this.usersService.updateUserToken(refresh_token, id);

                const userRole = user.role;
                const temp = await this.rolesService.findOne(userRole?.id) as any;

                response.cookie('refresh_token', refresh_token, {
                    httpOnly: true,
                    maxAge: this.configService.get<number>('JWT_REFRESH_EXPIRATION_TIME'),
                })

                return {
                    access_token: this.jwtService.sign(payload),
                    user: {
                        id,
                        email,
                        fullName,
                        status,
                        role: {
                            name: userRole?.name,
                        }
                    }
                }
            } else {
                throw new BadRequestException('Invalid refresh token');
            }
        } catch (error) {
            throw new BadRequestException('Invalid refresh token');
        }
    }
}
