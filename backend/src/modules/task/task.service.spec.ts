import { TasksService } from './task.service';

describe('TasksService required skill validation', () => {
  const sprintId = '11111111-1111-4111-8111-111111111111';
  const skillId = '22222222-2222-4222-8222-222222222222';
  const missingSkillId = '33333333-3333-4333-8333-333333333333';

  const taskRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'task-id', ...value })),
  };
  const sprintRepo = {
    findOne: jest.fn(async () => ({
      id: sprintId,
      status: 'PLANNING',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    })),
  };
  const skillRepo = {
    find: jest.fn(async () => [{ id: skillId }]),
  };
  const realtime = {
    publishSprintChanged: jest.fn(async () => undefined),
  };

  const createService = () =>
    new TasksService(
      taskRepo as any,
      sprintRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      skillRepo as any,
      {} as any,
      realtime as any,
    );

  const basePayload = {
    sprintId,
    title: 'Validate real required skills',
    startDate: '2026-01-05',
    endDate: '2026-01-10',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    skillRepo.find.mockResolvedValue([{ id: skillId }]);
  });

  it('accepts a required skill that exists in the active catalog', async () => {
    const result = await createService().createTask({
      ...basePayload,
      requiredSkills: [{ skill_id: skillId, min_level: 3, weight: 2 }],
    });

    expect(result.requiredSkills).toEqual([
      { skill_id: skillId, min_level: 3, weight: 2 },
    ]);
    expect(skillRepo.find).toHaveBeenCalledTimes(1);
    expect(taskRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects a UUID that is not present in the active skill catalog', async () => {
    skillRepo.find.mockResolvedValue([]);

    await expect(
      createService().createTask({
        ...basePayload,
        requiredSkills: [
          { skill_id: missingSkillId, min_level: 2, weight: 1 },
        ],
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'INVALID_REQUIRED_SKILL_IDS',
        invalidSkillIds: [missingSkillId],
      }),
    });

    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate required skills before persisting the task', async () => {
    await expect(
      createService().createTask({
        ...basePayload,
        requiredSkills: [
          { skill_id: skillId, min_level: 2, weight: 1 },
          { skill_id: skillId, min_level: 4, weight: 3 },
        ],
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'DUPLICATE_REQUIRED_SKILL',
      }),
    });

    expect(taskRepo.save).not.toHaveBeenCalled();
  });
});
