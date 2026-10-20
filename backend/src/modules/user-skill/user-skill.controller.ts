import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserSkillService } from './user-skill.service';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { ResponseMessage, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@Controller('user-skill')
export class UserSkillController {
  constructor(private readonly userSkillService: UserSkillService) { }

  @Post()
  @ResponseMessage('Create user skill successfully')
  create(@Body() createUserSkillDto: CreateUserSkillDto, @User() user: IUser) {
    return this.userSkillService.create(createUserSkillDto, user);
  }

  @Get('skill-tree')
  @ResponseMessage('Get skill tree successfully')
  getSkillTree(@User() user: IUser) {
    return this.userSkillService.getSkillTree(user);
  }

  @Get()
  findAll(@User() user: IUser) {
    return this.userSkillService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IUser) {
    return this.userSkillService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserSkillDto: UpdateUserSkillDto,
    @User() user: IUser,
  ) {
    return this.userSkillService.update(id, updateUserSkillDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.userSkillService.remove(id, user);
  }
}
