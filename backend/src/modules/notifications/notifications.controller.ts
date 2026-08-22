import {
  Controller,
  Get,
  Patch,
  Param,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import {
  User,
  SkipCheckPermission,
  ResponseMessage,
} from 'decorator/customize';

import type { IUser } from 'common/types/user.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * GET /notifications
   *
   * Lấy notification của user đang login.
   */
  @SkipCheckPermission()
  @ResponseMessage('Get notifications successfully')
  @Get()
  findMine(@User() user: IUser) {
    return this.notificationsService.findMine(user.id);
  }

  /**
   * PATCH /notifications/read-all
   */
  @SkipCheckPermission()
  @ResponseMessage('Mark all notifications as read successfully')
  @Patch('read-all')
  markAllAsRead(@User() user: IUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * PATCH /notifications/:id/read
   */
  @SkipCheckPermission()
  @ResponseMessage('Mark notification as read successfully')
  @Patch(':id/read')
  markAsRead(
    @User() user: IUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      user.id,
      id,
    );
  }
}