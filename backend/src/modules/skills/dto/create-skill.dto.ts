import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class CreateSkillDto {
    @IsNotEmpty({ message: 'Skill name is required' })
    name: string;

    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsOptional()
    @IsUUID()
    parentId?: string | null;
}
