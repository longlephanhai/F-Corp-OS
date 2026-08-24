import { Test, TestingModule } from '@nestjs/testing';
import { TaskDependenciesController } from './task-dependencies.controller';
import { TaskDependenciesService } from './task-dependencies.service';

describe('TaskDependenciesController', () => {
  let controller: TaskDependenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskDependenciesController],
      providers: [TaskDependenciesService],
    }).compile();

    controller = module.get<TaskDependenciesController>(TaskDependenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
