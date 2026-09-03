import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class GetHrSkillMatrixDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    /**
     * Tìm kiếm theo tên skill.
     */
    @IsOptional()
    @IsString()
    search?: string;
}