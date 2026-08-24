import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEnum,
} from "class-validator";
import { TitleType, UserStatusType } from "common/enum/user.enum";

export class CreateUserDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @IsNotEmpty({ message: 'Full name is required' })
    @IsString({ message: 'Full name must be a string' })
    fullName: string;

    @IsNotEmpty({ message: 'Role ID is required' })
    @IsString({ message: 'Role ID must be a string' })
    role_id: string;

    // @IsNotEmpty({ message: 'Title is required' })
    @IsOptional()
    @IsEnum(TitleType, { message: 'Title không hợp lệ' })
    title: TitleType;

    @IsOptional()
    @IsEnum(UserStatusType, { message: 'Status không hợp lệ' })
    status?: UserStatusType;

    @IsOptional()
    @IsString({ message: 'Manager ID must be a string' })
    managerId?: string;
}