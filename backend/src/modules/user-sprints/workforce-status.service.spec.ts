import { UserStatusType } from 'common/enum/user.enum';
import { User } from 'modules/users/entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import { UserSprint } from './entities/user-sprint.entity';
import { WorkforceStatusService } from './workforce-status.service';

describe('WorkforceStatusService', () => {
  const userId = 'developer-id';

  const createHarness = (
    initialStatus: UserStatusType,
    initialAssignedCount: number,
  ) => {
    const user = {
      id: userId,
      status: initialStatus,
    } as User;
    let assignedCount = initialAssignedCount;

    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const allocationRepository = {
      count: jest.fn().mockImplementation(async () => assignedCount),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === User) {
          return userRepository;
        }

        if (entity === UserSprint) {
          return allocationRepository;
        }

        throw new Error('Unexpected repository');
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    } as unknown as DataSource;

    return {
      service: new WorkforceStatusService(dataSource),
      user,
      userRepository,
      setAssignedCount: (count: number) => {
        assignedCount = count;
      },
    };
  };

  it('sets IN_PROJECT after an allocation becomes assigned', async () => {
    const harness = createHarness(UserStatusType.AVAILABLE, 0);

    await harness.service.executeAfterAllocationChange(
      userId,
      async () => {
        harness.setAssignedCount(1);
      },
    );

    expect(harness.user.status).toBe(UserStatusType.IN_PROJECT);
    expect(harness.userRepository.save).toHaveBeenCalledWith(harness.user);
  });

  it('sets BENCH after the last active assignment is released', async () => {
    const harness = createHarness(UserStatusType.IN_PROJECT, 1);

    await harness.service.executeAfterAllocationChange(
      userId,
      async () => {
        harness.setAssignedCount(0);
      },
      { whenNoActiveAssignment: 'BENCH' },
    );

    expect(harness.user.status).toBe(UserStatusType.BENCH);
  });

  it('keeps IN_PROJECT when another active assignment remains', async () => {
    const harness = createHarness(UserStatusType.IN_PROJECT, 2);

    await harness.service.executeAfterAllocationChange(
      userId,
      async () => {
        harness.setAssignedCount(1);
      },
      { whenNoActiveAssignment: 'BENCH' },
    );

    expect(harness.user.status).toBe(UserStatusType.IN_PROJECT);
    expect(harness.userRepository.save).not.toHaveBeenCalled();
  });

  it('does not make a pending invitation active', async () => {
    const harness = createHarness(UserStatusType.AVAILABLE, 0);

    await harness.service.executeAfterAllocationChange(userId, async () => {
      // REQUESTED/PENDING_APPROVAL are not active assignments.
    });

    expect(harness.user.status).toBe(UserStatusType.AVAILABLE);
    expect(harness.userRepository.save).not.toHaveBeenCalled();
  });
});
