import { 
    IsEmail, 
    IsNotEmpty, 
    IsString, 
    IsOptional, 
    IsNumber, 
    IsUUID, 
    IsEnum, 
    IsDateString 
} from "class-validator";
import { UserStatusType } from "common/enum/user.enum"; // Nhớ trỏ đúng đường dẫn file enum của bạn

export class CreateUserDto {
    // =========================================================================
    // THÔNG TIN TÀI KHOẢN (BẮT BUỘC)
    // =========================================================================

    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    password: string;

    @IsNotEmpty({ message: 'Full name is required' })
    @IsString({ message: 'Full name must be a string' })
    fullName: string;

    @IsNotEmpty({ message: 'Role ID is required' })
    @IsString({ message: 'Role ID must be a string' }) 
    // Nếu role_id trong DB của bạn là UUID, hãy thay @IsString() bằng @IsUUID('all', { message: 'Role ID must be a valid UUID' })
    role_id: string;


    @IsOptional()
    @IsNumber({}, { message: 'Cost rate must be a number' })
    costRate?: number;


    @IsOptional()
    @IsString({ message: 'Manager ID must be a string' })
    // Nếu managerId là UUID, hãy đổi thành @IsUUID('all', { message: 'Manager ID must be a valid UUID' })
    managerId?: string;
}