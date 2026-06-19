import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'decorator/customize';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Request as REQ, Response } from 'express';
import { IUser } from 'common/types/user.interface';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ResponseMessage('Login Success')
    @Public()
    @UseGuards(LocalAuthGuard)
    login(@Request() req: Request & { user: IUser }) {
        return this.authService.login(req.user);
    }


    @UseGuards(LocalAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
        return req.logout();
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
