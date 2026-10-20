import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatusType } from 'common/enum/user.enum';
import { User } from 'modules/users/entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';

export type NoActiveAssignmentPolicy = 'PRESERVE' | 'BENCH';

export interface WorkforceRecalculationOptions {
  whenNoActiveAssignment?: NoActiveAssignmentPolicy;
}

@Injectable()
export class WorkforceStatusService {
  constructor(private readonly dataSource: DataSource) {}

  async executeAfterAllocationChange<T>(
    userId: string,
    operation: (manager: EntityManager, user: User) => Promise<T>,
    options: WorkforceRecalculationOptions = {},
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const user = await userRepository
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!user) {
        throw new NotFoundException({
          code: 'WORKFORCE_USER_NOT_FOUND',
          message: 'Không tìm thấy nhân sự để cập nhật trạng thái làm việc.',
        });
      }

      const result = await operation(manager, user);
      const activeAssignmentCount = await manager
        .getRepository(UserSprint)
        .count({
          where: {
            userId,
            status: UserSprintStatus.ASSIGNED,
          },
        });

      const nextStatus = this.resolveStatus(
        user.status,
        activeAssignmentCount,
        options.whenNoActiveAssignment ?? 'PRESERVE',
      );

      if (nextStatus !== user.status) {
        user.status = nextStatus;
        await userRepository.save(user);
      }

      return result;
    });
  }

  private resolveStatus(
    currentStatus: UserStatusType,
    activeAssignmentCount: number,
    noActivePolicy: NoActiveAssignmentPolicy,
  ): UserStatusType {
    if (activeAssignmentCount > 0) {
      return UserStatusType.IN_PROJECT;
    }

    if (
      noActivePolicy === 'BENCH' ||
      currentStatus === UserStatusType.IN_PROJECT
    ) {
      return UserStatusType.BENCH;
    }

    return currentStatus;
  }
}
