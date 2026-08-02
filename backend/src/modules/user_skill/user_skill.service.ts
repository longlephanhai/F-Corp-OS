import { Injectable } from '@nestjs/common';
import { CreateUserSkillDto } from './dto/create-user_skill.dto';
import { UpdateUserSkillDto } from './dto/update-user_skill.dto';

@Injectable()
export class UserSkillService {
  create(createUserSkillDto: CreateUserSkillDto) {
    return 'This action adds a new userSkill';
  }

  findAll() {
    return `This action returns all userSkill`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userSkill`;
  }

  update(id: number, updateUserSkillDto: UpdateUserSkillDto) {
    return `This action updates a #${id} userSkill`;
  }

  remove(id: number) {
    return `This action removes a #${id} userSkill`;
  }
}
