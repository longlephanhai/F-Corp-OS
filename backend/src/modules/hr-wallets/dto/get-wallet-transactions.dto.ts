import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from 'common/enum/hr-wallet.enum';

export class GetWalletTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;

  @IsOptional()
  @IsUUID('4', {
    message: 'employeeId must be a valid UUID',
  })
  employeeId?: string;

  @IsOptional()
  @IsEnum(TransactionType, {
    message: `type must be one of: ${Object.values(
      TransactionType,
    ).join(', ')}`,
  })
  type?: TransactionType;
}