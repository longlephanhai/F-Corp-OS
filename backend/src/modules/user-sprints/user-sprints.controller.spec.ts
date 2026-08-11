import { Test, TestingModule } from '@nestjs/testing';
import { UserSprintsController } from './user-sprints.controller';
import { UserSprintsService } from './user-sprints.service';

describe('UserSprintsController', () => {
  let controller: UserSprintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSprintsController],
      providers: [UserSprintsService],
    }).compile();

    controller = module.get<UserSprintsController>(UserSprintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
