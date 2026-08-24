import { Test, TestingModule } from '@nestjs/testing';
import { TaskDependenciesService } from './task-dependencies.service';

describe('TaskDependenciesService', () => {
  let service: TaskDependenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskDependenciesService],
    }).compile();

    service = module.get<TaskDependenciesService>(TaskDependenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
