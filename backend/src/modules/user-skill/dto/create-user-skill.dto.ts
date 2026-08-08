import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateUserSkillDto {
    @IsNotEmpty({ message: 'User ID is required' })
    @IsString({ message: 'User ID must be a string' })
    userId: string;

    @IsNotEmpty({ message: 'Skill ID is required' })
    @IsString({ message: 'Skill ID must be a string' })
    skillId: string;

    @IsNotEmpty({ message: 'Description is required' })
    @IsString({ message: 'Description must be a string' })
    description: string;

    @IsOptional()
    @IsString({ message: 'Evidence Note must be a string' })
    level?: number;

    @IsOptional()
    @IsString({ message: 'Years must be a string' })
    years?: number;
}
