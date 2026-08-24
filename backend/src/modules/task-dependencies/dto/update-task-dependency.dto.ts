import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDependencyDto } from './create-task-dependency.dto';

export class UpdateTaskDependencyDto extends PartialType(CreateTaskDependencyDto) {}
