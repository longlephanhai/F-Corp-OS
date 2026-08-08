import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { EvidenceType } from "common/enum/evidence.enum";

export class CreateSkillEvidenceDto {
    @IsNotEmpty({ message: 'User Skill ID is required' })
    @IsUUID('4', { message: 'User Skill ID must be a valid UUID' })
    userSkillId: string;

    @IsNotEmpty({ message: 'Evidence Type is required' })
    type: EvidenceType;

    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    title: string;

    @IsNotEmpty({ message: 'URL is required' })
    @IsString({ message: 'URL must be a string' })
    url: string;

    @IsNotEmpty({ message: 'Description is required' })
    @IsString({ message: 'Description must be a string' })
    description: string;
}
