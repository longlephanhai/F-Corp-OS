import { Injectable } from '@nestjs/common';
import { GetHrSkillMatrixDto } from './dto/get-hr-skill-matrix.dto';
import { GetHrTalentsDto } from './dto/get-hr-talents.dto';
import { HrSkillMatrixService } from './services/hr-skill-matrix.service';
import { HrTalentDirectoryService } from './services/hr-talent-directory.service';
import { HrTalentProfileService } from './services/hr-talent-profile.service';
import { GetHrSkillEmployeesDto } from './dto/get-hr-skill-employees.dto';

@Injectable()
export class HrTalentsService {
  constructor(
    private readonly directoryService:
      HrTalentDirectoryService,

    private readonly profileService:
      HrTalentProfileService,

    private readonly skillMatrixService:
      HrSkillMatrixService,
  ) { }

  findAll(
    query: GetHrTalentsDto,
  ) {
    return this.directoryService.findAll(
      query,
    );
  }

  findOne(
    employeeId: string,
  ) {
    return this.profileService.findOne(
      employeeId,
    );
  }

  getSkillMatrix(
    query: GetHrSkillMatrixDto,
  ) {
    return this.skillMatrixService.getSkillMatrix(
      query,
    );
  }

  getSkillEmployees(
    skillId: string,
    query: GetHrSkillEmployeesDto,
  ) {
    return this.skillMatrixService.getSkillEmployees(
      skillId,
      query,
    );
  }
}