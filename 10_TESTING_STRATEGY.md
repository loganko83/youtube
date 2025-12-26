# AutoClip Testing Strategy

## 문서 정보
- **버전**: 1.0.0
- **최종 수정일**: 2024-12-24
- **작성자**: AutoClip QA Team
- **대상 독자**: 개발자, QA 엔지니어

---

## 1. 테스트 전략 개요

### 1.1 테스트 피라미드

```
                    ┌─────────────┐
                    │    E2E     │  10%
                    │   Tests    │  (Slow, Expensive)
                   ─┴─────────────┴─
                  ┌─────────────────┐
                  │  Integration   │  20%
                  │    Tests       │
                 ─┴─────────────────┴─
                ┌─────────────────────┐
                │      Unit          │  70%
                │      Tests         │  (Fast, Cheap)
               ─┴─────────────────────┴─
```

### 1.2 테스트 유형별 목표

| 테스트 유형 | 목적 | 커버리지 목표 | 실행 시간 |
|------------|------|--------------|----------|
| Unit Test | 개별 함수/클래스 검증 | 80%+ | < 30초 |
| Integration Test | 모듈 간 상호작용 검증 | 60%+ | < 2분 |
| E2E Test | 사용자 시나리오 검증 | 핵심 시나리오 100% | < 10분 |
| Performance Test | 성능 요구사항 검증 | N/A | < 30분 |

### 1.3 테스트 도구

| 도구 | 용도 |
|------|------|
| **Jest** | Unit/Integration 테스트 (Backend) |
| **Vitest** | Unit 테스트 (Frontend) |
| **Playwright** | E2E 테스트 |
| **k6** | 부하 테스트 |
| **MSW** | API Mocking |
| **Faker.js** | 테스트 데이터 생성 |
| **testcontainers** | DB 통합 테스트 |

---

## 2. Unit Testing

### 2.1 Backend Unit Test

#### 테스트 구조

```typescript
// src/modules/contents/contents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContentsService } from './contents.service';
import { ContentsRepository } from './contents.repository';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('ContentsService', () => {
  let service: ContentsService;
  let repository: DeepMocked<ContentsRepository>;

  // 테스트 픽스처
  const mockContent = {
    id: 'content-123',
    title: 'Test Content',
    status: 'draft',
    projectId: 'project-123',
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentsService,
        {
          provide: ContentsRepository,
          useValue: createMock<ContentsRepository>(),
        },
        {
          provide: ProjectsService,
          useValue: createMock<ProjectsService>(),
        },
        {
          provide: SubscriptionsService,
          useValue: createMock<SubscriptionsService>(),
        },
        {
          provide: getQueueToken('content-generation'),
          useValue: createMock<Queue>(),
        },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
    repository = module.get(ContentsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return content when found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(mockContent);

      // Act
      const result = await service.findOne('content-123', 'user-123');

      // Assert
      expect(result).toEqual(mockContent);
      expect(repository.findById).toHaveBeenCalledWith('content-123');
    });

    it('should throw NotFoundException when content not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOne('non-existent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'New Content',
      projectId: 'project-123',
      vertical: 'senior_health',
      format: 'short',
    };

    it('should create content when user has access and credits', async () => {
      // Arrange
      const projectsService = module.get(ProjectsService);
      const subscriptionsService = module.get(SubscriptionsService);
      
      projectsService.checkAccess.mockResolvedValue(true);
      subscriptionsService.checkCredits.mockResolvedValue(true);
      repository.create.mockResolvedValue({ ...mockContent, ...createDto });

      // Act
      const result = await service.create('user-123', createDto);

      // Assert
      expect(result.title).toBe('New Content');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          createdById: 'user-123',
          status: 'draft',
        })
      );
    });

    it('should throw ForbiddenException when user has no project access', async () => {
      // Arrange
      const projectsService = module.get(ProjectsService);
      projectsService.checkAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.create('user-123', createDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when user has no credits', async () => {
      // Arrange
      const projectsService = module.get(ProjectsService);
      const subscriptionsService = module.get(SubscriptionsService);
      
      projectsService.checkAccess.mockResolvedValue(true);
      subscriptionsService.checkCredits.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.create('user-123', createDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generate', () => {
    it('should queue generation job and deduct credits', async () => {
      // Arrange
      const queue = module.get(getQueueToken('content-generation'));
      const subscriptionsService = module.get(SubscriptionsService);
      
      repository.findById.mockResolvedValue(mockContent);
      repository.update.mockResolvedValue({ ...mockContent, status: 'generating' });

      // Act
      await service.generate('content-123', 'user-123');

      // Assert
      expect(subscriptionsService.deductCredits).toHaveBeenCalledWith(
        'user-123',
        1,
        expect.objectContaining({ contentId: 'content-123' })
      );
      expect(queue.add).toHaveBeenCalledWith(
        'generate',
        { contentId: 'content-123', userId: 'user-123' },
        expect.any(Object)
      );
    });

    it('should throw if content is already generating', async () => {
      // Arrange
      repository.findById.mockResolvedValue({ ...mockContent, status: 'generating' });

      // Act & Assert
      await expect(
        service.generate('content-123', 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

#### 테스트 헬퍼

```typescript
// test/helpers/test-factory.ts
import { faker } from '@faker-js/faker';

export class TestFactory {
  static createUser(overrides = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: faker.internet.password(),
      role: 'editor',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createProject(overrides = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      vertical: faker.helpers.arrayElement(['senior_health', 'finance', 'tech']),
      ownerId: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createContent(overrides = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      status: 'draft',
      projectId: faker.string.uuid(),
      createdById: faker.string.uuid(),
      vertical: 'senior_health',
      format: 'short',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }
}
```

### 2.2 Frontend Unit Test

#### React 컴포넌트 테스트

```typescript
// components/features/contents/content-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCard } from './content-card';
import { TestFactory } from '@/test/helpers/test-factory';

describe('ContentCard', () => {
  const mockContent = TestFactory.createContent({
    title: 'Test Video',
    status: 'ready',
  });

  it('renders content title and status', () => {
    render(<ContentCard content={mockContent} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('준비됨')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ContentCard content={mockContent} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /편집/i }));

    expect(onEdit).toHaveBeenCalledWith(mockContent.id);
  });

  it('shows publish button only for ready status', () => {
    const onPublish = jest.fn();
    render(<ContentCard content={mockContent} onPublish={onPublish} />);

    expect(screen.getByRole('button', { name: /게시/i })).toBeInTheDocument();
  });

  it('hides publish button for draft status', () => {
    const draftContent = { ...mockContent, status: 'draft' };
    render(<ContentCard content={draftContent} />);

    expect(screen.queryByRole('button', { name: /게시/i })).not.toBeInTheDocument();
  });

  it('displays thumbnail when available', () => {
    const contentWithThumb = { ...mockContent, thumbnailUrl: 'https://example.com/thumb.jpg' };
    render(<ContentCard content={contentWithThumb} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('thumb.jpg'));
  });
});
```

#### Hook 테스트

```typescript
// hooks/use-contents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContents, useCreateContent } from './use-contents';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches contents successfully', async () => {
    const mockData = {
      data: [
        { id: '1', title: 'Content 1' },
        { id: '2', title: 'Content 2' },
      ],
      meta: { total: 2 },
    };

    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useContents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.data).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledWith('/contents', expect.any(Object));
  });

  it('handles error state', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useContents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe('Network error');
  });
});

describe('useCreateContent', () => {
  it('creates content and invalidates cache', async () => {
    const mockContent = { id: '1', title: 'New Content' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: mockContent } });

    const { result } = renderHook(() => useCreateContent(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      projectId: 'project-1',
      title: 'New Content',
      vertical: 'senior_health',
      format: 'short',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/contents', expect.any(Object));
  });
});
```

### 2.3 Jest 설정

```javascript
// jest.config.js (Backend)
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 3. Integration Testing

### 3.1 API Integration Test

```typescript
// test/e2e/contents.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma/prisma.service';
import { TestFactory } from '../helpers/test-factory';

describe('Contents API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUser: any;
  let testProject: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 테스트 데이터 설정
    testUser = await prisma.user.create({
      data: TestFactory.createUser({ email: 'test@example.com' }),
    });

    testProject = await prisma.project.create({
      data: TestFactory.createProject({ ownerId: testUser.id }),
    });

    // 인증 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!@#' });
    
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.content.deleteMany({ where: { projectId: testProject.id } });
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await app.close();
  });

  describe('POST /api/v1/contents', () => {
    it('should create content with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProject.id,
          title: 'E2E Test Content',
          vertical: 'senior_health',
          format: 'short',
          tone: 'informative',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Test Content');
      expect(response.body.data.status).toBe('draft');
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contents')
        .send({
          projectId: testProject.id,
          title: 'Test',
        })
        .expect(401);
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProject.id,
          // title 누락
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 403 for unauthorized project', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: 'unauthorized-project-id',
          title: 'Test',
          vertical: 'senior_health',
          format: 'short',
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/contents', () => {
    beforeAll(async () => {
      // 테스트 콘텐츠 생성
      await prisma.content.createMany({
        data: [
          TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id, title: 'Content 1' }),
          TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id, title: 'Content 2' }),
          TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id, title: 'Content 3' }),
        ],
      });
    });

    it('should return paginated contents', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
    });

    it('should filter by project', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ projectId: testProject.id })
        .expect(200);

      response.body.data.forEach((content: any) => {
        expect(content.projectId).toBe(testProject.id);
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/contents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'draft' })
        .expect(200);

      response.body.data.forEach((content: any) => {
        expect(content.status).toBe('draft');
      });
    });
  });

  describe('GET /api/v1/contents/:id', () => {
    let contentId: string;

    beforeAll(async () => {
      const content = await prisma.content.create({
        data: TestFactory.createContent({
          projectId: testProject.id,
          createdById: testUser.id,
        }),
      });
      contentId = content.id;
    });

    it('should return content details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/contents/${contentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(contentId);
    });

    it('should return 404 for non-existent content', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/contents/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### 3.2 Database Integration Test

```typescript
// test/integration/contents.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContentsRepository } from '../../src/modules/contents/contents.repository';
import { PrismaService } from '../../src/database/prisma/prisma.service';
import { TestFactory } from '../helpers/test-factory';

describe('ContentsRepository (Integration)', () => {
  let repository: ContentsRepository;
  let prisma: PrismaService;
  let testUser: any;
  let testProject: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentsRepository, PrismaService],
    }).compile();

    repository = module.get<ContentsRepository>(ContentsRepository);
    prisma = module.get<PrismaService>(PrismaService);

    // 테스트 데이터 설정
    testUser = await prisma.user.create({
      data: TestFactory.createUser(),
    });

    testProject = await prisma.project.create({
      data: TestFactory.createProject({ ownerId: testUser.id }),
    });
  });

  afterAll(async () => {
    await prisma.content.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.content.deleteMany({ where: { projectId: testProject.id } });
  });

  describe('create', () => {
    it('should create content in database', async () => {
      const data = {
        title: 'Test Content',
        projectId: testProject.id,
        createdById: testUser.id,
        status: 'draft',
        vertical: 'senior_health',
        format: 'short',
      };

      const result = await repository.create(data);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Content');

      const dbContent = await prisma.content.findUnique({
        where: { id: result.id },
      });
      expect(dbContent).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await prisma.content.createMany({
        data: [
          { ...TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id }), title: 'A Content' },
          { ...TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id }), title: 'B Content' },
          { ...TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id }), title: 'C Content' },
        ],
      });
    });

    it('should return paginated results', async () => {
      const result = await repository.findAll(testUser.id, { page: 1, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      await prisma.content.updateMany({
        where: { title: 'A Content' },
        data: { status: 'ready' },
      });

      const result = await repository.findAll(testUser.id, { page: 1, limit: 10 }, { status: 'ready' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('A Content');
    });
  });

  describe('update', () => {
    it('should update content', async () => {
      const content = await prisma.content.create({
        data: TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id }),
      });

      const result = await repository.update(content.id, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should soft delete content', async () => {
      const content = await prisma.content.create({
        data: TestFactory.createContent({ projectId: testProject.id, createdById: testUser.id }),
      });

      await repository.delete(content.id);

      const deleted = await prisma.content.findUnique({
        where: { id: content.id },
      });
      expect(deleted.deletedAt).not.toBeNull();
    });
  });
});
```

---

## 4. E2E Testing

### 4.1 Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2E 테스트 시나리오

```typescript
// e2e/content-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Content Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete content creation wizard', async ({ page }) => {
    // 1. 콘텐츠 생성 시작
    await page.goto('/contents/create?projectId=test-project');
    
    // 2. Step 1: 버티컬 선택
    await expect(page.getByText('콘텐츠 분야')).toBeVisible();
    await page.click('[data-vertical="senior_health"]');
    await page.click('button:has-text("다음")');

    // 3. Step 2: 형식 선택
    await expect(page.getByText('형식 선택')).toBeVisible();
    await page.click('[data-format="short"]');
    await page.click('button:has-text("다음")');

    // 4. Step 3: 톤 선택
    await expect(page.getByText('톤 & 스타일')).toBeVisible();
    await page.click('[data-tone="informative"]');
    await page.click('button:has-text("다음")');

    // 5. Step 4: 데이터 소스 선택
    await expect(page.getByText('데이터 소스')).toBeVisible();
    await page.click('[data-source="google_news"]');
    await page.click('button:has-text("다음")');

    // 6. Step 5: 최종 확인
    await expect(page.getByText('최종 확인')).toBeVisible();
    await page.click('[data-platform="youtube"]');
    await page.click('button:has-text("콘텐츠 생성")');

    // 7. 결과 확인
    await expect(page.getByText('콘텐츠 생성 시작')).toBeVisible();
    await page.waitForURL(/\/contents\/[\w-]+/);
  });

  test('should display validation errors for required fields', async ({ page }) => {
    await page.goto('/contents/create?projectId=test-project');
    
    // 선택 없이 다음 버튼 클릭
    await page.click('button:has-text("다음")');
    
    // 버튼이 비활성화 상태여야 함
    await expect(page.locator('button:has-text("다음")')).toBeDisabled();
  });
});

// e2e/auth.spec.ts
test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('대시보드')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', 'Test123!@#');
    await page.fill('[name="confirmPassword"]', 'Test123!@#');
    await page.fill('[name="name"]', 'Test User');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should logout successfully', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 로그아웃
    await page.click('[data-testid="user-menu"]');
    await page.click('text=로그아웃');

    await expect(page).toHaveURL('/login');
  });
});
```

### 4.3 Page Object Pattern

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[name="email"]');
    this.passwordInput = page.locator('[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}

// e2e/pages/dashboard.page.ts
export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly recentContents: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsCards = page.locator('[data-testid="stats-cards"]');
    this.recentContents = page.locator('[data-testid="recent-contents"]');
    this.createButton = page.locator('button:has-text("새 콘텐츠")');
  }

  async getStats() {
    const cards = await this.statsCards.locator('[data-testid="stat-card"]').all();
    return Promise.all(cards.map(async (card) => ({
      title: await card.locator('[data-testid="stat-title"]').textContent(),
      value: await card.locator('[data-testid="stat-value"]').textContent(),
    })));
  }

  async clickCreateContent() {
    await this.createButton.click();
  }
}

// 사용 예시
test('dashboard shows stats', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login('test@example.com', 'Test123!@#');
  
  await page.waitForURL('/dashboard');
  
  const stats = await dashboardPage.getStats();
  expect(stats.length).toBeGreaterThan(0);
});
```

---

## 5. Performance Testing

### 5.1 k6 부하 테스트

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const contentCreationDuration = new Trend('content_creation_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95%가 500ms 이하
    http_req_failed: ['rate<0.01'],     // 에러율 1% 이하
    errors: ['rate<0.05'],              // 비즈니스 에러 5% 이하
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export function setup() {
  // 테스트용 인증 토큰 획득
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'LoadTest123!@#',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('accessToken') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // 시나리오 1: 대시보드 로드
  const dashboardRes = http.get(`${BASE_URL}/users/me/dashboard`, { headers });
  check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // 시나리오 2: 콘텐츠 목록 조회
  const contentsRes = http.get(`${BASE_URL}/contents?page=1&limit=20`, { headers });
  check(contentsRes, {
    'contents list status is 200': (r) => r.status === 200,
    'contents list has data': (r) => r.json('data').length >= 0,
  }) || errorRate.add(1);

  sleep(1);

  // 시나리오 3: 콘텐츠 생성 (10%의 사용자만)
  if (Math.random() < 0.1) {
    const startTime = Date.now();
    
    const createRes = http.post(`${BASE_URL}/contents`, JSON.stringify({
      projectId: 'test-project-id',
      title: `Load Test Content ${Date.now()}`,
      vertical: 'senior_health',
      format: 'short',
    }), { headers });

    contentCreationDuration.add(Date.now() - startTime);

    check(createRes, {
      'content creation status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);
  }

  sleep(2);
}

export function teardown(data) {
  // 테스트 데이터 정리
  console.log('Load test completed');
}
```

### 5.2 API 응답 시간 벤치마크

```javascript
// k6/api-benchmark.js
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const endpoints = {
  dashboard: new Trend('endpoint_dashboard'),
  contentsList: new Trend('endpoint_contents_list'),
  contentDetail: new Trend('endpoint_content_detail'),
  projectsList: new Trend('endpoint_projects_list'),
};

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    'endpoint_dashboard': ['p(95)<200'],
    'endpoint_contents_list': ['p(95)<300'],
    'endpoint_content_detail': ['p(95)<150'],
    'endpoint_projects_list': ['p(95)<200'],
  },
};

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };

  // Dashboard
  let start = Date.now();
  http.get(`${BASE_URL}/users/me/dashboard`, { headers });
  endpoints.dashboard.add(Date.now() - start);

  // Contents List
  start = Date.now();
  http.get(`${BASE_URL}/contents?page=1&limit=20`, { headers });
  endpoints.contentsList.add(Date.now() - start);

  // Content Detail
  start = Date.now();
  http.get(`${BASE_URL}/contents/test-content-id`, { headers });
  endpoints.contentDetail.add(Date.now() - start);

  // Projects List
  start = Date.now();
  http.get(`${BASE_URL}/projects`, { headers });
  endpoints.projectsList.add(Date.now() - start);
}
```

---

## 6. CI/CD 테스트 통합

### 6.1 GitHub Actions 테스트 워크플로우

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: autoclip_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/autoclip_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/autoclip_test
          REDIS_URL: redis://localhost:6379

  e2e-test:
    runs-on: ubuntu-latest
    needs: [unit-test, integration-test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. 테스트 커버리지 목표

### 7.1 모듈별 커버리지 목표

| 모듈 | Line Coverage | Branch Coverage | Function Coverage |
|------|---------------|-----------------|-------------------|
| Auth | 90% | 85% | 95% |
| Users | 85% | 80% | 90% |
| Projects | 85% | 80% | 90% |
| Contents | 90% | 85% | 95% |
| Subscriptions | 90% | 85% | 95% |
| n8n Integration | 80% | 75% | 85% |
| 전체 | 85% | 80% | 90% |

### 7.2 핵심 시나리오 E2E 커버리지

| 시나리오 | 우선순위 | 상태 |
|----------|---------|------|
| 회원가입 → 로그인 | P0 | ✅ |
| 프로젝트 생성 | P0 | ✅ |
| 콘텐츠 생성 위저드 | P0 | ✅ |
| 콘텐츠 게시 | P0 | ✅ |
| 구독 결제 | P0 | ✅ |
| OAuth 로그인 | P1 | ✅ |
| 팀 멤버 초대 | P1 | ✅ |
| 분석 대시보드 | P2 | 🔄 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-12-24 | 초기 버전 |
