import { Module } from '@nestjs/common';
import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YouTubeController],
  providers: [YouTubeService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
