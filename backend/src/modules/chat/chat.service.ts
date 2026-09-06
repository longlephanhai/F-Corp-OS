import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { Project } from 'modules/projects/entities/project.entity';
import { Sprint } from 'modules/sprints/entities/sprint.entity';
import {
  UserSprint,
  UserSprintStatus,
} from 'modules/user-sprints/entities/user-sprint.entity';
import { User } from 'modules/users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(UserSprint)
    private readonly userSprintRepo: Repository<UserSprint>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Lấy danh sách ID của tất cả nhân sự "thuộc" 1 Dự án:
  // - Chủ dự án (PM)
  // - Bất kỳ ai đang được gán (status = ASSIGNED) vào 1 Sprint thuộc Dự án đó
  async getProjectMemberIds(projectId: string): Promise<string[]> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy Dự án này');
    }

    const sprints = await this.sprintRepo.find({
      where: { projectId },
      select: { id: true },
    });
    const sprintIds = sprints.map((s) => s.id);

    const memberIds = new Set<string>();
    if (project.pmId) memberIds.add(project.pmId);

    if (sprintIds.length > 0) {
      const userSprints = await this.userSprintRepo.find({
        where: {
          sprintId: In(sprintIds),
          status: UserSprintStatus.ASSIGNED,
        },
        select: { userId: true },
      });
      userSprints.forEach((us) => memberIds.add(us.userId));
    }

    return Array.from(memberIds);
  }

  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const memberIds = await this.getProjectMemberIds(projectId);
    return memberIds.includes(userId);
  }

  // Danh sách thành viên (kèm thông tin cơ bản) để hiển thị trên UI chat
  async getMembers(projectId: string) {
    const memberIds = await this.getProjectMemberIds(projectId);
    if (memberIds.length === 0) return [];

    const users = await this.userRepo.find({
      where: { id: In(memberIds) },
      select: { id: true, fullName: true, email: true, title: true },
    });
    return users;
  }

  // Lịch sử tin nhắn của phòng chat 1 Dự án (mới nhất ở cuối mảng)
  async getMessages(projectId: string, limit = 100) {
    const messages = await this.chatMessageRepo.find({
      where: { projectId },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse().map((m) => this.toPlain(m));
  }

  async createMessage(projectId: string, senderId: string, content: string) {
    const entity = this.chatMessageRepo.create({
      projectId,
      senderId,
      content,
    });
    const saved = await this.chatMessageRepo.save(entity);

    const full = await this.chatMessageRepo.findOne({
      where: { id: saved.id },
      relations: { sender: true },
    });
    return this.toPlain(full!);
  }

  private toPlain(m: ChatMessage) {
    return {
      id: m.id,
      projectId: m.projectId,
      content: m.content,
      createdAt: m.createdAt,
      sender: {
        id: m.sender?.id,
        fullName: m.sender?.fullName,
        email: m.sender?.email,
      },
    };
  }
}