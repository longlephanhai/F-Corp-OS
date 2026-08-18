import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ResponseMessage, SkipCheckPermission, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) { }

  @Post()
  @SkipCheckPermission()
  @ResponseMessage('Skill created successfully')
  create(@Body() createSkillDto: CreateSkillDto, @User() user: IUser) {
    return this.skillsService.create(createSkillDto, user);
  }

  @Get('all')
  @SkipCheckPermission()
  findAllWithoutPagination(@User() user: IUser) {
    return this.skillsService.findAll(1, 0, '', user);
  }

  @Get()
  @SkipCheckPermission()
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
    @User() user: IUser
  ) {
    return this.skillsService.findAll(+currentPage, +limit, qs, user);
  }


  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IUser) {
    return this.skillsService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(+id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(+id);
  }
}
