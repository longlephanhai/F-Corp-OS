import { IsEmail, IsNotEmpty, IsString } from "class-validator";

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
    role_id: string;

}
