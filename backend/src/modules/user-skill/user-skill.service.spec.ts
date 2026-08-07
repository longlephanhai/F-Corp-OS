import { Test, TestingModule } from '@nestjs/testing';
import { UserSkillService } from './user-skill.service';

describe('UserSkillService', () => {
  let service: UserSkillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSkillService],
    }).compile();

    service = module.get<UserSkillService>(UserSkillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
