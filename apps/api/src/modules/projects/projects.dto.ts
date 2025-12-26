import {
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Niche } from '@prisma/client';

// Use Prisma's Niche enum directly for type safety
export { Niche as NicheType };

export class CreateProjectDto {
  @ApiProperty({ example: 'My Senior Health Channel' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Health tips for seniors', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: Niche, example: 'SENIOR_HEALTH' })
  @IsEnum(Niche)
  niche: Niche;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  defaultConfig?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  youtubeChannelId?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
