import { Injectable } from '@nestjs/common';
import { GetHrSkillMatrixDto } from './dto/get-hr-skill-matrix.dto';
import { GetHrTalentsDto } from './dto/get-hr-talents.dto';
import { HrSkillMatrixService } from './services/hr-skill-matrix.service';
import { HrTalentDirectoryService } from './services/hr-talent-directory.service';
import { HrTalentProfileService } from './services/hr-talent-profile.service';
import { GetHrSkillEmployeesDto } from './dto/get-hr-skill-employees.dto';
import { HrSkillSupplyInsightService } from './services/hr-skill-supply-insight.service';
import { GetHrTalentDataQualityDto } from './dto/get-hr-talent-data-quality.dto';
import { HrTalentDataQualityService } from './services/hr-talent-data-quality.service';
import { GetHrBenchTalentsDto } from './dto/get-hr-bench-talents.dto';
import { HrBenchTalentPoolService } from './services/bench/hr-bench-talent-pool.service';

@Injectable()
export class HrTalentsService {
  constructor(
    private readonly directoryService:
      HrTalentDirectoryService,

    private readonly profileService:
      HrTalentProfileService,

    private readonly skillMatrixService:
      HrSkillMatrixService,

    private readonly skillSupplyInsightService:
      HrSkillSupplyInsightService,

    private readonly talentDataQualityService:
      HrTalentDataQualityService,

    private readonly benchTalentPoolService:
      HrBenchTalentPoolService,
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

  getSkillSupplySummary() {
    return this.skillSupplyInsightService.getSummary();
  }

  getTalentDataQuality(
    query: GetHrTalentDataQualityDto,
  ) {
    return this.talentDataQualityService.getSummary(
      query,
    );
  }

  getBenchTalents(
    query: GetHrBenchTalentsDto,
  ) {
    return this.benchTalentPoolService.findAll(
      query,
    );
  }
}