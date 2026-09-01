import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { console } from 'inspector/promises';
import { SkipCheckPermission } from 'decorator/customize';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AddProjectManagerDto } from './dto/add-project-manager.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Post()
  async createProject(@Body() body: any) {
    const data = await this.projectsService.createProject(body);
    return { statusCode: 201, message: 'Tạo dự án thành công', data };
  }

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get('my-projects')
  async getMyProjects(@Req() req: any) {
    console.log('vcl khánh', req.user); // Debug: In ra thông tin user từ request
    const pmId = req.user.id;

    const data = await this.projectsService.getMyProjects(pmId);
    return {
      statusCode: 200,
      message: 'Lấy danh sách dự án của tôi thành công',
      data,
    };
  }

  // ==========================================
  // PROJECT MANAGERS
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get(':projectId/managers')
  async getProjectManagers(
    @Param('projectId')
    projectId: string,
  ) {
    const data = await this.projectsService.getProjectManagers(projectId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách Project Manager thành công',

      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Post(':projectId/managers')
  async addProjectManager(
    @Param('projectId')
    projectId: string,

    @Body()
    body: AddProjectManagerDto,
  ) {
    const data = await this.projectsService.addProjectManager(
      projectId,
      body.userId,
    );

    return {
      statusCode: 201,

      message: 'Thêm Co-PM thành công',

      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Delete(':projectId/managers/:userId')
  async removeProjectManager(
    @Param('projectId')
    projectId: string,

    @Param('userId')
    userId: string,
  ) {
    const data = await this.projectsService.removeProjectManager(
      projectId,
      userId,
    );

    return {
      statusCode: 200,

      message: 'Xóa Co-PM thành công',

      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    // BÙM! Sửa tên hàm gọi xuống Service ở dòng này:
    const data = await this.projectsService.getProjectDetailWithBudget(id);

    return {
      statusCode: 200,
      message: 'Lấy chi tiết dự án kèm ngân sách thành công',
      data,
    };
  }

  @Get()
  async getAllProjects() {
    const data = await this.projectsService.getAllProjects();
    return { statusCode: 200, message: 'Lấy danh sách dự án thành công', data };
  }
}
