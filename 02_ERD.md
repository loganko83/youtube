# 데이터베이스 설계 문서 (ERD)
## AI 기반 자동 동영상 콘텐츠 생성 플랫폼 "AutoClip"

---

## 1. 데이터베이스 개요

### 1.1 데이터베이스 선택 근거
| DB 유형 | 용도 | 선택 이유 |
|---------|------|----------|
| **PostgreSQL** | Primary Database | ACID 보장, JSON 지원, 확장성 |
| **Redis** | Cache & Queue | 고속 캐싱, BullMQ 큐 관리 |
| **MongoDB** | 비정형 데이터 | AI 출력, 로그, 분석 데이터 |
| **S3/GCS** | 파일 스토리지 | 미디어 파일, 렌더링 결과 |

### 1.2 네이밍 컨벤션
```
테이블명: snake_case, 복수형 (users, projects)
컬럼명: snake_case (created_at, user_id)
인덱스: idx_{table}_{columns} (idx_users_email)
외래키: fk_{table}_{ref_table} (fk_projects_users)
```

---

## 2. ERD 다이어그램

### 2.1 전체 스키마 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AUTOCLIP DATABASE SCHEMA                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────┐               │
│  │  users   │────<│ subscriptions│     │  organizations │               │
│  └────┬─────┘     └──────────────┘     └───────┬────────┘               │
│       │                                         │                        │
│       │ 1:N                              1:N    │                        │
│       ▼                                         ▼                        │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────┐               │
│  │ projects │────<│   channels   │────<│ org_members    │               │
│  └────┬─────┘     └──────┬───────┘     └────────────────┘               │
│       │                   │                                              │
│       │ 1:N               │ 1:N                                         │
│       ▼                   ▼                                              │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │   contents   │  │   uploads    │                                     │
│  └──────┬───────┘  └──────────────┘                                     │
│         │                                                                │
│         │ 1:N                                                           │
│         ▼                                                                │
│  ┌──────────────────────────────────────────────────────┐               │
│  │                    content_jobs                       │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐                │
│  │  templates  │  │ data_sources │  │  api_usages     │                │
│  └─────────────┘  └──────────────┘  └─────────────────┘                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 테이블 상세 정의

### 3.1 사용자 관리 (User Management)

#### 3.1.1 users (사용자)
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                    -- OAuth 사용자는 NULL
    name            VARCHAR(100) NOT NULL,
    avatar_url      VARCHAR(500),
    phone           VARCHAR(20),
    
    -- OAuth 정보
    oauth_provider  VARCHAR(20),                     -- 'google', 'kakao', NULL
    oauth_id        VARCHAR(255),
    
    -- 상태 정보
    status          VARCHAR(20) DEFAULT 'active',    -- active, suspended, deleted
    email_verified  BOOLEAN DEFAULT FALSE,
    
    -- 설정
    locale          VARCHAR(10) DEFAULT 'ko',
    timezone        VARCHAR(50) DEFAULT 'Asia/Seoul',
    notification_settings JSONB DEFAULT '{}',
    
    -- 메타
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_status ON users(status);
```

#### 3.1.2 organizations (조직/팀)
```sql
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    logo_url        VARCHAR(500),
    
    -- 조직 설정
    plan_type       VARCHAR(20) DEFAULT 'starter',   -- starter, pro, business, enterprise
    settings        JSONB DEFAULT '{}',
    
    -- 브랜드 정보 (화이트라벨)
    brand_colors    JSONB DEFAULT '{}',
    custom_domain   VARCHAR(255),
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'active',
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### 3.1.3 organization_members (조직 멤버)
```sql
CREATE TABLE organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role            VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, editor, viewer
    permissions     JSONB DEFAULT '{}',
    
    invited_by      UUID REFERENCES users(id),
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### 3.2 구독 관리 (Subscription Management)

#### 3.2.1 subscription_plans (구독 플랜)
```sql
CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,     -- starter, pro, business
    
    -- 가격
    price_monthly   DECIMAL(10,2) NOT NULL,
    price_yearly    DECIMAL(10,2),
    currency        VARCHAR(3) DEFAULT 'KRW',
    
    -- 제한
    monthly_credits INTEGER NOT NULL,                -- 월간 생성 가능 수
    max_channels    INTEGER DEFAULT 1,
    max_projects    INTEGER DEFAULT 3,
    
    -- 기능 플래그
    features        JSONB NOT NULL DEFAULT '{}',
    /*
    {
        "advanced_templates": false,
        "priority_rendering": false,
        "api_access": false,
        "white_label": false,
        "analytics_pro": false,
        "custom_voices": false,
        "team_seats": 1
    }
    */
    
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INTEGER DEFAULT 0,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2.2 subscriptions (구독)
```sql
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- 상태
    status              VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired
    billing_cycle       VARCHAR(10) DEFAULT 'monthly', -- monthly, yearly
    
    -- 기간
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end  TIMESTAMP WITH TIME ZONE,
    cancelled_at        TIMESTAMP WITH TIME ZONE,
    
    -- 결제 정보
    payment_method_id   VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- 사용량
    credits_used        INTEGER DEFAULT 0,
    credits_remaining   INTEGER NOT NULL,
    
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_owner CHECK (
        (user_id IS NOT NULL AND organization_id IS NULL) OR
        (user_id IS NULL AND organization_id IS NOT NULL)
    )
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 3.3 프로젝트 관리 (Project Management)

#### 3.3.1 projects (프로젝트)
```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    
    -- 버티컬 설정
    vertical        VARCHAR(30) NOT NULL,            -- senior_health, finance, tech, history, commerce
    sub_category    VARCHAR(50),
    
    -- 콘텐츠 설정
    content_format  VARCHAR(20) DEFAULT 'short',     -- short, mid, long
    language        VARCHAR(10) DEFAULT 'ko',
    target_platforms JSONB DEFAULT '["youtube_shorts"]',
    
    -- 톤앤매너
    tone            VARCHAR(30) DEFAULT 'professional', -- professional, casual, urgent, mysterious
    style_preset    JSONB DEFAULT '{}',
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'active',    -- active, paused, archived
    is_auto_publish BOOLEAN DEFAULT FALSE,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_vertical ON projects(vertical);
```

#### 3.3.2 channels (연결된 채널)
```sql
CREATE TABLE channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    platform        VARCHAR(20) NOT NULL,            -- youtube, tiktok, instagram
    channel_id      VARCHAR(255) NOT NULL,           -- 플랫폼 채널 ID
    channel_name    VARCHAR(255),
    channel_url     VARCHAR(500),
    
    -- 인증 정보 (암호화 저장)
    access_token    TEXT,                            -- 암호화됨
    refresh_token   TEXT,                            -- 암호화됨
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 설정
    upload_settings JSONB DEFAULT '{}',
    /*
    {
        "default_visibility": "private",
        "auto_publish": false,
        "schedule_time": "09:00",
        "timezone": "Asia/Seoul"
    }
    */
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'connected', -- connected, disconnected, error
    last_sync_at    TIMESTAMP WITH TIME ZONE,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_channels_project ON channels(project_id);
CREATE INDEX idx_channels_platform ON channels(platform);
CREATE UNIQUE INDEX idx_channels_unique ON channels(project_id, platform, channel_id);
```

### 3.4 콘텐츠 관리 (Content Management)

#### 3.4.1 contents (콘텐츠)
```sql
CREATE TABLE contents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- 콘텐츠 정보
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    
    -- 대본
    script          JSONB NOT NULL,
    /*
    {
        "hook": "처음 3초 대본",
        "body": ["본문 섹션1", "본문 섹션2"],
        "cta": "마무리 CTA",
        "full_text": "전체 대본 텍스트"
    }
    */
    
    -- 메타데이터
    tags            TEXT[],
    thumbnail_url   VARCHAR(500),
    
    -- 미디어 소스
    media_assets    JSONB DEFAULT '[]',
    /*
    [
        {
            "type": "image",
            "url": "https://...",
            "source": "generated",
            "timestamp": 0
        }
    ]
    */
    
    -- 오디오
    audio_url       VARCHAR(500),
    audio_duration  DECIMAL(10,2),                   -- 초 단위
    
    -- 최종 영상
    video_url       VARCHAR(500),
    video_duration  DECIMAL(10,2),
    video_resolution VARCHAR(20),                    -- 1080x1920, 1920x1080 등
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'draft',     -- draft, processing, ready, published, failed
    
    -- 안전성 검증
    safety_score    DECIMAL(3,2),                    -- 0.00 ~ 1.00
    safety_flags    JSONB DEFAULT '[]',
    
    -- 원본 정보
    source_type     VARCHAR(20),                     -- api, rss, manual, url
    source_url      VARCHAR(500),
    source_data     JSONB,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_contents_project ON contents(project_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created ON contents(created_at DESC);
```

#### 3.4.2 content_jobs (콘텐츠 작업)
```sql
CREATE TABLE content_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id      UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    
    -- 작업 정보
    job_type        VARCHAR(30) NOT NULL,            -- script_generation, tts, image_gen, render, upload
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'pending',   -- pending, running, completed, failed, cancelled
    progress        INTEGER DEFAULT 0,               -- 0-100
    
    -- 실행 정보
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    
    -- 결과
    result          JSONB,
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    
    -- 외부 서비스
    external_job_id VARCHAR(255),                    -- Creatomate, n8n 등의 작업 ID
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_jobs_content ON content_jobs(content_id);
CREATE INDEX idx_content_jobs_status ON content_jobs(status);
CREATE INDEX idx_content_jobs_type ON content_jobs(job_type);
```

#### 3.4.3 content_uploads (업로드 기록)
```sql
CREATE TABLE content_uploads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id      UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    
    -- 플랫폼 정보
    platform_video_id VARCHAR(255),
    platform_url    VARCHAR(500),
    
    -- 상태
    status          VARCHAR(20) DEFAULT 'pending',   -- pending, uploading, published, failed, scheduled
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    published_at    TIMESTAMP WITH TIME ZONE,
    
    -- 성과 (연동 시)
    metrics         JSONB DEFAULT '{}',
    /*
    {
        "views": 0,
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "last_updated": "2025-01-01T00:00:00Z"
    }
    */
    
    error_message   TEXT,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_uploads_content ON content_uploads(content_id);
CREATE INDEX idx_uploads_channel ON content_uploads(channel_id);
CREATE INDEX idx_uploads_status ON content_uploads(status);
```

### 3.5 템플릿 관리 (Template Management)

#### 3.5.1 templates (템플릿)
```sql
CREATE TABLE templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 소유자 (NULL이면 시스템 기본 템플릿)
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    thumbnail_url   VARCHAR(500),
    
    -- 템플릿 유형
    template_type   VARCHAR(20) NOT NULL,            -- system, custom, premium
    vertical        VARCHAR(30),                     -- 특정 버티컬용
    content_format  VARCHAR(20),                     -- short, mid, long
    
    -- 템플릿 정의
    template_data   JSONB NOT NULL,
    /*
    {
        "creatomate_template_id": "xxx",
        "duration": 60,
        "resolution": "1080x1920",
        "elements": {
            "intro": {...},
            "body": {...},
            "outro": {...}
        },
        "fonts": ["Noto Sans KR"],
        "colors": {
            "primary": "#FF6B35",
            "secondary": "#004E89"
        }
    }
    */
    
    -- 상태
    is_active       BOOLEAN DEFAULT TRUE,
    is_premium      BOOLEAN DEFAULT FALSE,
    
    usage_count     INTEGER DEFAULT 0,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_vertical ON templates(vertical);
CREATE INDEX idx_templates_type ON templates(template_type);
```

### 3.6 데이터 소스 (Data Sources)

#### 3.6.1 data_sources (데이터 소스)
```sql
CREATE TABLE data_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    source_type     VARCHAR(30) NOT NULL,            -- youtube_channel, rss, api, keyword
    
    -- 소스 설정
    config          JSONB NOT NULL,
    /*
    YouTube Channel:
    {
        "channel_id": "UCxxxx",
        "extract_mode": "highlights",
        "min_duration": 60,
        "max_age_days": 30
    }
    
    RSS Feed:
    {
        "feed_url": "https://...",
        "filter_keywords": ["AI", "기술"]
    }
    
    API:
    {
        "api_type": "yahoo_finance",
        "symbols": ["AAPL", "GOOGL"],
        "data_type": "daily_summary"
    }
    
    Keyword:
    {
        "keywords": ["건강", "시니어"],
        "sources": ["google_news", "pubmed"]
    }
    */
    
    -- 스케줄
    schedule_cron   VARCHAR(50),                     -- '0 9 * * *' 매일 9시
    is_active       BOOLEAN DEFAULT TRUE,
    
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_data_sources_project ON data_sources(project_id);
CREATE INDEX idx_data_sources_type ON data_sources(source_type);
```

### 3.7 사용량 추적 (Usage Tracking)

#### 3.7.1 api_usages (API 사용량)
```sql
CREATE TABLE api_usages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- 서비스 정보
    service         VARCHAR(30) NOT NULL,            -- gemini, elevenlabs, creatomate, openai
    operation       VARCHAR(50) NOT NULL,            -- text_generation, tts, render
    
    -- 사용량
    input_units     INTEGER DEFAULT 0,               -- 토큰, 문자 수 등
    output_units    INTEGER DEFAULT 0,
    duration_ms     INTEGER,
    
    -- 비용
    estimated_cost  DECIMAL(10,6),                   -- USD
    
    -- 관련 콘텐츠
    content_id      UUID REFERENCES contents(id),
    job_id          UUID REFERENCES content_jobs(id),
    
    -- 응답 정보
    status_code     INTEGER,
    error_message   TEXT,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 파티셔닝을 위한 월별 테이블 생성 권장
CREATE INDEX idx_api_usages_user ON api_usages(user_id);
CREATE INDEX idx_api_usages_org ON api_usages(organization_id);
CREATE INDEX idx_api_usages_service ON api_usages(service);
CREATE INDEX idx_api_usages_created ON api_usages(created_at DESC);
```

#### 3.7.2 credit_transactions (크레딧 트랜잭션)
```sql
CREATE TABLE credit_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    
    -- 트랜잭션 유형
    transaction_type VARCHAR(20) NOT NULL,           -- usage, refund, bonus, reset
    
    -- 크레딧
    credits_amount  INTEGER NOT NULL,                -- 양수: 추가, 음수: 사용
    credits_balance INTEGER NOT NULL,                -- 거래 후 잔액
    
    -- 관련 정보
    content_id      UUID REFERENCES contents(id),
    description     TEXT,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_subscription ON credit_transactions(subscription_id);
CREATE INDEX idx_credit_tx_created ON credit_transactions(created_at DESC);
```

---

## 4. MongoDB 컬렉션 (비정형 데이터)

### 4.1 ai_outputs (AI 출력 저장)
```javascript
// Collection: ai_outputs
{
    _id: ObjectId,
    content_id: UUID,                    // PostgreSQL 참조
    job_id: UUID,
    
    output_type: "script" | "safety_check" | "metadata",
    
    // 원본 요청
    request: {
        model: "gemini-3-flash",
        prompt: "...",
        parameters: {...}
    },
    
    // 응답
    response: {
        raw_output: "...",
        parsed_output: {...},
        tokens_used: {
            input: 1500,
            output: 800
        }
    },
    
    // 메타
    processing_time_ms: 2500,
    created_at: ISODate
}
```

### 4.2 analytics_events (분석 이벤트)
```javascript
// Collection: analytics_events
{
    _id: ObjectId,
    event_type: "content_created" | "video_rendered" | "upload_completed",
    
    // 컨텍스트
    user_id: UUID,
    organization_id: UUID,
    project_id: UUID,
    content_id: UUID,
    
    // 이벤트 데이터
    properties: {
        vertical: "finance",
        duration: 45,
        template_id: "...",
        platform: "youtube_shorts"
    },
    
    // 세션/디바이스
    session_id: String,
    user_agent: String,
    ip_address: String,
    
    created_at: ISODate
}
```

### 4.3 workflow_logs (워크플로우 로그)
```javascript
// Collection: workflow_logs
{
    _id: ObjectId,
    
    workflow_id: String,                 // n8n 워크플로우 ID
    execution_id: String,                // n8n 실행 ID
    
    // 관련 정보
    project_id: UUID,
    content_id: UUID,
    
    // 실행 정보
    status: "running" | "completed" | "failed",
    nodes_executed: [
        {
            node_name: "Gemini Script Generator",
            status: "success",
            started_at: ISODate,
            completed_at: ISODate,
            output_summary: "..."
        }
    ],
    
    // 에러
    error: {
        node: "TTS Generator",
        message: "Rate limit exceeded",
        stack: "..."
    },
    
    started_at: ISODate,
    completed_at: ISODate
}
```

---

## 5. 인덱스 전략

### 5.1 복합 인덱스
```sql
-- 사용자별 프로젝트 조회 최적화
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- 프로젝트별 콘텐츠 목록 (최신순)
CREATE INDEX idx_contents_project_created ON contents(project_id, created_at DESC);

-- 상태별 콘텐츠 조회
CREATE INDEX idx_contents_project_status ON contents(project_id, status);

-- API 사용량 월별 집계
CREATE INDEX idx_api_usages_user_month ON api_usages(user_id, date_trunc('month', created_at));
```

### 5.2 부분 인덱스
```sql
-- 활성 구독만
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id) 
WHERE status = 'active';

-- 처리 대기 중인 작업
CREATE INDEX idx_content_jobs_pending ON content_jobs(content_id, created_at) 
WHERE status IN ('pending', 'running');

-- 발행된 콘텐츠만
CREATE INDEX idx_contents_published ON contents(project_id, published_at DESC) 
WHERE status = 'published';
```

### 5.3 GIN 인덱스 (JSONB)
```sql
-- 태그 검색
CREATE INDEX idx_contents_tags ON contents USING GIN(tags);

-- 미디어 타입 검색
CREATE INDEX idx_contents_media ON contents USING GIN(media_assets jsonb_path_ops);

-- 템플릿 속성 검색
CREATE INDEX idx_templates_data ON templates USING GIN(template_data jsonb_path_ops);
```

---

## 6. 데이터 마이그레이션 전략

### 6.1 버전 관리
```
/migrations
├── 001_initial_schema.sql
├── 002_add_organizations.sql
├── 003_add_templates.sql
├── 004_add_analytics.sql
└── ...
```

### 6.2 마이그레이션 예시
```sql
-- 001_initial_schema.sql
-- Up Migration
BEGIN;

CREATE TABLE users (...);
CREATE TABLE projects (...);
CREATE TABLE contents (...);

COMMIT;

-- Down Migration
BEGIN;

DROP TABLE IF EXISTS contents;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

COMMIT;
```

---

## 7. 백업 및 복구

### 7.1 백업 정책
| 대상 | 주기 | 보관 기간 | 방식 |
|------|------|----------|------|
| PostgreSQL | 매일 | 30일 | pg_dump + S3 |
| MongoDB | 매일 | 14일 | mongodump + S3 |
| Redis | 4시간 | 7일 | RDB Snapshot |
| 미디어 파일 | 실시간 | 영구 | Cross-region replication |

### 7.2 복구 RTO/RPO
```
RTO (Recovery Time Objective): 4시간
RPO (Recovery Point Objective): 1시간
```

---

## 8. 데이터 보안

### 8.1 암호화
```yaml
전송 중:
  - TLS 1.3 적용
  - 인증서 자동 갱신 (Let's Encrypt)

저장 시:
  - 민감 필드 AES-256 암호화
    - access_token
    - refresh_token
    - api_keys
  - 컬럼 레벨 암호화 (pgcrypto)
```

### 8.2 접근 제어
```sql
-- 역할 기반 접근 제어
CREATE ROLE app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

CREATE ROLE app_readwrite;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_readwrite;

CREATE ROLE app_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
```

---

## 9. 성능 최적화

### 9.1 파티셔닝 (대용량 테이블)
```sql
-- api_usages 월별 파티셔닝
CREATE TABLE api_usages (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE api_usages_2025_01 PARTITION OF api_usages
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
    
CREATE TABLE api_usages_2025_02 PARTITION OF api_usages
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### 9.2 연결 풀링
```yaml
# PgBouncer 설정
pool_mode: transaction
max_client_conn: 1000
default_pool_size: 25
reserve_pool_size: 5
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-12-24  
**작성자**: Database Team
