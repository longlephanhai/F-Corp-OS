import { IsNotEmpty } from "class-validator";

export class CreatePermissionDto {

    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsNotEmpty({ message: 'ApiPath is required' })
    api_path: string;

    @IsNotEmpty({ message: 'Method is required' })
    method: string;

    @IsNotEmpty({ message: 'Module is required' })
    module: string;
}