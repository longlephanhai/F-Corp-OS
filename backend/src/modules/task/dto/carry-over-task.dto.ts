import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CarryOverTaskDto {
  @IsUUID()
  @IsNotEmpty()
  targetSprintId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
