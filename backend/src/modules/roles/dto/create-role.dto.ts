import { IsNotEmpty } from "class-validator";

export class CreateRoleDto {
    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    // n-n permissions
    @IsNotEmpty({ message: 'Permissions are required' })
    permissions: number[];
}