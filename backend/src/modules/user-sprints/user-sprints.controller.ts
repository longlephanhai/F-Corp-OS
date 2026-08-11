import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserSprintsService } from './user-sprints.service';
import { CreateUserSprintDto } from './dto/create-user-sprint.dto';
import { UpdateUserSprintDto } from './dto/update-user-sprint.dto';

@Controller('user-sprints')
export class UserSprintsController {
  constructor(private readonly userSprintsService: UserSprintsService) {}

  @Post()
  create(@Body() createUserSprintDto: CreateUserSprintDto) {
    return this.userSprintsService.create(createUserSprintDto);
  }

  @Get()
  findAll() {
    return this.userSprintsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userSprintsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserSprintDto: UpdateUserSprintDto) {
    return this.userSprintsService.update(+id, updateUserSprintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userSprintsService.remove(+id);
  }
}
