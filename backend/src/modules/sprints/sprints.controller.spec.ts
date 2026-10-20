import { ForbiddenException } from '@nestjs/common';
import { IS_PUBLIC_PERMISSION } from 'decorator/customize';
import { SprintsController } from './sprints.controller';

describe('SprintsController', () => {
  const sprintsService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const pmAccessService = {
    assertProjectAccess: jest.fn(),
    assertSprintAccess: jest.fn(),
  };
  const controller = new SprintsController(
    sprintsService as any,
    pmAccessService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not bypass route permissions at controller level', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_PERMISSION, SprintsController)).toBeUndefined();
  });

  it('checks project ownership before creating a sprint', async () => {
    sprintsService.create.mockResolvedValue({ id: 'sprint-1' });

    await controller.create(
      { projectId: 'project-1' } as any,
      { user: { id: 'pm-1' } },
    );

    expect(pmAccessService.assertProjectAccess).toHaveBeenCalledWith(
      'pm-1',
      'project-1',
    );
    expect(sprintsService.create).toHaveBeenCalled();
  });

  it('does not load a sprint when PM ownership validation fails', async () => {
    pmAccessService.assertSprintAccess.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.findOne('sprint-2', { user: { id: 'pm-1' } }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sprintsService.findOne).not.toHaveBeenCalled();
  });
});
