import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSprint, UserSprintStatus } from './entities/user-sprint.entity';

@Injectable()
export class UserSprintService {
  constructor(
    @InjectRepository(UserSprint)
    private userSprintRepo: Repository<UserSprint>,
  ) {}

  // 1. Lấy danh sách nhân sự tham gia Sprint (Có JOIN với bảng User để lấy Tên, Email)
  async getSprintUsers(sprintId: string) {
    const records = await this.userSprintRepo.find({
      where: { sprintId },
      relations: { user: true }, // Tự động móc thông tin user từ DB lên
      select: {
        user: {
          id: true,
          fullName: true,
          email: true,
        }
      }
    });
    return records;
  }

  // 2. PM gửi yêu cầu gán nhân sự
  async assignUserToSprint(data: any) {
    const newUserSprint = this.userSprintRepo.create({
      sprintId: data.sprintId,
      userId: data.userId,
      percitant: data.percitant,
      status: data.status || 'requested',
    });
    return await this.userSprintRepo.save(newUserSprint);
  }

  // 3. Cập nhật trạng thái (assigned / released)
  async updateStatus(id: string, status: UserSprintStatus) {
    const record = await this.userSprintRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');
    
    record.status = status;
    return await this.userSprintRepo.save(record);
  }



  // Hàm Giải phóng & Lưu đánh giá
  async releaseUser(id: string, reviewData: any) {
    const record = await this.userSprintRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Không tìm thấy bản ghi phân bổ này!');
    }
    
    // Cập nhật trạng thái và thông tin đánh giá
    record.status = 'released' as any; // Ép kiểu theo Enum của bạn
    record.hardSkillRate = reviewData.hardSkillRate;
    record.softSkillRate = reviewData.softSkillRate;
    record.reviewComment = reviewData.reviewComment;

    return await this.userSprintRepo.save(record);
  }
}
