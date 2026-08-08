import { Test, TestingModule } from '@nestjs/testing';
import { SkillEvidencesService } from './skill-evidences.service';

describe('SkillEvidencesService', () => {
  let service: SkillEvidencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SkillEvidencesService],
    }).compile();

    service = module.get<SkillEvidencesService>(SkillEvidencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
