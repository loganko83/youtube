# AutoClip Backend Development Guide

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip Development Team
- **대상 독자**: 백엔드 개발자

---

## 1. 기술 스택 개요

### 1.1 Core Stack

| 기술 | 버전 | 용도 |
|------|------|------|
| **NestJS** | 10.x | 백엔드 프레임워크 |
| **TypeScript** | 5.3+ | 타입 안전성 |
| **PostgreSQL** | 16.x | 주 데이터베이스 |
| **Redis** | 7.x | 캐시 & 큐 |
| **MongoDB** | 7.x | 비정형 데이터 |
| **Prisma** | 5.x | ORM |

### 1.2 추가 라이브러리

| 라이브러리 | 용도 |
|------------|------|
| **BullMQ** | Job Queue |
| **Passport** | 인증 |
| **class-validator** | 유효성 검증 |
| **class-transformer** | DTO 변환 |
| **@nestjs/swagger** | API 문서화 |
| **Winston** | 로깅 |
| **Jest** | 테스트 |

---

## 2. 프로젝트 구조

```
src/
├── main.ts                        # 앱 진입점
├── app.module.ts                  # 루트 모듈
├── common/                        # 공통 유틸리티
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── api-paginated-response.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   ├── prisma-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── throttle.guard.ts
│   │   └── subscription.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   ├── timeout.interceptor.ts
│   │   └── cache.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── parse-uuid.pipe.ts
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── api-response.dto.ts
│   └── utils/
│       ├── hash.util.ts
│       ├── date.util.ts
│       └── string.util.ts
├── config/                        # 설정
│   ├── configuration.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   ├── throttle.config.ts
│   └── swagger.config.ts
├── modules/                       # 기능 모듈
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-refresh.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   └── google-auth.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── auth-response.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user-response.dto.ts
│   ├── projects/
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   ├── projects.repository.ts
│   │   ├── entities/
│   │   │   ├── project.entity.ts
│   │   │   └── channel.entity.ts
│   │   └── dto/
│   │       ├── create-project.dto.ts
│   │       ├── update-project.dto.ts
│   │       └── project-response.dto.ts
│   ├── contents/
│   │   ├── contents.module.ts
│   │   ├── contents.controller.ts
│   │   ├── contents.service.ts
│   │   ├── contents.repository.ts
│   │   ├── entities/
│   │   │   ├── content.entity.ts
│   │   │   └── content-job.entity.ts
│   │   ├── dto/
│   │   │   ├── create-content.dto.ts
│   │   │   ├── update-content.dto.ts
│   │   │   ├── generate-content.dto.ts
│   │   │   └── content-response.dto.ts
│   │   └── processors/
│   │       └── content-generation.processor.ts
│   ├── templates/
│   │   ├── templates.module.ts
│   │   ├── templates.controller.ts
│   │   ├── templates.service.ts
│   │   └── dto/
│   │       └── template-response.dto.ts
│   ├── subscriptions/
│   │   ├── subscriptions.module.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts
│   │   ├── entities/
│   │   │   ├── subscription.entity.ts
│   │   │   └── credit-transaction.entity.ts
│   │   └── dto/
│   │       └── subscription-response.dto.ts
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   └── dto/
│   │       └── analytics-response.dto.ts
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts
│   │   └── webhooks.service.ts
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts
├── integrations/                  # 외부 서비스 연동
│   ├── n8n/
│   │   ├── n8n.module.ts
│   │   ├── n8n.service.ts
│   │   └── dto/
│   │       └── workflow-trigger.dto.ts
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── gemini.service.ts
│   │   ├── elevenlabs.service.ts
│   │   └── openai.service.ts
│   ├── video/
│   │   ├── video.module.ts
│   │   └── creatomate.service.ts
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── s3.service.ts
│   └── social/
│       ├── social.module.ts
│       ├── youtube.service.ts
│       └── tiktok.service.ts
├── database/                      # 데이터베이스
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── mongodb/
│   │   └── schemas/
│   │       ├── ai-output.schema.ts
│   │       └── workflow-log.schema.ts
│   └── seeds/
│       ├── index.ts
│       ├── users.seed.ts
│       └── templates.seed.ts
└── test/                          # 테스트
    ├── e2e/
    │   ├── auth.e2e-spec.ts
    │   ├── projects.e2e-spec.ts
    │   └── contents.e2e-spec.ts
    └── mocks/
        ├── prisma.mock.ts
        └── redis.mock.ts
```

---

## 3. 핵심 모듈 구현

### 3.1 앱 모듈 (Root Module)

```typescript
// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import configuration from './config/configuration';
import { throttleConfig } from './config/throttle.config';
import { redisConfig } from './config/redis.config';

// Guards & Filters & Interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Modules
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './database/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ContentsModule } from './modules/contents/contents.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { HealthModule } from './modules/health/health.module';

// Integrations
import { N8nModule } from './integrations/n8n/n8n.module';
import { AiModule } from './integrations/ai/ai.module';
import { StorageModule } from './integrations/storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: throttleConfig,
    }),

    // Job Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: redisConfig,
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    ContentsModule,
    TemplatesModule,
    SubscriptionsModule,
    AnalyticsModule,
    WebhooksModule,
    HealthModule,

    // Integration Modules
    N8nModule,
    AiModule,
    StorageModule,
  ],
  providers: [
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Rate Limit Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Response Transform Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Add any global middleware here
  }
}
```

### 3.2 Main Entry Point

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';
import { PrismaService } from './database/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);
  const isProduction = configService.get<string>('nodeEnv') === 'production';

  // Pino Logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation (Non-Production)
  if (!isProduction) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Prisma Shutdown Hook
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
```

---

## 4. 인증 모듈 (Auth Module)

### 4.1 Auth Service

```typescript
// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { HashUtil } from '../../common/utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, TokenPayload } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 이메일 중복 체크
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 비밀번호 해시
    const hashedPassword = await HashUtil.hash(dto.password);

    // 사용자 생성
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    // 토큰 발급
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Refresh Token 저장
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 로그인
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await HashUtil.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 토큰 발급
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Refresh Token 저장
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * OAuth 로그인/회원가입
   */
  async oauthLogin(
    provider: string,
    profile: { email: string; name: string; picture?: string; providerId: string },
  ): Promise<AuthResponseDto> {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // 신규 사용자 - 회원가입
      user = await this.usersService.create({
        email: profile.email,
        name: profile.name,
        profileImage: profile.picture,
        provider,
        providerId: profile.providerId,
        emailVerified: true,
      });
    } else if (user.provider !== provider) {
      // 다른 방식으로 가입된 사용자
      throw new ConflictException(
        `이미 ${user.provider} 계정으로 가입된 이메일입니다.`,
      );
    }

    // 토큰 발급
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 토큰 갱신
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }

    // Refresh Token 검증
    const isRefreshTokenValid = await HashUtil.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    // 새 토큰 발급
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 로그아웃
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * 토큰 생성
   */
  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('jwt.accessExpiresInSeconds'),
    };
  }
}
```

### 4.2 JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '../dto/auth-response.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
```

### 4.3 Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Get('oauth/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth 로그인' })
  async googleAuth() {
    // Guard가 처리
  }

  @Public()
  @Get('oauth/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth 콜백' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(
      'google',
      req.user,
    );

    // 프론트엔드로 리다이렉트 (토큰 포함)
    const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/callback');
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@CurrentUser() user, @Req() req): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(user.id, req.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  async logout(@CurrentUser() user): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보' })
  async getMe(@CurrentUser() user) {
    return user;
  }
}
```

---

## 5. 콘텐츠 모듈 (Contents Module)

### 5.1 Contents Service

```typescript
// src/modules/contents/contents.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ContentsRepository } from './contents.repository';
import { ProjectsService } from '../projects/projects.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { GenerateContentDto } from './dto/generate-content.dto';
import { ContentStatus } from './entities/content.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ContentsService {
  constructor(
    private readonly contentsRepository: ContentsRepository,
    private readonly projectsService: ProjectsService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectQueue('content-generation') private contentQueue: Queue,
  ) {}

  /**
   * 콘텐츠 목록 조회
   */
  async findAll(userId: string, pagination: PaginationDto, filters?: Record<string, any>) {
    return this.contentsRepository.findAll(userId, pagination, filters);
  }

  /**
   * 콘텐츠 상세 조회
   */
  async findOne(id: string, userId: string) {
    const content = await this.contentsRepository.findById(id);
    
    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    // 권한 확인
    const hasAccess = await this.projectsService.checkAccess(content.projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return content;
  }

  /**
   * 콘텐츠 생성
   */
  async create(userId: string, dto: CreateContentDto) {
    // 프로젝트 접근 권한 확인
    const hasAccess = await this.projectsService.checkAccess(dto.projectId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('프로젝트 접근 권한이 없습니다.');
    }

    // 크레딧 확인
    const hasCredits = await this.subscriptionsService.checkCredits(userId, 1);
    if (!hasCredits) {
      throw new BadRequestException('크레딧이 부족합니다. 구독을 업그레이드해주세요.');
    }

    // 콘텐츠 생성
    const content = await this.contentsRepository.create({
      ...dto,
      createdById: userId,
      status: ContentStatus.DRAFT,
    });

    return content;
  }

  /**
   * 콘텐츠 수정
   */
  async update(id: string, userId: string, dto: UpdateContentDto) {
    const content = await this.findOne(id, userId);

    // 생성 중인 콘텐츠는 수정 불가
    if (content.status === ContentStatus.GENERATING) {
      throw new BadRequestException('생성 중인 콘텐츠는 수정할 수 없습니다.');
    }

    return this.contentsRepository.update(id, dto);
  }

  /**
   * 콘텐츠 삭제
   */
  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.contentsRepository.delete(id);
  }

  /**
   * 콘텐츠 생성 시작 (n8n 워크플로우 트리거)
   */
  async generate(id: string, userId: string) {
    const content = await this.findOne(id, userId);

    if (content.status === ContentStatus.GENERATING) {
      throw new BadRequestException('이미 생성 중입니다.');
    }

    // 크레딧 차감
    await this.subscriptionsService.deductCredits(userId, 1, {
      type: 'content_generation',
      contentId: id,
    });

    // 상태 업데이트
    await this.contentsRepository.update(id, {
      status: ContentStatus.GENERATING,
    });

    // Job Queue에 추가
    await this.contentQueue.add(
      'generate',
      {
        contentId: id,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return this.findOne(id, userId);
  }

  /**
   * 콘텐츠 게시
   */
  async publish(id: string, userId: string, platforms: string[]) {
    const content = await this.findOne(id, userId);

    if (content.status !== ContentStatus.READY) {
      throw new BadRequestException('게시할 수 없는 상태입니다.');
    }

    // 게시 Job Queue에 추가
    await this.contentQueue.add(
      'publish',
      {
        contentId: id,
        userId,
        platforms,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return this.findOne(id, userId);
  }

  /**
   * 생성 상태 업데이트 (내부용)
   */
  async updateGenerationStatus(
    id: string,
    status: ContentStatus,
    data?: Partial<{
      videoUrl: string;
      thumbnailUrl: string;
      audioUrl: string;
      scriptText: string;
      errorMessage: string;
    }>,
  ) {
    return this.contentsRepository.update(id, {
      status,
      ...data,
    });
  }
}
```

### 5.2 Content Generation Processor (BullMQ)

```typescript
// src/modules/contents/processors/content-generation.processor.ts
import { Process, Processor, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ContentsService } from '../contents.service';
import { N8nService } from '../../../integrations/n8n/n8n.service';
import { ContentStatus } from '../entities/content.entity';

interface GenerationJob {
  contentId: string;
  userId: string;
}

interface PublishJob {
  contentId: string;
  userId: string;
  platforms: string[];
}

@Processor('content-generation')
export class ContentGenerationProcessor {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly contentsService: ContentsService,
    private readonly n8nService: N8nService,
  ) {}

  /**
   * 콘텐츠 생성 Job 처리
   */
  @Process('generate')
  async handleGeneration(job: Job<GenerationJob>) {
    const { contentId, userId } = job.data;
    this.logger.log(`Starting content generation: ${contentId}`);

    try {
      // n8n 워크플로우 트리거
      const result = await this.n8nService.triggerWorkflow('content-generation', {
        contentId,
        userId,
      });

      // 결과 업데이트
      await this.contentsService.updateGenerationStatus(contentId, ContentStatus.READY, {
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        audioUrl: result.audioUrl,
        scriptText: result.scriptText,
      });

      this.logger.log(`Content generation completed: ${contentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Content generation failed: ${contentId}`, error.stack);

      // 실패 상태 업데이트
      await this.contentsService.updateGenerationStatus(contentId, ContentStatus.FAILED, {
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * 콘텐츠 게시 Job 처리
   */
  @Process('publish')
  async handlePublish(job: Job<PublishJob>) {
    const { contentId, userId, platforms } = job.data;
    this.logger.log(`Starting content publish: ${contentId} to ${platforms.join(', ')}`);

    try {
      // n8n 워크플로우 트리거 (게시용)
      const result = await this.n8nService.triggerWorkflow('content-publish', {
        contentId,
        userId,
        platforms,
      });

      // 상태 업데이트
      await this.contentsService.updateGenerationStatus(contentId, ContentStatus.PUBLISHED);

      this.logger.log(`Content published: ${contentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Content publish failed: ${contentId}`, error.stack);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
```

### 5.3 Contents Controller

```typescript
// src/modules/contents/contents.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { PublishContentDto } from './dto/publish-content.dto';
import { ContentResponseDto, ContentListResponseDto } from './dto/content-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('콘텐츠')
@ApiBearerAuth()
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @ApiOperation({ summary: '콘텐츠 목록 조회' })
  @ApiPaginatedResponse(ContentResponseDto)
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @CurrentUser() user,
    @Query() pagination: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ): Promise<ContentListResponseDto> {
    return this.contentsService.findAll(user.id, pagination, { projectId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: '콘텐츠 상세 조회' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ): Promise<ContentResponseDto> {
    return this.contentsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: '콘텐츠 생성' })
  @ApiResponse({ status: 201, type: ContentResponseDto })
  async create(
    @Body() dto: CreateContentDto,
    @CurrentUser() user,
  ): Promise<ContentResponseDto> {
    return this.contentsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '콘텐츠 수정' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user,
  ): Promise<ContentResponseDto> {
    return this.contentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '콘텐츠 삭제' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ): Promise<void> {
    return this.contentsService.delete(id, user.id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: '콘텐츠 생성 시작' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  async generate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user,
  ): Promise<ContentResponseDto> {
    return this.contentsService.generate(id, user.id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '콘텐츠 게시' })
  @ApiResponse({ status: 200, type: ContentResponseDto })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishContentDto,
    @CurrentUser() user,
  ): Promise<ContentResponseDto> {
    return this.contentsService.publish(id, user.id, dto.platforms);
  }
}
```

---

## 6. 공통 컴포넌트

### 6.1 Exception Filter

```typescript
// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  errors?: Record<string, string[]>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        type: 'https://autoclip.io/errors/http-error',
        title: this.getHttpErrorTitle(status),
        status,
        detail: this.getErrorMessage(exceptionResponse),
        instance: request.url,
        timestamp: new Date().toISOString(),
      };

      // Validation errors
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const messages = (exceptionResponse as any).message;
        if (Array.isArray(messages)) {
          errorResponse.errors = this.formatValidationErrors(messages);
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma errors
      const { status: prismaStatus, message } = this.handlePrismaError(exception);
      status = prismaStatus;

      errorResponse = {
        type: 'https://autoclip.io/errors/database-error',
        title: 'Database Error',
        status,
        detail: message,
        instance: request.url,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const message = exception instanceof Error ? exception.message : 'Unknown error';

      this.logger.error('Unhandled exception', exception);

      errorResponse = {
        type: 'https://autoclip.io/errors/internal-error',
        title: 'Internal Server Error',
        status,
        detail: process.env.NODE_ENV === 'production' 
          ? '서버 오류가 발생했습니다.' 
          : message,
        instance: request.url,
        timestamp: new Date().toISOString(),
      };
    }

    response.status(status).json(errorResponse);
  }

  private getHttpErrorTitle(status: number): string {
    const titles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return titles[status] || 'Error';
  }

  private getErrorMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && 'message' in response) {
      const message = (response as any).message;
      return Array.isArray(message) ? message[0] : message;
    }
    return 'An error occurred';
  }

  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    
    for (const message of messages) {
      const [field, ...rest] = message.split(' ');
      const fieldName = field.toLowerCase();
      if (!errors[fieldName]) {
        errors[fieldName] = [];
      }
      errors[fieldName].push(message);
    }
    
    return errors;
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: '이미 존재하는 데이터입니다.',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: '데이터를 찾을 수 없습니다.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '관련 데이터가 존재하지 않습니다.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 오류가 발생했습니다.',
        };
    }
  }
}
```

### 6.2 Transform Interceptor

```typescript
// src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 이미 포맷된 응답인 경우 그대로 반환
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 페이지네이션 응답 처리
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true,
            data: data.items,
            meta: data.meta,
          };
        }

        // 일반 응답
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
```

### 6.3 Logging Interceptor

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const userId = (request as any).user?.id || 'anonymous';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const contentLength = response.get('Content-Length') || 0;
          const duration = Date.now() - now;

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength} - ${duration}ms - ${userId} - ${ip} - ${userAgent}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `${method} ${url} ERROR - ${duration}ms - ${userId} - ${ip} - ${error.message}`,
          );
        },
      }),
    );
  }
}
```

---

## 7. n8n 연동

### 7.1 n8n Service

```typescript
// src/integrations/n8n/n8n.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface WorkflowTriggerResponse {
  executionId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  scriptText?: string;
}

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get<string>('n8n.baseUrl'),
      timeout: 300000, // 5분 (영상 생성에 시간이 걸릴 수 있음)
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.configService.get<string>('n8n.apiKey'),
      },
    });
  }

  /**
   * 워크플로우 트리거
   */
  async triggerWorkflow(
    workflowName: string,
    data: Record<string, any>,
  ): Promise<WorkflowTriggerResponse> {
    const webhookUrl = this.getWebhookUrl(workflowName);

    this.logger.log(`Triggering workflow: ${workflowName}`);
    this.logger.debug(`Webhook URL: ${webhookUrl}`);
    this.logger.debug(`Payload: ${JSON.stringify(data)}`);

    try {
      const response = await this.client.post(webhookUrl, data);

      this.logger.log(`Workflow triggered successfully: ${workflowName}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to trigger workflow: ${workflowName}`,
        error.response?.data || error.message,
      );

      throw new HttpException(
        {
          message: 'Failed to trigger content generation workflow',
          details: error.response?.data || error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 워크플로우 실행 상태 확인
   */
  async getExecutionStatus(executionId: string): Promise<{
    status: 'running' | 'success' | 'error';
    data?: any;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/executions/${executionId}`);
      
      const { finished, data, stoppedAt } = response.data;

      if (!finished) {
        return { status: 'running' };
      }

      if (stoppedAt) {
        return {
          status: 'error',
          error: 'Workflow execution was stopped',
        };
      }

      return {
        status: 'success',
        data: data?.resultData?.lastNodeExecutionStack?.[0]?.data?.main?.[0]?.[0]?.json,
      };
    } catch (error) {
      this.logger.error(`Failed to get execution status: ${executionId}`, error.message);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Webhook URL 생성
   */
  private getWebhookUrl(workflowName: string): string {
    const webhookPaths: Record<string, string> = {
      'content-generation': '/webhook/content-generation',
      'content-publish': '/webhook/content-publish',
      'data-fetch': '/webhook/data-fetch',
    };

    const path = webhookPaths[workflowName];
    if (!path) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    return path;
  }
}
```

---

## 8. 구독 & 크레딧 관리

### 8.1 Subscriptions Service

```typescript
// src/modules/subscriptions/subscriptions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Subscription, CreditTransaction, TransactionType } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 현재 구독 정보 조회
   */
  async getCurrentSubscription(userId: string): Promise<Subscription & { plan: any }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      // Free 플랜 반환
      return this.createFreeSubscription(userId);
    }

    return subscription;
  }

  /**
   * 크레딧 확인
   */
  async checkCredits(userId: string, amount: number): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    return subscription.remainingCredits >= amount;
  }

  /**
   * 크레딧 차감
   */
  async deductCredits(
    userId: string,
    amount: number,
    metadata: { type: string; contentId?: string },
  ): Promise<CreditTransaction> {
    const subscription = await this.getCurrentSubscription(userId);

    if (subscription.remainingCredits < amount) {
      throw new BadRequestException('크레딧이 부족합니다.');
    }

    // 트랜잭션으로 크레딧 차감 & 기록 생성
    const [_, transaction] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          remainingCredits: {
            decrement: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          subscriptionId: subscription.id,
          amount: -amount,
          type: TransactionType.DEDUCTION,
          description: `콘텐츠 생성 (${metadata.contentId})`,
          metadata: metadata as any,
        },
      }),
    ]);

    return transaction;
  }

  /**
   * 크레딧 추가 (환불, 보너스 등)
   */
  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
  ): Promise<CreditTransaction> {
    const subscription = await this.getCurrentSubscription(userId);

    const [_, transaction] = await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          remainingCredits: {
            increment: amount,
          },
        },
      }),
      this.prisma.creditTransaction.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          type,
          description,
        },
      }),
    ]);

    return transaction;
  }

  /**
   * 크레딧 사용 내역 조회
   */
  async getCreditHistory(
    userId: string,
    options: { page: number; limit: number },
  ) {
    const subscription = await this.getCurrentSubscription(userId);

    const [items, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.creditTransaction.count({
        where: { subscriptionId: subscription.id },
      }),
    ]);

    return {
      items,
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  /**
   * Free 플랜 생성 (신규 사용자)
   */
  private async createFreeSubscription(userId: string) {
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { slug: 'free' },
    });

    if (!freePlan) {
      throw new NotFoundException('Free plan not found');
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: 'active',
        remainingCredits: freePlan.monthlyCredits,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        plan: true,
      },
    });
  }
}
```

---

## 9. 테스트

### 9.1 Unit Test 예시

```typescript
// src/modules/contents/contents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContentsService } from './contents.service';
import { ContentsRepository } from './contents.repository';
import { ProjectsService } from '../projects/projects.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { getQueueToken } from '@nestjs/bull';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ContentStatus } from './entities/content.entity';

describe('ContentsService', () => {
  let service: ContentsService;
  let contentsRepository: jest.Mocked<ContentsRepository>;
  let projectsService: jest.Mocked<ProjectsService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let contentQueue: { add: jest.Mock };

  const mockContent = {
    id: 'content-1',
    title: 'Test Content',
    projectId: 'project-1',
    status: ContentStatus.DRAFT,
    createdById: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentsService,
        {
          provide: ContentsRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            checkAccess: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            checkCredits: jest.fn(),
            deductCredits: jest.fn(),
          },
        },
        {
          provide: getQueueToken('content-generation'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
    contentsRepository = module.get(ContentsRepository);
    projectsService = module.get(ProjectsService);
    subscriptionsService = module.get(SubscriptionsService);
    contentQueue = module.get(getQueueToken('content-generation'));
  });

  describe('create', () => {
    it('should create a content successfully', async () => {
      projectsService.checkAccess.mockResolvedValue(true);
      subscriptionsService.checkCredits.mockResolvedValue(true);
      contentsRepository.create.mockResolvedValue(mockContent);

      const result = await service.create('user-1', {
        projectId: 'project-1',
        title: 'Test Content',
        vertical: 'senior_health',
        format: 'short',
      });

      expect(result).toEqual(mockContent);
      expect(projectsService.checkAccess).toHaveBeenCalledWith('project-1', 'user-1');
      expect(subscriptionsService.checkCredits).toHaveBeenCalledWith('user-1', 1);
    });

    it('should throw ForbiddenException if no project access', async () => {
      projectsService.checkAccess.mockResolvedValue(false);

      await expect(
        service.create('user-1', {
          projectId: 'project-1',
          title: 'Test Content',
          vertical: 'senior_health',
          format: 'short',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no credits', async () => {
      projectsService.checkAccess.mockResolvedValue(true);
      subscriptionsService.checkCredits.mockResolvedValue(false);

      await expect(
        service.create('user-1', {
          projectId: 'project-1',
          title: 'Test Content',
          vertical: 'senior_health',
          format: 'short',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generate', () => {
    it('should start content generation', async () => {
      contentsRepository.findById.mockResolvedValue(mockContent);
      projectsService.checkAccess.mockResolvedValue(true);
      subscriptionsService.deductCredits.mockResolvedValue({} as any);
      contentsRepository.update.mockResolvedValue({
        ...mockContent,
        status: ContentStatus.GENERATING,
      });
      contentQueue.add.mockResolvedValue({});

      const result = await service.generate('content-1', 'user-1');

      expect(subscriptionsService.deductCredits).toHaveBeenCalled();
      expect(contentQueue.add).toHaveBeenCalledWith(
        'generate',
        { contentId: 'content-1', userId: 'user-1' },
        expect.any(Object),
      );
    });

    it('should throw if content is already generating', async () => {
      contentsRepository.findById.mockResolvedValue({
        ...mockContent,
        status: ContentStatus.GENERATING,
      });
      projectsService.checkAccess.mockResolvedValue(true);

      await expect(service.generate('content-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
```

### 9.2 E2E Test 예시

```typescript
// test/e2e/contents.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma/prisma.service';

describe('Contents (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testProjectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 테스트 사용자 생성 및 로그인
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

    authToken = registerResponse.body.accessToken;

    // 테스트 프로젝트 생성
    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        vertical: 'senior_health',
        defaultLanguage: 'ko',
      });

    testProjectId = projectResponse.body.data.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.content.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe('POST /api/v1/contents', () => {
    it('should create a new content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          title: 'Test Content',
          vertical: 'senior_health',
          format: 'short',
          tone: 'informative',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Content');
      expect(response.body.data.status).toBe('draft');
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contents')
        .send({
          projectId: testProjectId,
          title: 'Test Content',
        })
        .expect(401);
    });

    it('should fail with invalid project id', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: 'invalid-project-id',
          title: 'Test Content',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/contents', () => {
    it('should return list of contents', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by project id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/contents?projectId=${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((content: any) => {
        expect(content.projectId).toBe(testProjectId);
      });
    });
  });
});
```

---

## 10. 환경 설정

### 10.1 Configuration

```typescript
// src/config/configuration.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    accessExpiresInSeconds: 900,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY,
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
});
```

### 10.2 환경 변수 (.env)

```bash
# .env.example
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/autoclip?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/oauth/google/callback

# n8n
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key

# AWS
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=autoclip-storage

# CORS
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
