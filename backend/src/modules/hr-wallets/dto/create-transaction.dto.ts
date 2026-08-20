import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionType } from 'common/enum/hr-wallet.enum';

/**
 * DTO cho việc xử lý một giao dịch F-Token (thưởng / phạt / chuyển).
 * Được sử dụng tại endpoint POST /hr-wallets/transaction.
 */
export class CreateTransactionDto {
  /** UUID của nhân viên cần thực hiện giao dịch — bắt buộc */
  @IsNotEmpty({ message: 'employeeId is required' })
  @IsUUID('4', { message: 'employeeId must be a valid UUID v4' })
  employeeId: string;

  /**
   * Số lượng F-Token trong giao dịch — bắt buộc, tối thiểu 0.01.
   * Luôn là số dương; chiều tăng/giảm được quyết định bởi `type`.
   */
  @IsNotEmpty({ message: 'amount is required' })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(0.01, { message: 'amount must be at least 0.01' })
  amount: number;

  /** Loại giao dịch: REWARD (thưởng) | PENALTY (phạt) | TRANSFER (chuyển) */
  @IsNotEmpty({ message: 'type is required' })
  @IsEnum(TransactionType, {
    message: `type must be one of: ${Object.values(TransactionType).join(', ')}`,
  })
  type: TransactionType;

  /** Lý do thực hiện giao dịch — bắt buộc */
  @IsNotEmpty({ message: 'reason is required' })
  @IsString({ message: 'reason must be a string' })
  @MaxLength(1000, { message: 'reason must be at most 1000 characters' })
  reason: string;

  /**
   * ID tham chiếu đến đối tượng nghiệp vụ liên quan (ví dụ: ReviewRecord ID).
   * Tùy chọn — để trống nếu giao dịch không gắn với một đối tượng cụ thể.
   */
  @IsOptional()
  @IsString({ message: 'referenceId must be a string' })
  @MaxLength(255, { message: 'referenceId must be at most 255 characters' })
  referenceId?: string;
}
