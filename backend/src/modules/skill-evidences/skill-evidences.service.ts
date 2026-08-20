import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm'; // Import thêm DeepPartial để fix lỗi 4
import { SkillEvidence } from './entities/skill-evidence.entity';
import { UserSkill } from 'modules/user-skill/entities/user-skill.entity';
import { NotificationsGateway } from 'modules/projects/notifications.gateway';
import { Notification } from '../notifications/entities/notification.entity';

// 💥 Đã đổi thành chữ IN HOA cho khớp với Entity của bác!
export type EvidenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class VerifyEvidenceDto {
  status: EvidenceStatus;
  rejectReason?: string;
}

@Injectable()
export class SkillEvidencesService {
  constructor(
    @InjectRepository(SkillEvidence)
    private readonly evidenceRepo: Repository<SkillEvidence>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
    @InjectRepository(Notification) private notiRepo: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async verifyEvidence(id: string, updateData: VerifyEvidenceDto) {
    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: {
        userSkill: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException('Không tìm thấy Bằng chứng này');
    }

    evidence.status = updateData.status;
    if (updateData.rejectReason) {
      evidence.rejectReason = updateData.rejectReason;
    }

    await this.evidenceRepo.save(evidence);

    // 💥 Đổi thành APPROVED cho khớp hệ thống
    if (updateData.status === 'APPROVED' && evidence.userSkill) {
      evidence.userSkill.confidenceScore = 100;
      await this.userSkillRepo.save(evidence.userSkill);
    }

    return evidence;
  }

  async uploadEvidence(data: any) {
    // 1. Lưu bằng chứng
    const newEvidence = this.evidenceRepo.create({
      ...data,
      status: 'pending',
    });
    const savedEvidence: any = await this.evidenceRepo.save(newEvidence);

    // 2. LƯU THÔNG BÁO XUỐNG DATABASE TRƯỚC
    const newNoti = this.notiRepo.create({
      title: 'Bằng chứng mới chờ duyệt',
      description: `Một Dev vừa nộp chứng chỉ mới. Vui lòng vào My Team kiểm tra!`,
      type: 'info',
      read: false,
      userId: 'f7eda42f-9952-11f1-9179-f875a4fd08ad', // Tạm để ALL (Gửi cho tất cả PM). Sau này có Auth thì truyền ID cụ thể
    });
    const savedNoti = await this.notiRepo.save(newNoti);

    // 3. BẮN TÍN HIỆU SOCKET (Kèm theo data vừa lưu từ DB)
    this.notificationsGateway.emitToPM('new_notification', {
      id: savedNoti.id,
      title: savedNoti.title,
      description: savedNoti.description,
      type: savedNoti.type,
      read: savedNoti.read,
      time: 'Vừa xong',
    });

    return savedEvidence;
  }

  async getNotifications() {
    console.log(' Đang kéo thông báo từ Database...');  

     
    const data = await this.notiRepo.find({
      order: { createdAt: 'DESC' },
    });

    console.log(' Dữ liệu tìm thấy:', data);  
    return data;
  }

  async markAllAsRead() {
    await this.notiRepo.update({}, { read: true });
    return { success: true };
  }

  async markAsRead(id: string) {
    await this.notiRepo.update(id, { read: true });
    return { success: true };
  }
}
