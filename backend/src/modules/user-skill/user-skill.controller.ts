import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserSkillService } from './user-skill.service';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { ResponseMessage, SkipCheckPermission, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@Controller('user-skill')
export class UserSkillController {
  constructor(private readonly userSkillService: UserSkillService) { }

  @Post()
  @ResponseMessage('Create user skill successfully')
  @SkipCheckPermission()
  create(@Body() createUserSkillDto: CreateUserSkillDto, @User() user: IUser) {
    return this.userSkillService.create(createUserSkillDto, user);
  }

  @Get()
  findAll() {
    return this.userSkillService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userSkillService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserSkillDto: UpdateUserSkillDto) {
    return this.userSkillService.update(+id, updateUserSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userSkillService.remove(+id);
  }
}
