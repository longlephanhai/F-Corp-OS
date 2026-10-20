import { ForbiddenException } from '@nestjs/common';
import { EvidenceType } from 'common/enum/evidence.enum';
import { SkillEvidencesService } from './skill-evidences.service';

describe('SkillEvidencesService evidence submission ownership', () => {
  const developer = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'developer@example.com',
    fullName: 'Developer',
    role: { name: 'DEVELOPER' },
  } as any;
  const userSkill = {
    id: '22222222-2222-4222-8222-222222222222',
    userId: developer.id,
    user: { id: developer.id, managerId: null, fullName: 'Developer' },
    skill: { name: 'TypeScript' },
  };
  const evidenceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'evidence-id', ...value })),
  };
  const userSkillRepo = {
    findOne: jest.fn(async () => userSkill),
  };
  const notifications = {
    createForUser: jest.fn(async () => undefined),
  };

  const createService = () =>
    new SkillEvidencesService(
      evidenceRepo as any,
      userSkillRepo as any,
      notifications as any,
      {} as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    userSkillRepo.findOne.mockResolvedValue(userSkill);
  });

  it('creates pending evidence for the authenticated developer own skill', async () => {
    const result = await createService().uploadEvidence(
      {
        userSkillId: userSkill.id,
        type: EvidenceType.PROJECT_LINK,
        title: 'Runtime ownership proof',
      },
      developer,
    );

    expect(result).toMatchObject({
      userSkillId: userSkill.id,
      status: 'PENDING',
      createdBy: { id: developer.id, email: developer.email },
    });
    expect(evidenceRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects evidence submission for another developer skill', async () => {
    userSkillRepo.findOne.mockResolvedValue({
      ...userSkill,
      userId: '33333333-3333-4333-8333-333333333333',
    });

    await expect(
      createService().uploadEvidence(
        {
          userSkillId: userSkill.id,
          type: EvidenceType.PROJECT_LINK,
          title: 'Forbidden proof',
        },
        developer,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(evidenceRepo.save).not.toHaveBeenCalled();
  });
});
