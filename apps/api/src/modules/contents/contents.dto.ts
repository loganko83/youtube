import {
  IsString,
  IsOptional,
  IsUUID,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ContentFormat {
  SHORTS = 'Shorts',
  LONG_FORM = 'Long-form',
}

export enum ToneType {
  PROFESSIONAL = 'Professional',
  FRIENDLY = 'Friendly',
  MYSTERIOUS = 'Mysterious',
  URGENT = 'Urgent',
}

export class ContentConfigDto {
  @ApiProperty({ example: 'Senior Health' })
  @IsString()
  niche: string;

  @ApiProperty({ example: '고혈압 예방법' })
  @IsString()
  topic: string;

  @ApiProperty({ enum: ToneType, example: ToneType.FRIENDLY })
  @IsEnum(ToneType)
  tone: ToneType;

  @ApiProperty({ enum: ContentFormat, example: ContentFormat.SHORTS })
  @IsEnum(ContentFormat)
  format: ContentFormat;

  @ApiProperty({ example: 'ko', default: 'ko' })
  @IsString()
  @IsOptional()
  language?: string = 'ko';
}

export class CreateContentDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: ContentConfigDto })
  @ValidateNested()
  @Type(() => ContentConfigDto)
  config: ContentConfigDto;
}

export class ContentQueryDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

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
