import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { console } from 'inspector/promises';
import { SkipCheckPermission } from 'decorator/customize';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

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
