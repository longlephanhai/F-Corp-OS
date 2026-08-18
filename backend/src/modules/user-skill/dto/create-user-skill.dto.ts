import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateSkillEvidenceDto } from "modules/skill-evidences/dto/create-skill-evidence.dto";

export class CreateUserSkillDto {
    @IsNotEmpty({ message: 'Skill ID is required' })
    @IsString({ message: 'Skill ID must be a string' })
    skillId: string;

    @IsNotEmpty({ message: 'Description is required' })
    @IsString({ message: 'Description must be a string' })
    description: string;

    @IsOptional()
    @IsString({ message: 'Evidence Notes must be a string' })
    evidenceNotes?: string;

    @IsOptional()
    @IsNumber({}, { message: 'Years must be a number' })
    years?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSkillEvidenceDto)
    @IsOptional()
    evidences?: CreateSkillEvidenceDto[];
}
