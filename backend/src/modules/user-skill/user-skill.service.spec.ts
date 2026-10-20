import { NotFoundException } from '@nestjs/common';
import { UserSkill } from './entities/user-skill.entity';
import { UserSkillService } from './user-skill.service';

describe('UserSkillService ownership', () => {
  const developer = {
    id: 'developer-1',
    email: 'developer@example.com',
  } as any;

  const createHarness = () => {
    const userSkillsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    const skillEvidencesRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const service = new UserSkillService(
      userSkillsRepository as any,
      skillEvidencesRepository as any,
    );

    return { service, userSkillsRepository };
  };

  it('queries a UserSkill by both UUID and authenticated owner', async () => {
    const { service, userSkillsRepository } = createHarness();
    userSkillsRepository.findOne.mockResolvedValue({ id: 'user-skill-1' });

    await service.findOne('user-skill-1', developer);

    expect(userSkillsRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'user-skill-1',
          userId: 'developer-1',
          isDeleted: false,
        },
      }),
    );
  });

  it('does not expose another Developer UserSkill through an arbitrary UUID', async () => {
    const { service, userSkillsRepository } = createHarness();
    userSkillsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('another-developer-skill', developer),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft-deletes only the authenticated Developer own UserSkill', async () => {
    const { service, userSkillsRepository } = createHarness();
    const userSkill = {
      id: 'user-skill-1',
      userId: developer.id,
      isDeleted: false,
    } as UserSkill;
    userSkillsRepository.findOne.mockResolvedValue(userSkill);

    await service.remove(userSkill.id, developer);

    expect(userSkill.isDeleted).toBe(true);
    expect(userSkill.deletedBy).toEqual({
      id: developer.id,
      email: developer.email,
    });
    expect(userSkillsRepository.softDelete).toHaveBeenCalledWith(userSkill.id);
  });
});
