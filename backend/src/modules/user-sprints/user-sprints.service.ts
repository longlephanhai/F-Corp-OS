import { Injectable } from '@nestjs/common';
import { CreateUserSprintDto } from './dto/create-user-sprint.dto';
import { UpdateUserSprintDto } from './dto/update-user-sprint.dto';

@Injectable()
export class UserSprintsService {
  create(createUserSprintDto: CreateUserSprintDto) {
    return 'This action adds a new userSprint';
  }

  findAll() {
    return `This action returns all userSprints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userSprint`;
  }

  update(id: number, updateUserSprintDto: UpdateUserSprintDto) {
    return `This action updates a #${id} userSprint`;
  }

  remove(id: number) {
    return `This action removes a #${id} userSprint`;
  }
}
