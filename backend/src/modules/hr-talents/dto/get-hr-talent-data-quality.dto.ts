import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetHrTalentDataQualityDto {
    /**
     * Optional role filter.
     *
     * Ví dụ:
     * ?role=DEVELOPER
     *
     * Mặc định không filter role.
     */
    @IsOptional()
    @IsString()
    role?: string;

    /**
     * Số ngày kể từ lần cập nhật Talent gần nhất
     * để coi profile là "stale".
     *
     * Ví dụ:
     * ?staleDays=90
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(3650)
    staleDays: number = 90;
}