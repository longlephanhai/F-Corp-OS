import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'decorator/customize';
import { hasRoutePermission, normalizeRoutePath } from './permission-matcher';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (err || !user) {
      throw (
        err || new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn')
      );
    }

    const targetMethod = request.method as string;
    const targetEndPoint = request.route?.path as string | undefined;

    const permissions = user?.permissions || [];

    let isExist =
      typeof targetEndPoint === 'string' &&
      hasRoutePermission(permissions, targetMethod, targetEndPoint);

    if (
      targetEndPoint &&
      normalizeRoutePath(targetEndPoint).startsWith('/api/v1/auth')
    ) {
      isExist = true;
    }

    if (!isExist && !isSkipPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập endpoint này');
    }

    return user;
  }
}
