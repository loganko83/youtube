# Implementation Plan: MVP Phase 1
## TubeGenius AI - Technical Architecture and Stack Decisions

---

## Tech Stack Summary

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript 5.x
  Styling: Tailwind CSS + shadcn/ui
  State: Zustand + TanStack Query
  Forms: React Hook Form + Zod

Backend:
  Framework: NestJS (Node.js)
  Language: TypeScript 5.x
  API: REST
  Auth: Passport.js + JWT
  Queue: BullMQ (Redis)

Orchestration:
  Workflow: n8n (self-hosted, queue mode)
  Scheduler: n8n Cron nodes
  Message Queue: Redis

AI/ML:
  LLM: Google Gemini (Flash + Pro)
  TTS: ElevenLabs (primary), OpenAI TTS (fallback)
  Image: Gemini Image (gemini-2.5-flash-image)
  Video: Creatomate API

Database:
  Primary: PostgreSQL 15
  Cache: Redis 7
  Media: S3/GCS

Infrastructure:
  Container: Docker
  Orchestration: Docker Compose (MVP), K8s (Scale)
  CDN: CloudFront / Cloud CDN
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MVP ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT LAYER                                    │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Next.js 14 Frontend                                              │  │ │
│  │  │  ├── /dashboard        → Overview, stats, pending approvals       │  │ │
│  │  │  ├── /generator        → Content generation studio                │  │ │
│  │  │  ├── /settings         → Channel config, data sources             │  │ │
│  │  │  └── /auth             → Login, OAuth callbacks                   │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         API LAYER                                       │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │  NestJS Backend                                                   │  │ │
│  │  │  ├── AuthModule        → JWT, OAuth (Google, YouTube)             │  │ │
│  │  │  ├── UserModule        → User profile, settings                   │  │ │
│  │  │  ├── ProjectModule     → Channel config, data sources             │  │ │
│  │  │  ├── ContentModule     → Content CRUD, status tracking            │  │ │
│  │  │  └── WebhookModule     → n8n callbacks, status updates            │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      ORCHESTRATION LAYER                                │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │  n8n Workflow Engine (Self-hosted)                                │  │ │
│  │  │  ├── WF1: Data Collection     → Fetch from RSS/APIs               │  │ │
│  │  │  ├── WF2: Script Generation   → Gemini + Safety Filter            │  │ │
│  │  │  ├── WF3: Media Production    → TTS + Image + Render              │  │ │
│  │  │  └── WF4: Publication         → YouTube Upload + Notify           │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      INTEGRATION LAYER                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │  │  Gemini  │  │ElevenLabs│  │Creatomate│  │ YouTube  │               │ │
│  │  │   API    │  │   API    │  │   API    │  │   API    │               │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA LAYER                                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                              │ │
│  │  │PostgreSQL│  │  Redis   │  │  S3/GCS  │                              │ │
│  │  │ (Data)   │  │ (Queue)  │  │ (Media)  │                              │ │
│  │  └──────────┘  └──────────┘  └──────────┘                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Entities

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50), -- 'google', 'kakao'
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects (Channel configurations)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    vertical VARCHAR(50) DEFAULT 'senior_health',
    tone VARCHAR(50) DEFAULT 'friendly',
    format VARCHAR(50) DEFAULT 'shorts',
    language VARCHAR(10) DEFAULT 'ko',
    youtube_channel_id VARCHAR(255),
    youtube_access_token TEXT,
    youtube_refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Sources
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL, -- 'rss', 'api', 'manual'
    name VARCHAR(255) NOT NULL,
    url TEXT,
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contents
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    source_id UUID REFERENCES data_sources(id),

    -- Source data
    source_title TEXT,
    source_url TEXT,
    source_content TEXT,

    -- Generated content
    title VARCHAR(255),
    script TEXT,
    voiceover_text TEXT,
    image_prompts JSONB,

    -- Safety
    critical_claims JSONB,
    safety_report TEXT,
    safety_score INTEGER,

    -- Media
    audio_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,

    -- Metadata
    description TEXT,
    tags TEXT[],

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    -- draft -> generating -> review -> approved -> uploading -> published

    -- YouTube
    youtube_video_id VARCHAR(50),
    youtube_status VARCHAR(50),
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Jobs (tracking async operations)
CREATE TABLE content_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES contents(id),
    job_type VARCHAR(50) NOT NULL,
    -- 'script_generation', 'tts', 'image', 'render', 'upload'
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, processing, completed, failed
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationships

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│  User    │──1:N──│   Project    │──1:N──│   Content    │
└──────────┘       └──────────────┘       └──────────────┘
                          │                      │
                          │                      │
                         1:N                    1:N
                          │                      │
                          ▼                      ▼
                   ┌──────────────┐       ┌──────────────┐
                   │ DataSource   │       │ ContentJob   │
                   └──────────────┘       └──────────────┘
```

---

## API Contracts

### Authentication

```typescript
// POST /api/auth/google
// Initiate Google OAuth flow
Response: { redirectUrl: string }

// GET /api/auth/google/callback
// Handle OAuth callback
Response: { accessToken: string, user: User }

// POST /api/auth/refresh
// Refresh JWT token
Request: { refreshToken: string }
Response: { accessToken: string }
```

### Projects

```typescript
// GET /api/projects
// List user's projects
Response: { projects: Project[] }

// POST /api/projects
// Create new project
Request: {
  name: string;
  vertical: 'senior_health' | 'finance' | 'tech_ai' | 'history' | 'commerce';
  tone: 'professional' | 'friendly' | 'mysterious' | 'urgent';
  format: 'shorts' | 'longform';
  language: string;
}
Response: { project: Project }

// PATCH /api/projects/:id
// Update project settings
Request: Partial<Project>
Response: { project: Project }

// POST /api/projects/:id/youtube/connect
// Connect YouTube channel
Response: { redirectUrl: string }
```

### Contents

```typescript
// GET /api/contents?projectId=xxx
// List contents for project
Response: { contents: Content[], pagination: Pagination }

// POST /api/contents/generate
// Generate new content from source
Request: {
  projectId: string;
  sourceId?: string;
  topic?: string;
}
Response: { content: Content, jobId: string }

// GET /api/contents/:id
// Get content details
Response: { content: Content, jobs: ContentJob[] }

// POST /api/contents/:id/approve
// Approve content for publication
Request: { scheduledAt?: string }
Response: { content: Content }

// POST /api/contents/:id/regenerate
// Regenerate content
Response: { content: Content, jobId: string }
```

### Webhooks (n8n → Backend)

```typescript
// POST /api/webhooks/n8n/script-complete
Request: {
  contentId: string;
  script: string;
  voiceoverText: string;
  imagePrompts: string[];
  criticalClaims: CriticalClaim[];
  safetyReport: string;
}

// POST /api/webhooks/n8n/media-complete
Request: {
  contentId: string;
  audioUrl: string;
  imageUrls: string[];
  videoUrl: string;
}

// POST /api/webhooks/n8n/upload-complete
Request: {
  contentId: string;
  youtubeVideoId: string;
  youtubeStatus: string;
}
```

---

## n8n Workflow Design

### WF1: Data Collection Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trigger: Cron (매일 09:00) OR Webhook (manual)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │  Cron   │───▶│  HTTP   │───▶│  Parse  │───▶│  Filter │                  │
│  │ Trigger │    │ Request │    │   RSS   │    │ Duplicates│                 │
│  └─────────┘    │(PubMed) │    └─────────┘    └─────────┘                  │
│                 └─────────┘                         │                       │
│                                                     ▼                       │
│                                              ┌─────────┐                    │
│                                              │  Store  │                    │
│                                              │ to DB   │                    │
│                                              └─────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WF2: Script Generation Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trigger: Webhook (content generation request)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Webhook │───▶│  Load   │───▶│ Gemini  │───▶│ Safety  │───▶│ Extract │  │
│  │ Trigger │    │ Context │    │  Flash  │    │ Filter  │    │ Claims  │  │
│  └─────────┘    └─────────┘    │ (Script)│    └─────────┘    └─────────┘  │
│                                └─────────┘                         │        │
│                                                                    ▼        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  ┌─────────┐  │
│  │ Callback│◀───│  Save   │◀───│ Generate│◀─────────────────│ Validate│  │
│  │ Webhook │    │  to DB  │    │Metadata │                  │  JSON   │  │
│  └─────────┘    └─────────┘    └─────────┘                  └─────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WF3: Media Production Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trigger: Webhook (script approved)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────────────────────────────────────┐                │
│  │ Webhook │───▶│              PARALLEL                   │                │
│  │ Trigger │    │  ┌─────────┐           ┌─────────┐     │                │
│  └─────────┘    │  │ElevenLabs│          │ Gemini  │     │                │
│                 │  │   TTS    │          │  Image  │     │                │
│                 │  └────┬─────┘          └────┬────┘     │                │
│                 └───────┼─────────────────────┼──────────┘                │
│                         │                     │                            │
│                         └──────────┬──────────┘                            │
│                                    ▼                                        │
│                             ┌─────────────┐                                │
│                             │  Creatomate │                                │
│                             │   Render    │                                │
│                             └──────┬──────┘                                │
│                                    ▼                                        │
│                             ┌─────────────┐    ┌─────────┐                │
│                             │  Upload S3  │───▶│ Callback│                │
│                             └─────────────┘    └─────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WF4: Publication Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trigger: Webhook (content approved) OR Cron (scheduled publish)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Trigger │───▶│  Load   │───▶│ YouTube │───▶│  Set    │───▶│ Callback│  │
│  │         │    │ Content │    │  Upload │    │ Metadata│    │ Webhook │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Gemini Prompt Templates

### Script Generation Prompt

```
System Prompt (Senior Health Vertical):
"""
당신은 시니어 건강 정보 전문 작가입니다.
50-70대 어르신과 그 보호자를 대상으로 건강 정보를 전달합니다.

작성 원칙:
1. 쉬운 단어 사용 (의학 용어 최소화)
2. 짧은 문장 (한 문장 20자 이내 권장)
3. 친근하고 따뜻한 톤
4. 공포 유발 표현 금지
5. 구체적인 의료 조언 금지 (반드시 의사 상담 권유)

출력 형식 (JSON):
{
  "hook": "첫 3초 주목끌기 멘트 (질문 형식 권장)",
  "body": "본문 내용 (3-5개 핵심 포인트)",
  "cta": "마무리 행동 유도 (구독, 좋아요, 알림설정)",
  "voiceoverText": "TTS용 전체 대본",
  "imagePrompts": ["장면1 이미지 설명", "장면2 이미지 설명", ...],
  "criticalClaims": [
    {"text": "주장 내용", "confidence": 0-100, "source": "출처"}
  ]
}
"""

User Prompt:
"""
다음 건강 정보를 60초 숏츠 대본으로 작성해주세요:

제목: {source_title}
내용: {source_content}
출처: {source_url}
"""
```

### Safety Filter Prompt

```
System Prompt:
"""
당신은 콘텐츠 안전성 검토 전문가입니다.
YouTube 커뮤니티 가이드라인과 한국 의료법/표시광고법 준수를 검토합니다.

검토 항목:
1. 특정 치료법 권유 여부
2. 의학적 조언 제공 여부
3. 공포 마케팅 여부
4. 과장/허위 주장 여부
5. 저작권 침해 가능성

출력 형식 (JSON):
{
  "isApproved": true/false,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "issues": ["이슈1", "이슈2"],
  "suggestions": ["수정 제안1", "수정 제안2"],
  "requiredDisclaimer": "필수 면책조항 문구"
}
"""
```

---

## Directory Structure

```
youtube/
├── .specify/                    # Spec-Kit configuration
│   ├── memory/
│   │   └── constitution.md
│   ├── specs/
│   │   └── 001-mvp-phase1/
│   │       ├── spec.md
│   │       ├── plan.md
│   │       └── tasks.md
│   └── templates/
│
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── generator/
│   │   │   └── settings/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   │
│   └── api/                     # NestJS backend
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── projects/
│       │   ├── contents/
│       │   └── webhooks/
│       └── prisma/
│
├── packages/
│   ├── shared/                  # Shared types and utilities
│   └── ai/                      # AI/LLM utilities
│
├── n8n/
│   ├── workflows/               # Exported workflow JSONs
│   └── credentials/             # Credential templates
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
│
└── docs/
    ├── 01_PRD.md
    ├── 02_ERD.md
    └── ...
```

---

## Environment Variables

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tubegenius

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# AI Services
GEMINI_API_KEY=xxx

# Media Services
ELEVENLABS_API_KEY=xxx
CREATOMATE_API_KEY=xxx

# YouTube
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=tubegenius-media

# n8n
N8N_WEBHOOK_URL=http://localhost:5678
N8N_API_KEY=xxx
```

---

## Research Notes

### Decision: Gemini Flash for Cost Efficiency
**Rationale**: Gemini 2.5 Flash offers $0.35/1M input tokens, significantly cheaper than GPT-4o. For script generation tasks, Flash provides sufficient quality while maintaining cost target of <$0.01/content.

### Decision: n8n for Orchestration
**Rationale**: n8n provides visual workflow builder, supports self-hosting, and has native integrations with all required services. Alternative (Temporal/Prefect) requires more development effort.

### Decision: Creatomate for Video Rendering
**Rationale**: Template-based rendering ensures consistent quality and reduces rendering time. Alternative (FFmpeg self-hosted) requires significant infrastructure investment.

### Decision: ElevenLabs for TTS
**Rationale**: Best quality Korean TTS with natural-sounding voices. OpenAI TTS available as fallback for cost-sensitive operations.

---

**Plan Version**: 1.0
**Last Updated**: 2025-12-24
**Author**: Engineering Team
