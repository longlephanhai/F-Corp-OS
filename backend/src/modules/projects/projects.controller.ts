import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getAllProjects() {
    const data = await this.projectsService.getAllProjects();
    return { statusCode: 200, message: 'Lấy danh sách dự án thành công', data };
  }

  @Post()
  async createProject(@Body() body: any) {
    const data = await this.projectsService.createProject(body);
    return { statusCode: 201, message: 'Tạo dự án thành công', data };
  }
}