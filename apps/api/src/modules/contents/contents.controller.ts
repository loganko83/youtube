import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContentDto, ContentQueryDto } from './contents.dto';

@ApiTags('contents')
@Controller('contents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new content generation job' })
  @ApiResponse({ status: 201, description: 'Content job created' })
  create(@Request() req: any, @Body() dto: CreateContentDto) {
    return this.contentsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contents for current user' })
  @ApiResponse({ status: 200, description: 'List of contents' })
  findAll(@Request() req: any, @Query() query: ContentQueryDto) {
    return this.contentsService.findAll(
      req.user.id,
      query.projectId,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.contentsService.findOne(id, req.user.id);
  }
}
