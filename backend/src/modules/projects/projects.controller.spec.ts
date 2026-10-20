import { ForbiddenException } from '@nestjs/common';
import { IS_PUBLIC_PERMISSION } from 'decorator/customize';
import { ProjectsController } from './projects.controller';

describe('ProjectsController', () => {
  const projectsService = {
    createProject: jest.fn(),
    getProjectDetailWithBudget: jest.fn(),
  };
  const pmAccessService = {
    assertProjectAccess: jest.fn(),
  };
  const controller = new ProjectsController(
    projectsService as any,
    pmAccessService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not bypass route permissions', () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_PERMISSION,
        ProjectsController.prototype.createProject,
      ),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_PERMISSION,
        ProjectsController.prototype.getProjectById,
      ),
    ).toBeUndefined();
  });

  it('derives the project owner from the authenticated PM', async () => {
    projectsService.createProject.mockResolvedValue({ id: 'project-1' });

    await controller.createProject(
      { name: 'Project', pmId: 'attacker-selected-pm' },
      { user: { id: 'pm-1' } },
    );

    expect(projectsService.createProject).toHaveBeenCalledWith({
      name: 'Project',
      pmId: 'pm-1',
    });
  });

  it('does not load a project when PM ownership validation fails', async () => {
    pmAccessService.assertProjectAccess.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.getProjectById('project-2', { user: { id: 'pm-1' } }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(projectsService.getProjectDetailWithBudget).not.toHaveBeenCalled();
  });
});
