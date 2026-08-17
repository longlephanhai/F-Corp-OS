import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private projectRepo: Repository<Project>) {}

  async getAllProjects() {
    return await this.projectRepo.find({ order: { startDate: 'DESC' } });
  }

  async createProject(data: any) {
    const newProject = this.projectRepo.create({
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
    });
    return await this.projectRepo.save(newProject);
  }
}