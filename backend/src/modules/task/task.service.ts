import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  // 4. Tạo Task và gán kĩ năng yêu cầu (Required Skills JSON)
  async createTask(data: any) {
    // data.requiredSkills bản chất là JSON array nên TypeORM tự map xuống DB
    const newTask = this.taskRepo.create({
      sprintId: data.sprintId,
      userId: data.userId, // Có thể null nếu mới tạo chưa gán người
      requiredSkills: data.requiredSkills, 
      startDate: data.startDate,
      endDate: data.endDate,
      budgetRate: data.budgetRate,
    });
    
    return await this.taskRepo.save(newTask);
  }
}