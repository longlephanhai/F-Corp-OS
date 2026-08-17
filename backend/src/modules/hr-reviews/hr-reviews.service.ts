import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUser } from 'common/types/user.interface';
import { Repository } from 'typeorm';
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
    record.updatedBy = { id: user.id, email: user.email };

    return this.reviewRecordRepository.save(record);
  }
}
