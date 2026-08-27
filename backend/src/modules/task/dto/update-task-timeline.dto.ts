import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTaskTimelineDto {
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'startDate phải là ngày hợp lệ.',
    },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'endDate phải là ngày hợp lệ.',
    },
  )
  endDate?: string;
}
