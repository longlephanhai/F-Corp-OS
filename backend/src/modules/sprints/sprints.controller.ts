import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SkipCheckPermission } from 'decorator/customize';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

import { PmAccessService } from '../pm-access/pm-access.service';

import { SprintsService } from './sprints.service';

import { CreateSprintDto } from './dto/create-sprint.dto';

import { UpdateSprintDto } from './dto/update-sprint.dto';

import { UpdateSprintStatusDto } from './dto/update-sprint-status.dto';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('sprints')
export class SprintsController {
  constructor(
    private readonly sprintsService: SprintsService,

    private readonly pmAccessService: PmAccessService,
  ) {}

  // ==========================================
  // CREATE SPRINT
  //
  // POST /sprints
  //
  // Primary PM hoặc Co-PM của Project
  // mới được tạo Sprint.
  // ==========================================

  @Post()
  async create(
    @Body()
    createSprintDto: CreateSprintDto,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // PROJECT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertProjectAccess(
      currentUserId,
      createSprintDto.projectId,
    );

    // ========================================
    // BUSINESS
    // ========================================

    const data = await this.sprintsService.create(createSprintDto);

    return {
      statusCode: 201,

      message: 'Tạo Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET SPRINTS BY PROJECT
  //
  // GET /sprints/project/:projectId
  // ==========================================

  @Get('project/:projectId')
  async getSprintsByProject(
    @Param('projectId')
    projectId: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // PROJECT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertProjectAccess(currentUserId, projectId);

    const data = await this.sprintsService.getSprintsByProject(projectId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách Sprint thành công',

      data,
    };
  }

  // ==========================================
  // PROJECT SPRINT RETROSPECTIVE TRENDS
  //
  // GET
  // /sprints/project/:projectId/retrospective-trends
  //
  // Đây là Project-level API nên guard
  // bằng assertProjectAccess().
  // ==========================================

  @Get('project/:projectId/retrospective-trends')
  async getProjectSprintTrends(
    @Param('projectId')
    projectId: string,

    @Query('limit')
    limit: string | undefined,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // PROJECT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertProjectAccess(currentUserId, projectId);

    const parsedLimit = Number(limit);

    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;

    const data = await this.sprintsService.getProjectSprintTrends(
      projectId,
      safeLimit,
    );

    return {
      statusCode: 200,

      message: 'Lấy xu hướng Sprint thành công',

      data,
    };
  }

  // ==========================================
  // START READINESS
  //
  // GET /sprints/:id/readiness
  // ==========================================

  @Get(':id/readiness')
  async getStartReadiness(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.getStartReadiness(id);

    return {
      statusCode: 200,

      message: 'Kiểm tra Sprint readiness thành công',

      data,
    };
  }

  // ==========================================
  // COMPLETION READINESS
  //
  // GET /sprints/:id/completion-readiness
  // ==========================================

  @Get(':id/completion-readiness')
  async getCompletionReadiness(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.getCompletionReadiness(id);

    return {
      statusCode: 200,

      message: 'Kiểm tra điều kiện hoàn thành Sprint thành công',

      data,
    };
  }

  // ==========================================
  // SPRINT RETROSPECTIVE
  //
  // GET /sprints/:id/retrospective
  // ==========================================

  @Get(':id/retrospective')
  async getRetrospective(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.getSprintRetrospective(id);

    return {
      statusCode: 200,

      message: 'Lấy Sprint retrospective thành công',

      data,
    };
  }

  // ==========================================
  // PLANNING FORECAST
  //
  // GET /sprints/:id/planning-forecast
  // ==========================================

  @Get(':id/planning-forecast')
  async getPlanningForecast(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.getSprintPlanningForecast(id);

    return {
      statusCode: 200,

      message: 'Lấy Sprint planning forecast thành công',

      data,
    };
  }

  // ==========================================
  // UPDATE SPRINT STATUS
  //
  // PATCH /sprints/:id/status
  //
  // Đặt trước PATCH /:id
  // ==========================================

  @Patch(':id/status')
  async updateStatus(
    @Param('id')
    id: string,

    @Body()
    updateSprintStatusDto: UpdateSprintStatusDto,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    // ========================================
    // BUSINESS LIFECYCLE
    //
    // Lifecycle validation vẫn nằm Service.
    // Access layer không duplicate logic này.
    // ========================================

    const data = await this.sprintsService.updateStatus(
      id,
      updateSprintStatusDto,
    );

    return {
      statusCode: 200,

      message: 'Cập nhật trạng thái Sprint thành công',

      data,
    };
  }

  // ==========================================
  // UPDATE SPRINT INFORMATION
  //
  // PATCH /sprints/:id
  // ==========================================

  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    updateSprintDto: UpdateSprintDto,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.update(id, updateSprintDto);

    return {
      statusCode: 200,

      message: 'Cập nhật Sprint thành công',

      data,
    };
  }

  // ==========================================
  // DELETE / ARCHIVE SPRINT
  //
  // DELETE /sprints/:id
  // ==========================================

  @Delete(':id')
  async remove(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.remove(id);

    return {
      statusCode: 200,

      message: 'Xóa Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET ONE
  //
  // GET /sprints/:id
  //
  // Generic :id route để CUỐI controller.
  // ==========================================

  @Get(':id')
  async findOne(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    const currentUserId = req.user.id;

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(currentUserId, id);

    const data = await this.sprintsService.findOne(id);

    return {
      statusCode: 200,

      message: 'Lấy Sprint thành công',

      data,
    };
  }
}
