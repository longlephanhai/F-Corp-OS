import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { SkipCheckPermission } from 'decorator/customize';

import { SprintsService } from './sprints.service';

import { CreateSprintDto } from './dto/create-sprint.dto';

import { UpdateSprintDto } from './dto/update-sprint.dto';

import { UpdateSprintStatusDto } from './dto/update-sprint-status.dto';

@SkipCheckPermission()
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  // ==========================================
  // CREATE
  //
  // POST /sprints
  // ==========================================

  @Post()
  async create(
    @Body()
    createSprintDto: CreateSprintDto,
  ) {
    const data = await this.sprintsService.create(createSprintDto);

    return {
      statusCode: 201,

      message: 'Tạo Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET ALL
  //
  // GET /sprints
  // ==========================================

  @Get()
  async findAll() {
    const data = await this.sprintsService.findAll();

    return {
      statusCode: 200,

      message: 'Lấy danh sách Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET BY PROJECT
  //
  // GET /sprints/project/:projectId
  // ==========================================

  @Get('project/:projectId')
  async getSprintsByProject(
    @Param('projectId')
    projectId: string,
  ) {
    const data = await this.sprintsService.getSprintsByProject(projectId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET ONE
  //
  // GET /sprints/:id
  // ==========================================

  @Get(':id/readiness')
  async getStartReadiness(
    @Param('id')
    id: string,
  ) {
    const data = await this.sprintsService.getStartReadiness(id);

    return {
      statusCode: 200,

      message: 'Kiểm tra Sprint readiness thành công',

      data,
    };
  }

  @Get(':id/completion-readiness')
  async getCompletionReadiness(
    @Param('id')
    id: string,
  ) {
    const data = await this.sprintsService.getCompletionReadiness(id);

    return {
      statusCode: 200,

      message: 'Kiểm tra điều kiện hoàn thành Sprint thành công',

      data,
    };
  }
  @Get(':id/retrospective')
  async getRetrospective(
    @Param('id')
    id: string,
  ) {
    const data = await this.sprintsService.getSprintRetrospective(id);

    return {
      statusCode: 200,

      message: 'Lấy Sprint retrospective thành công',

      data,
    };
  }
  @Get('project/:projectId/retrospective-trends')
  async getProjectSprintTrends(
    @Param('projectId')
    projectId: string,

    @Query('limit')
    limit?: string,
  ) {
    const data = await this.sprintsService.getProjectSprintTrends(
      projectId,
      Number(limit) || 5,
    );

    return {
      statusCode: 200,

      message: 'Lấy xu hướng Sprint thành công',

      data,
    };
  }

  
  @Get(':id')
  async findOne(
    @Param('id')
    id: string,
  ) {
    const data = await this.sprintsService.findOne(id);

    return {
      statusCode: 200,

      message: 'Lấy Sprint thành công',

      data,
    };
  }

  // ==========================================
  // UPDATE STATUS
  //
  // PATCH /sprints/:id/status
  //
  // Đặt trước PATCH :id
  // ==========================================

  @Patch(':id/status')
  async updateStatus(
    @Param('id')
    id: string,

    @Body()
    updateSprintStatusDto: UpdateSprintStatusDto,
  ) {
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
  // UPDATE INFORMATION
  //
  // PATCH /sprints/:id
  // ==========================================

  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    updateSprintDto: UpdateSprintDto,
  ) {
    const data = await this.sprintsService.update(id, updateSprintDto);

    return {
      statusCode: 200,

      message: 'Cập nhật Sprint thành công',

      data,
    };
  }

  // ==========================================
  // DELETE
  //
  // DELETE /sprints/:id
  // ==========================================

  @Delete(':id')
  async remove(
    @Param('id')
    id: string,
  ) {
    const data = await this.sprintsService.remove(id);

    return {
      statusCode: 200,

      message: 'Xóa Sprint thành công',

      data,
    };
  }
}
