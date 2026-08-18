import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewCycleStatus, ReviewRecordStatus } from 'common/enum/hr-review.enum';
import type { IUser } from 'common/types/user.interface';
import { User } from 'modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { GetReviewRecordsDto } from './dto/get-review-records.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewCycle } from './entities/review-cycle.entity';
import { ReviewRecord } from './entities/review-record.entity';

/**
 * HrReviewsService — chứa toàn bộ business logic cho phân hệ đánh giá HR.
 * Controller gọi service, service thao tác trực tiếp với Repository (không có lớp Repository tách biệt).
 */
@Injectable()
export class HrReviewsService {
  constructor(
    @InjectRepository(ReviewCycle)
    private readonly reviewCycleRepository: Repository<ReviewCycle>,

    @InjectRepository(ReviewRecord)
    private readonly reviewRecordRepository: Repository<ReviewRecord>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Lấy danh sách Review Records với phân trang và bộ lọc tùy chọn.
   * Trả về format chuẩn theo guidelines: { meta: { currentPage, pageSize, pages, total }, result }
   */
  async findAllRecords(query: GetReviewRecordsDto) {
    const { page = 1, limit = 10, departmentId, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.reviewRecordRepository
      .createQueryBuilder('record')
      // Join với employee (User) để lấy thông tin nhân viên
      .leftJoinAndSelect('record.employee', 'employee')
      // Join với role của employee để có thể filter theo departmentId
      .leftJoinAndSelect('employee.role', 'role')
      // Join với reviewCycle để lấy thông tin chu kỳ
      .leftJoinAndSelect('record.reviewCycle', 'reviewCycle')
      // Chỉ lấy các record chưa bị soft-delete
      .where('record.isDeleted = :isDeleted', { isDeleted: false });

    // Áp dụng bộ lọc theo status nếu có
    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    // Áp dụng bộ lọc theo departmentId (role_id của nhân viên) nếu có
    if (departmentId) {
      qb.andWhere('role.id = :departmentId', { departmentId });
    }

    // Sắp xếp theo thời gian tạo mới nhất
    qb.orderBy('record.createdAt', 'DESC');

    // Đếm tổng và lấy dữ liệu phân trang
    const [result, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      meta: {
        currentPage: page,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }

  /**
   * Tạo mới một Review Cycle với trạng thái mặc định DRAFT.
   * Validate logic nghiệp vụ: endDate phải sau startDate.
   */
  async createCycle(dto: CreateReviewCycleDto, user: IUser): Promise<ReviewCycle> {
    const start = new Date(dto.startDate);
    const end   = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException('endDate phải sau startDate');
    }

    const auditUser = { id: user?.id ?? '', email: user?.email ?? '' };

    // 1. Tạo và lưu ReviewCycle
    const cycle = this.reviewCycleRepository.create({
      name:      dto.name,
      startDate: start,
      endDate:   end,
      status:    ReviewCycleStatus.DRAFT,
      createdBy: auditUser,
      updatedBy: auditUser,
    });

    const savedCycle = await this.reviewCycleRepository.save(cycle);

    // 2. Nếu có employeeIds, tự động tạo ReviewRecord PENDING cho từng nhân viên
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      const records = dto.employeeIds.map((empId) =>
        this.reviewRecordRepository.create({
          // TypeORM chấp nhận relation partial { id } — không cần fetch full entity
          employee:    { id: empId } as any,
          reviewCycle: savedCycle,
          status:      ReviewRecordStatus.PENDING,
          createdBy:   auditUser,
          updatedBy:   auditUser,
        }),
      );

      // Bulk-save toàn bộ records trong một lần gọi DB
      await this.reviewRecordRepository.save(records);
    }

    return savedCycle;
  }

  /**
   * Trả về số liệu tổng hợp của toàn bộ Review Records (không phân trang).
   * Dùng Promise.all để chạy 4 query COUNT song song, tối ưu performance.
   */
  async getRecordStats(): Promise<{
    total: number;
    pending: number;
    inReview: number;
    completed: number;
  }> {
    const baseWhere = { isDeleted: false };

    const [total, pending, inReview, completed] = await Promise.all([
      this.reviewRecordRepository.count({ where: baseWhere }),
      this.reviewRecordRepository.count({
        where: { ...baseWhere, status: ReviewRecordStatus.PENDING },
      }),
      this.reviewRecordRepository.count({
        where: { ...baseWhere, status: ReviewRecordStatus.IN_REVIEW },
      }),
      this.reviewRecordRepository.count({
        where: { ...baseWhere, status: ReviewRecordStatus.COMPLETED },
      }),
    ]);

    return { total, pending, inReview, completed };
  }

  /**
   * Lấy chi tiết một Review Record theo ID, bao gồm đầy đủ relations:
   * employee (và role của employee), reviewCycle.
   * Throw NotFoundException nếu record không tồn tại hoặc đã bị xóa mềm.
   */
  async getRecordById(id: string): Promise<ReviewRecord> {
    const record = await this.reviewRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.employee', 'employee')
      .leftJoinAndSelect('employee.role', 'role')
      .leftJoinAndSelect('record.reviewCycle', 'reviewCycle')
      .where('record.id = :id', { id })
      .andWhere('record.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!record) {
      throw new NotFoundException(`Review record with id "${id}" not found`);
    }

    return record;
  }

  /**
   * Cập nhật trạng thái và điểm số của một Review Record cụ thể.
   * Throw NotFoundException nếu không tìm thấy record.
   * Tự động cập nhật audit field `updatedBy` bằng thông tin user đang đăng nhập.
   */
  async updateRecordStatus(
    id: string,
    updateDto: UpdateReviewStatusDto,
    user: IUser,
  ): Promise<ReviewRecord> {
    const record = await this.reviewRecordRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!record) {
      throw new NotFoundException(`Review record with id "${id}" not found`);
    }

    // Cập nhật các field nghiệp vụ
    record.status = updateDto.status;
    if (updateDto.finalScore !== undefined) {
      record.finalScore = updateDto.finalScore;
    }

    // Cập nhật audit field `updatedBy` với thông tin người dùng hiện tại
    // Optional chaining đảm bảo không crash ngay cả khi user bị undefined
    // (bảo vệ phòng ngừa — sau khi fix @SkipCheckPermission(), user luôn có giá trị)
    record.updatedBy = { id: user?.id ?? '', email: user?.email ?? '' };

    return this.reviewRecordRepository.save(record);
  }

  // ---------------------------------------------------------------------------
  // SEED — CHỈ DÙNG CHO MỤC ĐÍCH TEST, KHÔNG DÙNG TRONG PRODUCTION
  // ---------------------------------------------------------------------------

  /**
   * Tạo dữ liệu mẫu (2 ReviewCycle + 8 ReviewRecord) vào database để test UI.
   * Endpoint này được bảo vệ bằng @Public() và chỉ nên dùng trong môi trường dev.
   */
  async seedData(): Promise<{ message: string; cyclesCreated: number; recordsCreated: number }> {
    // 1. Lấy tối đa 5 user hiện có trong DB
    const users = await this.userRepository.find({
      take: 5,
      where: { isDeleted: false },
    });

    if (users.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy user nào trong DB. Vui lòng tạo ít nhất 1 user trước khi chạy seed.',
      );
    }

    // Identity ảo dùng cho audit field (endpoint này bỏ qua JWT)
    const SEED_USER = { id: 'seed-script', email: 'seed@system.local' };

    // 2. Tạo 2 Review Cycles mẫu
    const cycleDefinitions = [
      {
        name: 'Đánh giá Năng lực Quý 3/2026',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-09-30'),
        status: ReviewCycleStatus.ACTIVE,
      },
      {
        name: 'Đánh giá Năng lực Quý 4/2026',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-31'),
        status: ReviewCycleStatus.DRAFT,
      },
    ];

    const savedCycles: ReviewCycle[] = [];
    for (const def of cycleDefinitions) {
      const cycle = this.reviewCycleRepository.create({
        ...def,
        createdBy: SEED_USER,
        updatedBy: SEED_USER,
      });
      savedCycles.push(await this.reviewCycleRepository.save(cycle));
    }

    // 3. Tạo 8 Review Records: phân bổ đều các trạng thái và điểm số ngẫu nhiên
    const STATUS_POOL: ReviewRecordStatus[] = [
      ReviewRecordStatus.PENDING,
      ReviewRecordStatus.PENDING,
      ReviewRecordStatus.PENDING,
      ReviewRecordStatus.IN_REVIEW,
      ReviewRecordStatus.IN_REVIEW,
      ReviewRecordStatus.COMPLETED,
      ReviewRecordStatus.COMPLETED,
      ReviewRecordStatus.COMPLETED,
    ];

    const recordsToCreate: ReviewRecord[] = [];
    for (let i = 0; i < 8; i++) {
      const status = STATUS_POOL[i];
      const cycle = savedCycles[i % savedCycles.length]; // xoay vòng giữa 2 cycle
      const employee = users[i % users.length];           // xoay vòng qua danh sách user

      // finalScore chỉ có nghĩa khi đã COMPLETED
      const finalScore =
        status === ReviewRecordStatus.COMPLETED
          ? Math.round(Math.random() * 40 + 60) // điểm 60–100 khi hoàn thành
          : undefined;

      recordsToCreate.push(
        this.reviewRecordRepository.create({
          status,
          // Chỉ đính kèm finalScore khi có giá trị; nếu không thì để DB tự lưu NULL
          ...(finalScore !== undefined ? { finalScore } : {}),
          reviewCycle: cycle,
          employee,
          createdBy: SEED_USER,
          updatedBy: SEED_USER,
        }),
      );
    }

    await this.reviewRecordRepository.save(recordsToCreate);

    return {
      message: `Seed thành công! Đã tạo ${savedCycles.length} chu kỳ và ${recordsToCreate.length} bản ghi đánh giá.`,
      cyclesCreated: savedCycles.length,
      recordsCreated: recordsToCreate.length,
    };
  }
}
