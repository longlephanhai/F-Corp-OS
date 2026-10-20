import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'common/types/user.interface';
import { RolesService } from 'modules/roles/roles.service';
import { UsersService } from 'modules/users/users.service';
import { CookieOptions, Response } from 'express';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { generatedRoomUserId } from 'helper';

@WebSocketGateway({ namespace: '/login' })
@Injectable()
export class AuthService {
  private readonly refreshCookieName = 'refresh_token';

  @WebSocketServer()
  server: Server;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}

  private getRefreshCookieOptions(refreshToken?: string): CookieOptions {
    const isProduction =
      this.configService.get<string>('NODE_ENV')?.toLowerCase() ===
      'production';

    const options: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    };

    if (refreshToken) {
      const decoded = this.jwtService.decode(refreshToken) as {
        exp?: number;
      } | null;

      if (decoded?.exp) {
        options.maxAge = Math.max(0, decoded.exp * 1000 - Date.now());
      }
    }

    return options;
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(
      this.refreshCookieName,
      refreshToken,
      this.getRefreshCookieOptions(refreshToken),
    );
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(
      this.refreshCookieName,
      this.getRefreshCookieOptions(),
    );
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        const roleId = user.role?.id;
        const temp = roleId
          ? ((await this.rolesService.findOne(roleId)) as any)
          : null;

        const objUser = {
          ...user,
          permissions: temp?.permissions ?? [],
        };
        return objUser;
      }
    }
    return null;
  }

  createdRefreshToken = (payload) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRATION_TIME',
      ) as any,
    });
    return refresh_token;
  };

  async login(user: IUser, response: Response) {
    const { id, email, fullName, status, role, managerId } = user;
    const payload = {
      sub: 'Token Login',
      iss: 'from server',
      id,
      email,
      fullName,
      status,
      role: {
        name: role?.name,
        id: role?.id,
      },
      managerId: managerId || undefined,
    };
    const refresh_token = this.createdRefreshToken(payload);
    await this.usersService.updateUserToken(refresh_token, id);
    this.setRefreshCookie(response, refresh_token);
    this.server.to(generatedRoomUserId(id)).emit('response-login', {
      email: email,
      fullName: fullName,
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id,
        email,
        fullName,
        status,
        role: {
          name: role?.name,
        },
        permissions: role?.permissions,
      },
    };
  }

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Invalid refresh token');
      }

      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      });
      let user = await this.usersService.findUserByToken(refreshToken);
      if (user) {
        const { id, email, fullName, status, role, managerId } = user;
        const payload = {
          sub: 'Token Refresh',
          iss: 'from server',
          id,
          email,
          fullName,
          status,
          managerId: managerId || undefined,
          role: {
            name: role?.name,
            id: role?.id,
          },
        };
        const refresh_token = this.createdRefreshToken(payload);

        await this.usersService.updateUserToken(refresh_token, id);

        const userRole = user.role;
        const temp = userRole?.id
          ? ((await this.rolesService.findOne(userRole.id)) as any)
          : null;

        this.setRefreshCookie(response, refresh_token);

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            id,
            email,
            fullName,
            status,
            role: {
              name: userRole?.name,
            },
          },
        };
      } else {
        throw new BadRequestException('Invalid refresh token');
      }
    } catch (error) {
      if (refreshToken) {
        try {
          const user = await this.usersService.findUserByToken(refreshToken);
          if (user) {
            await this.usersService.updateUserToken(null, user.id);
          }
        } catch {
          // Cookie cleanup must still happen if database cleanup is unavailable.
        }
      }

      this.clearRefreshCookie(response);
      throw new BadRequestException('Invalid refresh token');
    }
  };

  async logout(userId: string, response: Response) {
    try {
      await this.usersService.updateUserToken(null, userId);
    } finally {
      this.clearRefreshCookie(response);
    }

    return { success: true };
  }
}
