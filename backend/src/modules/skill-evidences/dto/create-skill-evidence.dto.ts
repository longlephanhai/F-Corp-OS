import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";
import { EvidenceType } from "common/enum/evidence.enum";

export class CreateSkillEvidenceDto {
    @IsNotEmpty({ message: 'Evidence Type is required' })
    type: EvidenceType;

    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    title: string;

    @IsUrl()
    @IsOptional()
    url?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
