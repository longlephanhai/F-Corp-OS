import { Test, TestingModule } from '@nestjs/testing';
import { UserSkillController } from './user-skill.controller';
import { UserSkillService } from './user-skill.service';

describe('UserSkillController', () => {
  let controller: UserSkillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSkillController],
      providers: [UserSkillService],
    }).compile();

    controller = module.get<UserSkillController>(UserSkillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
