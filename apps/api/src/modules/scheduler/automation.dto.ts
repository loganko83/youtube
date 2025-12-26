import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAutomationDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean = false;

  @ApiProperty({ example: '09:00', required: false })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'generateTime must be in HH:mm format',
  })
  @IsOptional()
  generateTime?: string = '09:00';

  @ApiProperty({ example: '12:00', required: false })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'publishTime must be in HH:mm format',
  })
  @IsOptional()
  publishTime?: string = '12:00';

  @ApiProperty({ example: 'Asia/Seoul', required: false })
  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Seoul';

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  dailyLimit?: number = 1;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  autoPublish?: boolean = false;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  useTrends?: boolean = true;

  @ApiProperty({ example: ['google', 'naver', 'rss'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  trendSources?: string[] = ['google', 'naver', 'rss'];
}

export class UpdateAutomationDto extends CreateAutomationDto {}

export class AutomationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  generateTime: string;

  @ApiProperty()
  publishTime: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  dailyLimit: number;

  @ApiProperty()
  autoPublish: boolean;

  @ApiProperty()
  useTrends: boolean;

  @ApiProperty()
  trendSources: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
