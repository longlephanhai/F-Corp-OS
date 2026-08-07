import { IsArray, IsUUID } from 'class-validator';

export class AssignEmployeesDto {
  @IsArray({ message: 'employeeIds must be an array' })
  @IsUUID('all', { each: true, message: 'Each employee ID must be a valid UUID' })
  employeeIds: string[];
}