import { IsEmail, IsNotEmpty } from "class-validator";

export class UserLoginDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}
