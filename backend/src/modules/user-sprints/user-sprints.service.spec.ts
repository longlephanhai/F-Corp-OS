import { Test, TestingModule } from '@nestjs/testing';
import { UserSprintsService } from './user-sprints.service';

describe('UserSprintsService', () => {
  let service: UserSprintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSprintsService],
    }).compile();

    service = module.get<UserSprintsService>(UserSprintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
