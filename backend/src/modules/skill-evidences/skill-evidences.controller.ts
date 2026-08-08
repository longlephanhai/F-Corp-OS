import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SkillEvidencesService } from './skill-evidences.service';
import { CreateSkillEvidenceDto } from './dto/create-skill-evidence.dto';
import { UpdateSkillEvidenceDto } from './dto/update-skill-evidence.dto';

@Controller('skill-evidences')
export class SkillEvidencesController {
  constructor(private readonly skillEvidencesService: SkillEvidencesService) {}

  @Post()
  create(@Body() createSkillEvidenceDto: CreateSkillEvidenceDto) {
    return this.skillEvidencesService.create(createSkillEvidenceDto);
  }

  @Get()
  findAll() {
    return this.skillEvidencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillEvidencesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillEvidenceDto: UpdateSkillEvidenceDto) {
    return this.skillEvidencesService.update(+id, updateSkillEvidenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillEvidencesService.remove(+id);
  }
}
