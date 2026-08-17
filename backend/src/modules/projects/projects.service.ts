import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  // async getAllProjects() {
  //   return await this.projectRepo.find({ order: { startDate: 'DESC' } });
  // }

  async createProject(data: any) {
    const newProject = this.projectRepo.create({
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',

      pmId: data.pmId,
    });
    return await this.projectRepo.save(newProject);
  }

  // Lấy chi tiết 1 Dự án
  async getProjectById(id: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: {
        pm: true,
      }, // JOIN bảng User để lấy tên ông Quản lý (PM)
    });

    if (!project) {
      throw new NotFoundException('Không tìm thấy Dự án này');
    }
    return project;
  }

  // Lấy danh sách dự án (Có móc nối với tên PM)
  async getAllProjects() {
    return await this.projectRepo.find({
      relations: {
        pm: true,
      },
      order: { startDate: 'DESC' }, // Dự án mới nhất xếp lên đầu
    });
  }

  // Lấy danh sách dự án DO CHÍNH PM ĐÓ QUẢN LÝ
  async getMyProjects(pmId: string) {
    return await this.projectRepo.find({
      where: {
        pmId: pmId, // Chỉ lấy dự án có pm_id khớp với ID của người đang login
        isDeleted: false,
      },
      relations: {
        pm: true,
      },
      order: { startDate: 'DESC' },
    });
  }
}
