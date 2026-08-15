import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getTasksBySprint(sprintId: string) {
    return await this.taskRepo.find({
      where: { sprintId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

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

  async getMatchingCandidates(taskId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('Không tìm thấy task');
    }

    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userSkills', 'userSkill', 'userSkill.isDeleted = :isDeleted', { isDeleted: false })
      .leftJoinAndSelect('userSkill.skill', 'skill')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'user.id',
        'user.fullName',
        'user.title',
        'user.status',
        'user.costRate',
        'userSkill.id',
        'userSkill.skillId',
        'userSkill.level',
        'skill.id',
        'skill.name',
      ])
      .getMany();

    const requirements = (task.requiredSkills ?? []).map((requirement: any) => ({
      identifier: requirement.skill_id ?? requirement.skill,
      label: requirement.skill ?? requirement.skill_id ?? 'Chưa xác định',
      minLevel: requirement.min_level ?? requirement.level ?? 1,
    }));

    return users
      .map((user) => {
        const matchedSkills = requirements
          .filter((requirement) =>
            user.userSkills.some(
              (userSkill) =>
                (userSkill.skillId === requirement.identifier ||
                  userSkill.skill?.name === requirement.identifier) &&
                userSkill.level >= requirement.minLevel,
            ),
          )
          .map((requirement) => requirement.label);
        const missingSkills = requirements
          .filter((requirement) => !matchedSkills.includes(requirement.label))
          .map((requirement) => requirement.label);
        const matchScore = requirements.length
          ? Math.round((matchedSkills.length / requirements.length) * 100)
          : 0;

        return {
          id: user.id,
          fullName: user.fullName,
          title: user.title ?? 'Chưa cập nhật vị trí',
          status: user.status === 'AVAILABLE' ? 'available' : 'on_project',
          matchScore,
          matchedSkills,
          missingSkills,
          costRate: Number(user.costRate ?? 0),
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);
  }
}
