import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  Public,
  ResponseMessage,
  SkipCheckPermission,
  User,
} from 'decorator/customize';
import { LocalAuthGuard } from './guard/local-auth.guard';
import type { Request as REQ, Request, Response as RES } from 'express';
import type { IUser } from 'common/types/user.interface';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesService } from 'modules/roles/roles.service';
import { ApiBody } from '@nestjs/swagger';
import { UserLoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rolesService: RolesService,
  ) {}

  @Post('login')
  @ResponseMessage('Login Success')
  @ApiBody({ type: UserLoginDto })
  @Public()
  @SkipCheckPermission()
  @UseGuards(LocalAuthGuard)
  login(
    @Req() req: REQ & { user: IUser },
    @Res({ passthrough: true }) response: RES,
  ) {
    return this.authService.login(req.user, response);
  }

  @Get('/account')
  @ResponseMessage('Get User Information')
  async account(@User() user: IUser) {
    if (!user) {
      return { user: null };
    }

    const roleId = user?.role?.id;
    const temp = roleId
      ? ((await this.rolesService.findOne(roleId)) as any)
      : null;

    return {
      user: {
        ...user,
        role: user?.role
          ? { ...user.role, permissions: temp?.permissions ?? [] }
          : null,
        permissions: temp?.permissions ?? [],
      },
    };
  }

  @Public()
  @ResponseMessage('Refresh Token Success')
  @Get('refresh')
  refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: RES,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    return this.authService.processNewToken(refreshToken, response);
  }

  // @UseGuards(LocalAuthGuard)
  // @Post('logout')
  // async logout(@Request() req) {
  //     return req.logout();
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //     return req.user;
  // }
}
