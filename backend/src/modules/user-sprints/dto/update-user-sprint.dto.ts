import { PartialType } from '@nestjs/swagger';
import { CreateUserSprintDto } from './create-user-sprint.dto';

export class UpdateUserSprintDto extends PartialType(CreateUserSprintDto) {}
