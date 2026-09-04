import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';

import { AddProjectManagerDto } from './dto/add-project-manager.dto';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmAccessService } from '../pm-access/pm-access.service';

import { SkipCheckPermission } from 'decorator/customize';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,

    private readonly pmAccessService: PmAccessService,
  ) {}

  // ==========================================
  // CREATE PROJECT
  //
  // PM tạo Project thì chính PM đang đăng nhập
  // trở thành Primary PM.
  //
  // Không tin pmId gửi từ frontend.
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Post()
  async createProject(
    @Body()
    body: any,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    const data = await this.projectsService.createProject({
      ...body,

      // Không cho client tự gán Project
      // cho một PM bất kỳ.
      pmId: currentUserId,
    });

    return {
      statusCode: 201,

      message: 'Tạo dự án thành công',

      data,
    };
  }

  // ==========================================
  // MY PROJECTS
  //
  // Không cần assertProjectAccess().
  //
  // Chính service getMyProjects()
  // đang resolve phạm vi:
  //
  // Primary PM
  // OR
  // Co-PM
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get('my-projects')
  async getMyProjects(
    @Req()
    req: any,
  ) {
    const pmId = req.user.id;

    const data = await this.projectsService.getMyProjects(pmId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách dự án của tôi thành công',

      data,
    };
  }

  // ==========================================
  // PROJECT MANAGER CANDIDATES
  //
  // PRIMARY PM ONLY
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get(':projectId/manager-candidates')
  async searchProjectManagerCandidates(
    @Param('projectId')
    projectId: string,

    @Query('search')
    search: string | undefined,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    await this.pmAccessService.assertPrimaryProjectManager(
      currentUserId,
      projectId,
    );

    const data = await this.projectsService.searchProjectManagerCandidates(
      projectId,
      search,
    );

    return {
      statusCode: 200,

      message: 'Lấy danh sách PM có thể thêm thành công',

      data,
    };
  }

  // ==========================================
  // GET PROJECT MANAGERS
  //
  // Primary PM và Co-PM đều được xem.
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get(':projectId/managers')
  async getProjectManagers(
    @Param('projectId')
    projectId: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    await this.pmAccessService.assertProjectAccess(currentUserId, projectId);

    const data = await this.projectsService.getProjectManagers(projectId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách Project Manager thành công',

      data,
    };
  }

  // ==========================================
  // ADD CO-PM
  //
  // PRIMARY PM ONLY
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Post(':projectId/managers')
  async addProjectManager(
    @Param('projectId')
    projectId: string,

    @Body()
    body: AddProjectManagerDto,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    await this.pmAccessService.assertPrimaryProjectManager(
      currentUserId,
      projectId,
    );

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

  // ==========================================
  // REMOVE CO-PM
  //
  // PRIMARY PM ONLY
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Delete(':projectId/managers/:userId')
  async removeProjectManager(
    @Param('projectId')
    projectId: string,

    @Param('userId')
    userId: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    await this.pmAccessService.assertPrimaryProjectManager(
      currentUserId,
      projectId,
    );

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

  // ==========================================
  // PROJECT DETAIL
  //
  // Primary PM hoặc Co-PM.
  //
  // Biết UUID Project cũng không bypass được.
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @SkipCheckPermission()
  @Get(':id')
  async getProjectById(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    await this.pmAccessService.assertProjectAccess(currentUserId, id);

    const data = await this.projectsService.getProjectDetailWithBudget(id);

    return {
      statusCode: 200,

      message: 'Lấy chi tiết dự án kèm ngân sách thành công',

      data,
    };
  }
}
