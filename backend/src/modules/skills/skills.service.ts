import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { IUser } from 'common/types/user.interface';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SkillsService {

  constructor(
    @InjectRepository(Skill) private skillsRepository: Repository<Skill>
  ) { }

  async create(createSkillDto: CreateSkillDto, user: IUser) {
    const isExist = await this.skillsRepository.findOne({
      where: { name: createSkillDto.name }
    });

    if (isExist) {
      throw new BadRequestException('Skill name already exists');
    }
    const skills = this.skillsRepository.create({
      ...createSkillDto,
      createdBy: {
        id: user.id,
        email: user.email
      }
    });
    return this.skillsRepository.save(skills);
  }

  findAll() {
    return `This action returns all skills`;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
