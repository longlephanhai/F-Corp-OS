import {
  BadRequestException,
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

import { UserSprintService } from './user-sprints.service';

import { UserSprintStatus } from './entities/user-sprint.entity';

@UseGuards(JwtAuthGuard)
@SkipCheckPermission()
@Controller('user-sprint')
export class UserSprintController {
  constructor(
    private readonly userSprintService: UserSprintService,

    private readonly pmAccessService: PmAccessService,
  ) {}

  // ==========================================
  // GET SPRINT ALLOCATIONS
  //
  // GET /user-sprint/sprint/:sprintId
  //
  // Primary PM hoặc Co-PM của Project
  // chứa Sprint mới được xem.
  // ==========================================

  @Get('sprint/:sprintId')
  async getSprintUsers(
    @Param('sprintId')
    sprintId: string,

    @Req()
    req: any,
  ) {
    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(req.user.id, sprintId);

    const data = await this.userSprintService.getSprintUsers(sprintId);

    return {
      statusCode: 200,

      message: 'Lấy danh sách phân bổ Sprint thành công',

      data,
    };
  }

  // ==========================================
  // GET USER CAPACITY FOR TARGET SPRINT
  //
  // GET
  // /user-sprint/capacity/:userId?sprintId=...
  //
  // Chỉ cần ownership của Sprint đích.
  //
  // Capacity service vẫn được phép tính
  // workload từ các Sprint overlap khác.
  // ==========================================

  @Get('capacity/:userId')
  async getUserCapacity(
    @Param('userId')
    userId: string,

    @Query('sprintId')
    sprintId: string,

    @Req()
    req: any,
  ) {
    if (!sprintId) {
      throw new BadRequestException({
        code: 'SPRINT_ID_REQUIRED',

        message: 'Phải truyền sprintId để kiểm tra capacity.',
      });
    }

    // ========================================
    // TARGET SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(req.user.id, sprintId);

    const data = await this.userSprintService.getUserCapacity(userId, sprintId);

    return {
      statusCode: 200,

      message: 'Lấy capacity nhân sự thành công',

      data,
    };
  }

  // ==========================================
  // RESOURCE PLANNER
  //
  // GET /user-sprint/resource-planner
  //
  // Không nhận pmId từ frontend.
  // PM hiện tại luôn lấy từ JWT.
  // ==========================================

  @Get('resource-planner')
  async getResourcePlanner(
    @Req()
    req: any,
  ) {
    const currentPmId = req.user.id;

    const data = await this.userSprintService.getResourcePlanner(currentPmId);

    return {
      statusCode: 200,

      message: 'Lấy Resource Planner thành công',

      data,
    };
  }

  // ==========================================
  // REQUEST ALLOCATION
  //
  // POST /user-sprint
  //
  // PM phải quản lý Project chứa Sprint.
  // ==========================================

  @Post()
  async assignUserToSprint(
    @Body()
    body: any,

    @Req()
    req: any,
  ) {
    // ========================================
    // BASIC INPUT
    // ========================================

    if (!body?.sprintId) {
      throw new BadRequestException({
        code: 'SPRINT_ID_REQUIRED',

        message: 'Yêu cầu phân bổ phải có sprintId.',
      });
    }

    // ========================================
    // SPRINT OWNERSHIP
    // ========================================

    await this.pmAccessService.assertSprintAccess(req.user.id, body.sprintId);

    // ========================================
    // BUSINESS
    //
    // Service tiếp tục chịu trách nhiệm:
    // - duplicate
    // - overlap
    // - capacity
    // - percentage
    // - Sprint mutable
    // ========================================

    const data = await this.userSprintService.assignUserToSprint(body);

    return {
      statusCode: 201,

      message: 'Đã gửi yêu cầu gán nhân sự',

      data,
    };
  }

  // ==========================================
  // SUBMIT FOR APPROVAL
  //
  // REQUESTED
  //     ↓
  // PENDING_APPROVAL
  //
  // PATCH
  // /user-sprint/:id/submit-approval
  // ==========================================

  @Patch(':id/submit-approval')
  async submitForApproval(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(req.user.id, id);

    const data = await this.userSprintService.submitForApproval(id);

    return {
      statusCode: 200,

      message: 'Đã gửi yêu cầu phân bổ để phê duyệt',

      data,
    };
  }

  // ==========================================
  // CANCEL REQUEST
  //
  // DELETE /user-sprint/:id/request
  // ==========================================

  @Delete(':id/request')
  async cancelRequest(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(req.user.id, id);

    const data = await this.userSprintService.cancelRequest(id);

    return {
      statusCode: 200,

      message: 'Đã hủy yêu cầu phân bổ',

      data,
    };
  }

  // ==========================================
  // APPROVE ALLOCATION
  //
  // PATCH /user-sprint/:id
  //
  // Current business flow:
  //
  // PENDING_APPROVAL
  //        ↓
  //     ASSIGNED
  //
  // Service vẫn chịu trách nhiệm state machine
  // và capacity re-check.
  // ==========================================

  @Patch(':id')
  async updateUserSprintStatus(
    @Param('id')
    id: string,

    @Body('status')
    status: string,

    @Req()
    req: any,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(req.user.id, id);

    // ========================================
    // BASIC STATUS PAYLOAD
    // ========================================

    if (!status) {
      throw new BadRequestException({
        code: 'ALLOCATION_STATUS_REQUIRED',

        message: 'Phải truyền trạng thái Allocation.',
      });
    }

    // ========================================
    // BUSINESS STATE MACHINE
    // ========================================

    const data = await this.userSprintService.updateStatus(
      id,
      status as UserSprintStatus,
    );

    return {
      statusCode: 200,

      message: 'Cập nhật trạng thái phân bổ thành công',

      data,
    };
  }

  // ==========================================
  // RELEASE + REVIEW
  //
  // PATCH /user-sprint/:id/release
  //
  // Service tiếp tục chịu trách nhiệm:
  // - ASSIGNED only
  // - Sprint mutable
  // - unfinished Task ownership guard
  // - review data
  // ==========================================

  @Patch(':id/release')
  async releaseUser(
    @Param('id')
    id: string,

    @Body()
    body: any,

    @Req()
    req: any,
  ) {
    // ========================================
    // ALLOCATION OWNERSHIP
    // ========================================

    await this.pmAccessService.assertAllocationAccess(req.user.id, id);

    const data = await this.userSprintService.releaseUser(id, body);

    return {
      statusCode: 200,

      message: 'Giải phóng và đánh giá nhân sự thành công',

      data,
    };
  }
}
