import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Public, SkipCheckPermission } from 'decorator/customize';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@SkipCheckPermission()
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.createSprint(createSprintDto);
  }

  @Get()
  findAll() {
    return this.sprintsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sprintsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSprintDto: UpdateSprintDto) {
    return this.sprintsService.update(+id, updateSprintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintsService.remove(+id);
  }
  @SkipCheckPermission()
  @Get('project/:projectId')
  async getSprintsByProject(@Param('projectId') projectId: string) {
    const data = await this.sprintsService.getSprintsByProject(projectId);
    return {
      statusCode: 200,
      message: 'Lấy danh sách Sprint thành công',
      data,
    };
  }

  @Post()
  async createSprint(@Body() body: any) {
    const data = await this.sprintsService.createSprint(body);
    return { statusCode: 201, message: 'Tạo Sprint thành công', data };
  }
}
