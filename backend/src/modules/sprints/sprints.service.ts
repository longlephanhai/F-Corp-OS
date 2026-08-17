import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { Sprint } from './entities/sprint.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
  ) {}

  create(createSprintDto: CreateSprintDto) {
    return 'This action adds a new sprint';
  }

  findAll() {
    return `This action returns all sprints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sprint`;
  }

  update(id: number, updateSprintDto: UpdateSprintDto) {
    return `This action updates a #${id} sprint`;
  }

  remove(id: number) {
    return `This action removes a #${id} sprint`;
  }

  async getSprintsByProject(projectId: string) {
    return await this.sprintRepo.find({
      where: {
        project: {
          id: projectId,
        },
      },
      relations: {
        project: true,
      },
      order: {
        startDate: 'ASC',
      },
    });
  }

  async createSprint(data: any) {
    const newSprint = this.sprintRepo.create({
      name: data.name,
      project: {
        id: data.projectId,
      },
      startDate: data.startDate,
      endDate: data.endDate,
      attendant: data.attendant,
      status: 'upcoming',
    });

    return await this.sprintRepo.save(newSprint);
  }
}
