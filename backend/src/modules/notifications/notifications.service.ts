import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

type NotificationType = 'info' | 'success' | 'warning';

interface CreateNotificationInput {
  userId: string;
  title: string;
  description: string;
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Business module gọi hàm này để tạo notification.
   *
   * Flow:
   * Save DB -> emit realtime -> return notification.
   */
  async createForUser(input: CreateNotificationInput) {
    const notification = this.notificationRepo.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      type: input.type ?? 'info',
      read: false,
    });

    const savedNotification =
      await this.notificationRepo.save(notification);

    this.notificationsGateway.emitToUser(
      input.userId,
      savedNotification,
    );

    return savedNotification;
  }

  /**
   * Chỉ lấy notification của user đang đăng nhập.
   */
  async findMine(userId: string) {
    return this.notificationRepo.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 50,
    });
  }

  /**
   * Chỉ mark notification thuộc về user hiện tại.
   */
  async markAsRead(userId: string, notificationId: string) {
    const result = await this.notificationRepo.update(
      {
        id: notificationId,
        userId,
      },
      {
        read: true,
      },
    );

    if (!result.affected) {
      throw new NotFoundException(
        'Không tìm thấy notification',
      );
    }

    return {
      success: true,
    };
  }

  /**
   * Chỉ mark toàn bộ notification của user hiện tại.
   */
  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      {
        userId,
        read: false,
      },
      {
        read: true,
      },
    );

    return {
      success: true,
    };
  }
}