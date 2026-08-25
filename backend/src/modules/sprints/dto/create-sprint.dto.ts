import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSprintDto {
  // ==========================================
  // NAME
  // ==========================================

  @IsNotEmpty()
  @IsString()
  name: string;

  // ==========================================
  // PROJECT
  // ==========================================

  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  // ==========================================
  // START DATE
  // ==========================================

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  // ==========================================
  // END DATE
  // ==========================================

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  // ==========================================
  // ATTENDANT
  //
  // Hỗ trợ cả:
  //
  // ["Frontend", "Backend"]
  //
  // và JSON string cũ:
  //
  // '["Frontend","Backend"]'
  //
  // Service sẽ normalize về string[].
  // ==========================================

  @IsOptional()
  attendant?: string | string[];
}
