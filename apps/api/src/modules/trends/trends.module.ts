import { Module } from '@nestjs/common';
import { TrendsController } from './trends.controller';
import { TrendsService } from './trends.service';
import { GoogleTrendsProvider } from './providers/google-trends.provider';
import { NaverDataLabProvider } from './providers/naver-datalab.provider';
import { RssFeedProvider } from './providers/rss-feed.provider';

@Module({
  controllers: [TrendsController],
  providers: [
    TrendsService,
    GoogleTrendsProvider,
    NaverDataLabProvider,
    RssFeedProvider,
  ],
  exports: [TrendsService, GoogleTrendsProvider, NaverDataLabProvider, RssFeedProvider],
})
export class TrendsModule {}
