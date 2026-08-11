import { PartialType } from '@nestjs/mapped-types';
import { CreateSprintDto } from './create-sprint.dto';

export class UpdateSprintDto extends PartialType(CreateSprintDto) {}
