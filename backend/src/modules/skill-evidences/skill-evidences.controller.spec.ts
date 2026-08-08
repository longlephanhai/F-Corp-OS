import { Test, TestingModule } from '@nestjs/testing';
import { SkillEvidencesController } from './skill-evidences.controller';
import { SkillEvidencesService } from './skill-evidences.service';

describe('SkillEvidencesController', () => {
  let controller: SkillEvidencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillEvidencesController],
      providers: [SkillEvidencesService],
    }).compile();

    controller = module.get<SkillEvidencesController>(SkillEvidencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
