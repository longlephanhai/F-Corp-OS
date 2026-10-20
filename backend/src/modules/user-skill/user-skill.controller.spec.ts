import { IS_PUBLIC_PERMISSION } from 'decorator/customize';
import { UserSkillController } from './user-skill.controller';

describe('UserSkillController', () => {
  const userSkillService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new UserSkillController(userSkillService as any);
  const developer = { id: 'developer-1', email: 'developer@example.com' } as any;

  beforeEach(() => jest.clearAllMocks());

  it('does not bypass permissions for create or skill-tree routes', () => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_PERMISSION,
        UserSkillController.prototype.create,
      ),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_PERMISSION,
        UserSkillController.prototype.getSkillTree,
      ),
    ).toBeUndefined();
  });

  it('passes the authenticated Developer to all UUID-scoped operations', async () => {
    userSkillService.findOne.mockResolvedValue({ id: 'skill-1' });
    userSkillService.update.mockResolvedValue({ id: 'skill-1' });
    userSkillService.remove.mockResolvedValue({});

    await controller.findOne('skill-1', developer);
    await controller.update('skill-1', { years: 3 }, developer);
    await controller.remove('skill-1', developer);

    expect(userSkillService.findOne).toHaveBeenCalledWith('skill-1', developer);
    expect(userSkillService.update).toHaveBeenCalledWith(
      'skill-1',
      { years: 3 },
      developer,
    );
    expect(userSkillService.remove).toHaveBeenCalledWith('skill-1', developer);
  });
});
