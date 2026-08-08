import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber
} from "class-validator";

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

    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    title: string;

    @IsNotEmpty({ message: 'Cost rate is required' })
    @IsNumber({}, { message: 'Cost rate must be a number' })
    costRate: number;


    @IsOptional()
    @IsString({ message: 'Manager ID must be a string' })
    managerId?: string;
}