# 시스템 아키텍처 설계 문서
## AI 기반 자동 동영상 콘텐츠 생성 플랫폼 "AutoClip"

---

## 1. 아키텍처 개요

### 1.1 설계 원칙
```
1. 마이크로서비스 지향: 독립적 배포 및 확장 가능
2. 이벤트 기반: 비동기 처리로 확장성 확보
3. 장애 격리: 서비스 간 영향 최소화
4. 보안 우선: Zero Trust 아키텍처
5. 비용 최적화: 사용량 기반 리소스 할당
```

### 1.2 고수준 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AUTOCLIP ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT LAYER                                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │ │
│  │  │   Web    │  │  Mobile  │  │   API    │  │  Webhook │                │ │
│  │  │  (React) │  │  (PWA)   │  │ Clients  │  │ External │                │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                │ │
│  └───────┼──────────────┼──────────────┼──────────────┼────────────────────┘ │
│          │              │              │              │                       │
│  ┌───────┴──────────────┴──────────────┴──────────────┴────────────────────┐ │
│  │                         EDGE LAYER                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  CloudFront/CDN  │  WAF  │  DDoS Protection  │  Rate Limiting     │ │ │
│  │  └────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                         API GATEWAY LAYER                                 │ │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  Kong / AWS API Gateway                                             │  │ │
│  │  │  • Authentication (JWT)    • Request Routing                       │  │ │
│  │  │  • Rate Limiting           • Request/Response Transform            │  │ │
│  │  │  • API Versioning          • Logging & Metrics                     │  │ │
│  │  └────────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                       APPLICATION SERVICES                                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │   User   │  │ Project  │  │ Content  │  │ Template │  │ Analytics│  │ │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │ │
│  └───────┼──────────────┼──────────────┼──────────────┼──────────────┼───────┘ │
│          │              │              │              │              │         │
│  ┌───────┴──────────────┴──────────────┴──────────────┴──────────────┴───────┐ │
│  │                      ORCHESTRATION LAYER                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      n8n Workflow Engine                             │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │ │
│  │  │  │  Trigger    │──▶│  Process   │──▶│  Publish    │                  │  │ │
│  │  │  │  Workflows  │  │  Workflows  │  │  Workflows  │                  │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                  │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                      INTEGRATION LAYER                                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Gemini  │  │ElevenLabs│  │Creatomate│  │ YouTube  │  │  TikTok  │  │ │
│  │  │   API    │  │   API    │  │   API    │  │   API    │  │   API    │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                          │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                         DATA LAYER                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │PostgreSQL│  │  Redis   │  │ MongoDB  │  │  S3/GCS  │                  │ │
│  │  │ (Primary)│  │ (Cache)  │  │ (Logs)   │  │ (Media)  │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘                  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 서비스 레이어 상세

### 2.1 Application Services

#### 2.1.1 User Service
```yaml
역할: 사용자 인증, 인가, 프로필 관리
기술: NestJS / Express.js

API Endpoints:
  POST   /auth/register         # 회원가입
  POST   /auth/login            # 로그인
  POST   /auth/oauth/:provider  # OAuth 로그인
  POST   /auth/refresh          # 토큰 갱신
  GET    /users/me              # 내 정보
  PATCH  /users/me              # 정보 수정
  DELETE /users/me              # 회원탈퇴

Dependencies:
  - PostgreSQL (user data)
  - Redis (session cache)
  - SendGrid (email)

Config:
  port: 3001
  replicas: 2
  resources:
    memory: 512Mi
    cpu: 0.5
```

#### 2.1.2 Project Service
```yaml
역할: 프로젝트, 채널, 데이터소스 관리
기술: NestJS / Express.js

API Endpoints:
  GET    /projects              # 프로젝트 목록
  POST   /projects              # 프로젝트 생성
  GET    /projects/:id          # 프로젝트 상세
  PATCH  /projects/:id          # 프로젝트 수정
  DELETE /projects/:id          # 프로젝트 삭제
  
  POST   /projects/:id/channels # 채널 연결
  DELETE /projects/:id/channels/:cid # 채널 해제
  
  POST   /projects/:id/sources  # 데이터소스 추가
  GET    /projects/:id/sources  # 데이터소스 목록

Dependencies:
  - PostgreSQL
  - n8n (workflow trigger)
  - YouTube/TikTok API (OAuth)

Config:
  port: 3002
  replicas: 2
```

#### 2.1.3 Content Service
```yaml
역할: 콘텐츠 생성, 관리, 상태 추적
기술: NestJS / FastAPI (Python)

API Endpoints:
  GET    /contents              # 콘텐츠 목록
  POST   /contents              # 콘텐츠 생성 요청
  GET    /contents/:id          # 콘텐츠 상세
  PATCH  /contents/:id          # 콘텐츠 수정
  DELETE /contents/:id          # 콘텐츠 삭제
  
  POST   /contents/:id/generate # 재생성 요청
  POST   /contents/:id/approve  # 승인 (자동발행)
  POST   /contents/:id/publish  # 수동 발행
  
  GET    /contents/:id/jobs     # 작업 상태
  GET    /contents/:id/uploads  # 업로드 상태

Dependencies:
  - PostgreSQL
  - Redis (job queue)
  - MongoDB (AI outputs)
  - S3 (media files)
  - n8n (content generation)

Config:
  port: 3003
  replicas: 3
```

#### 2.1.4 Template Service
```yaml
역할: 템플릿 관리, 렌더링 설정
기술: NestJS

API Endpoints:
  GET    /templates             # 템플릿 목록
  GET    /templates/:id         # 템플릿 상세
  POST   /templates             # 커스텀 템플릿 생성
  PATCH  /templates/:id         # 템플릿 수정
  DELETE /templates/:id         # 템플릿 삭제
  
  GET    /templates/:id/preview # 프리뷰 생성

Dependencies:
  - PostgreSQL
  - Creatomate (template sync)
  - S3 (template assets)

Config:
  port: 3004
  replicas: 1
```

#### 2.1.5 Analytics Service
```yaml
역할: 사용량 추적, 성과 분석, 리포팅
기술: FastAPI (Python)

API Endpoints:
  GET    /analytics/usage       # 사용량 통계
  GET    /analytics/credits     # 크레딧 사용 내역
  GET    /analytics/performance # 콘텐츠 성과
  GET    /analytics/dashboard   # 대시보드 데이터

Dependencies:
  - PostgreSQL (aggregated)
  - MongoDB (raw events)
  - Redis (real-time counters)

Config:
  port: 3005
  replicas: 1
```

### 2.2 Orchestration Layer (n8n)

#### 2.2.1 n8n 구성
```yaml
Deployment:
  mode: queue                   # 고성능 모드
  workers: 3                    # 워커 수
  database: PostgreSQL          # 워크플로우 저장
  
Environment:
  N8N_EXECUTION_MODE: queue
  QUEUE_BULL_REDIS_HOST: redis
  N8N_ENCRYPTION_KEY: ${secret}
  N8N_DEFAULT_BINARY_DATA_MODE: filesystem

Resources:
  main:
    memory: 2Gi
    cpu: 1
  worker:
    memory: 4Gi
    cpu: 2
```

#### 2.2.2 주요 워크플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CONTENT GENERATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐            │
│  │ Trigger  │────▶│ Data Fetch   │────▶│ Content Analysis │            │
│  │ (Webhook/│     │ (API/RSS/    │     │ (Gemini Flash)   │            │
│  │  Cron)   │     │  YouTube)    │     │                  │            │
│  └──────────┘     └──────────────┘     └────────┬─────────┘            │
│                                                  │                       │
│                                                  ▼                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ Script Gen   │◀────│ Topic Select │◀────│ Safety Pre-Check │        │
│  │ (Gemini 3    │     │ & Routing    │     │ (Guardrails)     │        │
│  │  Flash)      │     │              │     │                  │        │
│  └──────┬───────┘     └──────────────┘     └──────────────────┘        │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ TTS Generate │────▶│ Image Gen/   │────▶│ Video Render     │        │
│  │ (ElevenLabs/ │     │ Source Match │     │ (Creatomate)     │        │
│  │  OpenAI)     │     │ (DALL-E/     │     │                  │        │
│  └──────────────┘     │  Stock)      │     └────────┬─────────┘        │
│                       └──────────────┘              │                   │
│                                                     ▼                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ Publish      │◀────│ Human Review │◀────│ Safety Post-Check│        │
│  │ (YouTube/    │     │ (Optional)   │     │ (Audit Agent)    │        │
│  │  TikTok)     │     │              │     │                  │        │
│  └──────────────┘     └──────────────┘     └──────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 데이터 플로우

### 3.1 콘텐츠 생성 플로우

```
[사용자 요청] 
    │
    ▼
┌─────────────────┐
│ Content Service │ ◄─── API Gateway
└────────┬────────┘
         │ 1. 콘텐츠 레코드 생성
         │ 2. Job 큐에 등록
         ▼
┌─────────────────┐
│ Redis Queue     │ (BullMQ)
└────────┬────────┘
         │ 3. n8n Webhook 트리거
         ▼
┌─────────────────┐
│ n8n Workflow    │
├─────────────────┤
│ 4. 데이터 수집  │────▶ [External APIs]
│ 5. 대본 생성    │────▶ [Gemini API]
│ 6. 안전성 검증  │────▶ [Safety Agent]
│ 7. TTS 생성     │────▶ [ElevenLabs]
│ 8. 이미지 생성  │────▶ [DALL-E/Stock]
│ 9. 영상 렌더링  │────▶ [Creatomate]
└────────┬────────┘
         │ 10. 결과 Webhook
         ▼
┌─────────────────┐
│ Content Service │
├─────────────────┤
│ 11. 상태 업데이트│
│ 12. 파일 저장   │────▶ [S3]
│ 13. 알림 발송   │────▶ [Push/Email]
└─────────────────┘
```

### 3.2 상태 관리 플로우

```
Content States:
  draft ──▶ processing ──▶ ready ──▶ published
                │                        │
                ▼                        ▼
             failed               failed_upload

Job States:
  pending ──▶ running ──▶ completed
                │
                ▼
             failed (retry up to 3 times)
```

---

## 4. 외부 서비스 통합

### 4.1 AI/ML 서비스

#### 4.1.1 Google Gemini
```yaml
Purpose: 텍스트 분석, 대본 생성, 안전성 검증

Models:
  - gemini-2.5-flash: 요약, 키워드 추출 (저비용)
  - gemini-3-flash: 대본 생성, 고품질 출력 (균형)
  
Integration:
  type: REST API
  auth: API Key
  rate_limit: 60 RPM (Flash)
  
Cost Optimization:
  - Batch API 활용 (50% 할인)
  - 캐싱 전략 적용
  - 토큰 최적화 프롬프트
```

#### 4.1.2 ElevenLabs
```yaml
Purpose: 고품질 TTS 음성 생성

Models:
  - multilingual_v2: 다국어 지원
  - flash: 저지연, 비용 효율

Integration:
  type: REST API
  auth: API Key
  
Fallback:
  - OpenAI TTS (비용 절감)
  - Google Cloud TTS (대량 처리)
```

#### 4.1.3 Creatomate
```yaml
Purpose: 비디오 렌더링

Features:
  - 템플릿 기반 영상 생성
  - 동적 요소 삽입
  - 다해상도 출력

Integration:
  type: REST API + Webhook
  auth: API Key
  
Templates:
  - Short Form (9:16, 1080x1920)
  - Long Form (16:9, 1920x1080)
  - Square (1:1, 1080x1080)
```

### 4.2 플랫폼 API

#### 4.2.1 YouTube Data API
```yaml
Purpose: 채널 연동, 영상 업로드, 분석 데이터

Scopes:
  - youtube.readonly (채널 정보)
  - youtube.upload (영상 업로드)
  - youtube.force-ssl (보안)

Quota:
  - 10,000 units/day
  - Upload: 1,600 units
  - List: 1 unit
```

#### 4.2.2 TikTok API
```yaml
Purpose: 영상 업로드, 분석

Integration:
  - Content Posting API
  - Creator Marketplace API

Requirements:
  - Developer Account
  - App Review 필요
```

---

## 5. 인프라 구성

### 5.1 Kubernetes 클러스터

```yaml
# Namespace 구조
namespaces:
  - autoclip-prod      # 프로덕션
  - autoclip-staging   # 스테이징
  - autoclip-n8n       # n8n 워크플로우
  - monitoring         # 모니터링 스택

# Node Pools
node_pools:
  - name: general
    instance_type: m5.xlarge
    min_size: 2
    max_size: 10
    labels:
      workload: general
      
  - name: workers
    instance_type: c5.2xlarge
    min_size: 1
    max_size: 5
    labels:
      workload: n8n-worker
    taints:
      - key: dedicated
        value: n8n
        effect: NoSchedule
```

### 5.2 AWS 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         VPC (10.0.0.0/16)                        │    │
│  │                                                                   │    │
│  │  ┌────────────────────────────┐ ┌────────────────────────────┐  │    │
│  │  │    Public Subnets          │ │    Private Subnets         │  │    │
│  │  │    (10.0.1.0/24)           │ │    (10.0.10.0/24)          │  │    │
│  │  │                            │ │                            │  │    │
│  │  │  ┌────────────────────┐    │ │  ┌────────────────────┐   │  │    │
│  │  │  │   ALB (Internet)   │    │ │  │   EKS Cluster      │   │  │    │
│  │  │  └────────────────────┘    │ │  │   (K8s Services)   │   │  │    │
│  │  │                            │ │  └────────────────────┘   │  │    │
│  │  │  ┌────────────────────┐    │ │                            │  │    │
│  │  │  │   NAT Gateway      │    │ │  ┌────────────────────┐   │  │    │
│  │  │  └────────────────────┘    │ │  │   RDS PostgreSQL   │   │  │    │
│  │  │                            │ │  │   (Multi-AZ)       │   │  │    │
│  │  └────────────────────────────┘ │  └────────────────────┘   │  │    │
│  │                                 │                            │  │    │
│  │                                 │  ┌────────────────────┐   │  │    │
│  │                                 │  │   ElastiCache      │   │  │    │
│  │                                 │  │   (Redis Cluster)  │   │  │    │
│  │                                 │  └────────────────────┘   │  │    │
│  │                                 │                            │  │    │
│  │                                 │  ┌────────────────────┐   │  │    │
│  │                                 │  │   DocumentDB       │   │  │    │
│  │                                 │  │   (MongoDB)        │   │  │    │
│  │                                 │  └────────────────────┘   │  │    │
│  │                                 │                            │  │    │
│  │                                 └────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │  S3 (Media)       │  │  CloudFront (CDN) │  │  Route53 (DNS)    │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │  Secrets Manager  │  │  CloudWatch       │  │  X-Ray            │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 리소스 사양

```yaml
Production Environment:

EKS Cluster:
  - Node Type: m5.xlarge (4 vCPU, 16 GB)
  - Min Nodes: 2
  - Max Nodes: 10
  - Auto-scaling: CPU > 70%

RDS PostgreSQL:
  - Instance: db.r5.large
  - Storage: 100 GB (GP3)
  - Multi-AZ: Yes
  - Backup: 7 days

ElastiCache Redis:
  - Node Type: cache.r5.large
  - Nodes: 2 (Cluster mode)
  - Auto-failover: Yes

S3:
  - Storage Class: Standard
  - Lifecycle: 90일 후 IA 전환
  - Cross-Region: Yes (재해복구)
```

---

## 6. 보안 아키텍처

### 6.1 인증/인가 플로우

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Client]                                                             │
│     │                                                                 │
│     │ 1. Login (email/password or OAuth)                             │
│     ▼                                                                 │
│  ┌─────────────────┐                                                 │
│  │   Auth Service  │                                                 │
│  │   ────────────  │                                                 │
│  │   • Validate    │                                                 │
│  │   • Hash Check  │                                                 │
│  │   • OAuth Flow  │                                                 │
│  └────────┬────────┘                                                 │
│           │                                                           │
│           │ 2. Generate Tokens                                        │
│           ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     JWT TOKEN PAIR                               │ │
│  │  ┌─────────────────────┐    ┌─────────────────────┐            │ │
│  │  │   Access Token      │    │   Refresh Token     │            │ │
│  │  │   ───────────────   │    │   ─────────────────│            │ │
│  │  │   Expires: 15min    │    │   Expires: 7days    │            │ │
│  │  │   Contains:         │    │   Contains:         │            │ │
│  │  │   • user_id         │    │   • user_id         │            │ │
│  │  │   • org_id          │    │   • session_id      │            │ │
│  │  │   • roles           │    │                     │            │ │
│  │  │   • permissions     │    │                     │            │ │
│  │  └─────────────────────┘    └─────────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 RBAC 권한 모델

```yaml
Roles:
  owner:
    - 모든 권한
    - 조직 설정 변경
    - 멤버 관리
    
  admin:
    - 프로젝트 CRUD
    - 채널 관리
    - 템플릿 관리
    - 분석 조회
    
  editor:
    - 콘텐츠 CRUD
    - 콘텐츠 승인
    - 프로젝트 조회
    
  viewer:
    - 콘텐츠 조회
    - 분석 조회

Permissions Matrix:
  Resource          | owner | admin | editor | viewer
  ─────────────────────────────────────────────────────
  projects.create   |   ✓   |   ✓   |   ✗    |   ✗
  projects.read     |   ✓   |   ✓   |   ✓    |   ✓
  projects.update   |   ✓   |   ✓   |   ✗    |   ✗
  projects.delete   |   ✓   |   ✓   |   ✗    |   ✗
  contents.create   |   ✓   |   ✓   |   ✓    |   ✗
  contents.approve  |   ✓   |   ✓   |   ✓    |   ✗
  contents.publish  |   ✓   |   ✓   |   ✓    |   ✗
  analytics.read    |   ✓   |   ✓   |   ✓    |   ✓
  settings.modify   |   ✓   |   ✗   |   ✗    |   ✗
```

### 6.3 보안 레이어

```yaml
Network Security:
  - VPC 격리
  - Security Groups (최소 권한)
  - Network ACLs
  - Private Subnet (DB, Cache)

Application Security:
  - WAF Rules (OWASP Top 10)
  - Rate Limiting (IP/User 기반)
  - Input Validation
  - SQL Injection 방지
  - XSS 방지

Data Security:
  - 전송 암호화 (TLS 1.3)
  - 저장 암호화 (AES-256)
  - 키 관리 (AWS KMS)
  - 민감정보 마스킹

Monitoring:
  - 보안 이벤트 로깅
  - 이상 탐지
  - 침입 탐지 (GuardDuty)
  - 정기 취약점 스캔
```

---

## 7. 확장성 전략

### 7.1 수평 확장

```yaml
Auto-scaling Rules:

API Services:
  metrics:
    - CPU > 70%
    - Memory > 80%
    - Request Latency > 500ms
  min_replicas: 2
  max_replicas: 10
  cooldown: 300s

n8n Workers:
  metrics:
    - Queue Length > 50
    - Processing Time > 60s
  min_replicas: 1
  max_replicas: 5
  cooldown: 120s

Database:
  - Read Replicas (RDS)
  - Connection Pooling (PgBouncer)
  - Query Caching (Redis)
```

### 7.2 캐싱 전략

```yaml
Cache Layers:

CDN (CloudFront):
  - 정적 자산
  - 미디어 파일
  - TTL: 24h

Redis (Application):
  - 세션 데이터: 24h
  - 사용자 설정: 1h
  - API 응답: 5m
  - 템플릿 데이터: 1h

Browser:
  - Cache-Control headers
  - Service Worker (PWA)
```

---

## 8. 모니터링 및 관찰성

### 8.1 모니터링 스택

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY STACK                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │    Prometheus    │  │     Grafana      │  │   AlertManager   │      │
│  │   (Metrics)      │  │  (Visualization) │  │   (Alerts)       │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                  │
│           └─────────────────────┴─────────────────────┘                  │
│                                 │                                        │
│  ┌──────────────────────────────┴───────────────────────────────────┐   │
│  │                        Data Sources                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │   App    │  │   K8s    │  │   RDS    │  │  Redis   │         │   │
│  │  │ Metrics  │  │ Metrics  │  │ Metrics  │  │ Metrics  │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Logging Stack                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │   │
│  │  │ Fluent   │──▶│  OpenSearch  │──▶│  Kibana   │                  │   │
│  │  │ Bit      │  │  (ELK)   │  │           │                       │   │
│  │  └──────────┘  └──────────┘  └──────────┘                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Tracing Stack                              │   │
│  │  ┌──────────┐  ┌──────────┐                                     │   │
│  │  │  Jaeger  │  │  X-Ray   │  Distributed Tracing                │   │
│  │  └──────────┘  └──────────┘                                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Error Tracking                             │   │
│  │  ┌──────────┐                                                    │   │
│  │  │  Sentry  │  Exception & Error Monitoring                     │   │
│  │  └──────────┘                                                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 핵심 메트릭 (SLI/SLO)

```yaml
SLIs (Service Level Indicators):
  Availability:
    - HTTP Success Rate (2xx/3xx)
    - Target: 99.5%
    
  Latency:
    - API Response Time (p95)
    - Target: < 500ms
    
  Error Rate:
    - 5xx Error Rate
    - Target: < 0.5%
    
  Content Generation:
    - Success Rate
    - Target: > 95%
    - Avg Generation Time
    - Target: < 90s (shorts)

SLOs (Service Level Objectives):
  - 월간 가용성: 99.5%
  - API 응답 시간 (p95): 500ms
  - 콘텐츠 생성 성공률: 95%
  - 에러율: < 0.5%
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-12-24  
**작성자**: Architecture Team
