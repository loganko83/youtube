# API 설계 문서
## AI 기반 자동 동영상 콘텐츠 생성 플랫폼 "AutoClip"

---

## 1. API 설계 원칙

### 1.1 기본 원칙
```
1. RESTful 설계: 리소스 중심 URI, HTTP 메서드 활용
2. 버전 관리: URL 기반 버저닝 (/api/v1/)
3. 일관된 응답: 표준화된 응답 구조
4. 에러 처리: RFC 7807 Problem Details 준수
5. 보안: JWT 기반 인증, HTTPS 필수
6. 문서화: OpenAPI 3.0 스펙
```

### 1.2 URL 구조
```
https://api.autoclip.io/v1/{resource}/{id}/{sub-resource}

예시:
- GET    /v1/projects                    # 프로젝트 목록
- POST   /v1/projects                    # 프로젝트 생성
- GET    /v1/projects/{id}               # 프로젝트 조회
- PATCH  /v1/projects/{id}               # 프로젝트 수정
- DELETE /v1/projects/{id}               # 프로젝트 삭제
- GET    /v1/projects/{id}/contents      # 프로젝트의 콘텐츠 목록
```

### 1.3 표준 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "meta": {
    "timestamp": "2025-12-24T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 목록 응답 (페이지네이션)
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "timestamp": "2025-12-24T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 에러 응답 (RFC 7807)
```json
{
  "success": false,
  "error": {
    "type": "https://api.autoclip.io/errors/validation-error",
    "title": "Validation Error",
    "status": 400,
    "detail": "The request body contains invalid fields",
    "instance": "/v1/projects",
    "errors": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "REQUIRED"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-24T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## 2. 인증 API

### 2.1 회원가입
```yaml
POST /v1/auth/register

Request:
  Content-Type: application/json
  Body:
    {
      "email": "user@example.com",
      "password": "securePassword123!",
      "name": "홍길동",
      "terms_agreed": true
    }

Response (201 Created):
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_abc123",
        "email": "user@example.com",
        "name": "홍길동",
        "created_at": "2025-12-24T10:00:00Z"
      },
      "message": "Verification email sent"
    }
  }

Errors:
  400 - Invalid email format
  409 - Email already registered
```

### 2.2 로그인
```yaml
POST /v1/auth/login

Request:
  Content-Type: application/json
  Body:
    {
      "email": "user@example.com",
      "password": "securePassword123!"
    }

Response (200 OK):
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 900,
      "user": {
        "id": "usr_abc123",
        "email": "user@example.com",
        "name": "홍길동"
      }
    }
  }

Errors:
  401 - Invalid credentials
  423 - Account locked
```

### 2.3 OAuth 로그인
```yaml
POST /v1/auth/oauth/{provider}

Path Parameters:
  provider: google | kakao

Request:
  Content-Type: application/json
  Body:
    {
      "code": "oauth_authorization_code",
      "redirect_uri": "https://app.autoclip.io/oauth/callback"
    }

Response (200 OK):
  {
    "success": true,
    "data": {
      "access_token": "...",
      "refresh_token": "...",
      "is_new_user": false,
      "user": {...}
    }
  }
```

### 2.4 토큰 갱신
```yaml
POST /v1/auth/refresh

Request:
  Content-Type: application/json
  Body:
    {
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }

Response (200 OK):
  {
    "success": true,
    "data": {
      "access_token": "new_access_token",
      "expires_in": 900
    }
  }

Errors:
  401 - Invalid or expired refresh token
```

---

## 3. 사용자 API

### 3.1 내 정보 조회
```yaml
GET /v1/users/me

Headers:
  Authorization: Bearer {access_token}

Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "홍길동",
      "avatar_url": "https://...",
      "phone": "+821012345678",
      "locale": "ko",
      "timezone": "Asia/Seoul",
      "email_verified": true,
      "subscription": {
        "plan": "pro",
        "status": "active",
        "credits_remaining": 25,
        "current_period_end": "2026-01-24T00:00:00Z"
      },
      "organization": {
        "id": "org_xyz789",
        "name": "Seoul Labs",
        "role": "admin"
      },
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
```

### 3.2 내 정보 수정
```yaml
PATCH /v1/users/me

Headers:
  Authorization: Bearer {access_token}

Request:
  {
    "name": "홍길동 (수정)",
    "phone": "+821098765432",
    "locale": "en",
    "timezone": "America/New_York",
    "notification_settings": {
      "email_marketing": false,
      "push_content_ready": true
    }
  }

Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "usr_abc123",
      "name": "홍길동 (수정)",
      ...
    }
  }
```

---

## 4. 프로젝트 API

### 4.1 프로젝트 목록 조회
```yaml
GET /v1/projects

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  page: 1 (default)
  per_page: 20 (default, max 100)
  status: active | paused | archived (optional)
  vertical: senior_health | finance | tech | history | commerce (optional)
  sort: created_at | updated_at | name
  order: asc | desc (default)

Response (200 OK):
  {
    "success": true,
    "data": [
      {
        "id": "prj_abc123",
        "name": "시니어 건강 채널",
        "vertical": "senior_health",
        "content_format": "short",
        "status": "active",
        "is_auto_publish": true,
        "channels_count": 2,
        "contents_count": 45,
        "created_at": "2025-06-01T00:00:00Z",
        "updated_at": "2025-12-20T00:00:00Z"
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_items": 3,
      "total_pages": 1
    }
  }
```

### 4.2 프로젝트 생성
```yaml
POST /v1/projects

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "name": "금융 뉴스 채널",
    "description": "매일 주요 금융 뉴스를 숏폼으로",
    "vertical": "finance",
    "sub_category": "stocks",
    "content_format": "short",
    "language": "ko",
    "target_platforms": ["youtube_shorts", "tiktok"],
    "tone": "urgent",
    "style_preset": {
      "intro_style": "breaking_news",
      "use_data_overlay": true,
      "chart_style": "minimal"
    },
    "is_auto_publish": false
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "id": "prj_def456",
      "name": "금융 뉴스 채널",
      "vertical": "finance",
      ...
      "created_at": "2025-12-24T10:00:00Z"
    }
  }

Errors:
  400 - Validation error
  402 - Plan limit reached
  403 - Insufficient permissions
```

### 4.3 프로젝트 상세 조회
```yaml
GET /v1/projects/{id}

Headers:
  Authorization: Bearer {access_token}

Path Parameters:
  id: prj_abc123

Query Parameters:
  include: channels,sources,stats (comma separated)

Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "prj_abc123",
      "name": "시니어 건강 채널",
      "description": "노인 건강 정보 제공",
      "vertical": "senior_health",
      "sub_category": "general_health",
      "content_format": "short",
      "language": "ko",
      "target_platforms": ["youtube_shorts"],
      "tone": "professional",
      "style_preset": {...},
      "status": "active",
      "is_auto_publish": true,
      "channels": [
        {
          "id": "ch_001",
          "platform": "youtube",
          "channel_name": "시니어헬스TV",
          "status": "connected"
        }
      ],
      "sources": [
        {
          "id": "src_001",
          "source_type": "rss",
          "name": "건강 뉴스 피드",
          "is_active": true
        }
      ],
      "stats": {
        "total_contents": 150,
        "published_contents": 120,
        "total_views": 50000,
        "avg_engagement": 0.045
      },
      "created_at": "2025-06-01T00:00:00Z",
      "updated_at": "2025-12-20T00:00:00Z"
    }
  }

Errors:
  404 - Project not found
```

### 4.4 프로젝트 수정
```yaml
PATCH /v1/projects/{id}

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "name": "시니어 건강 채널 v2",
    "tone": "casual",
    "is_auto_publish": false
  }

Response (200 OK):
  {
    "success": true,
    "data": {...updated project}
  }
```

### 4.5 프로젝트 삭제
```yaml
DELETE /v1/projects/{id}

Headers:
  Authorization: Bearer {access_token}

Response (204 No Content)

Errors:
  404 - Project not found
  409 - Cannot delete project with active contents
```

---

## 5. 채널 API

### 5.1 채널 연결 (OAuth Flow)
```yaml
POST /v1/projects/{project_id}/channels/connect

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "platform": "youtube",
    "oauth_code": "authorization_code_from_oauth",
    "redirect_uri": "https://app.autoclip.io/oauth/youtube/callback"
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "id": "ch_abc123",
      "platform": "youtube",
      "channel_id": "UCxxxxxxxxxxxxx",
      "channel_name": "My Channel",
      "channel_url": "https://youtube.com/channel/UCxxxxx",
      "status": "connected",
      "upload_settings": {
        "default_visibility": "private",
        "auto_publish": false
      },
      "connected_at": "2025-12-24T10:00:00Z"
    }
  }
```

### 5.2 채널 설정 수정
```yaml
PATCH /v1/projects/{project_id}/channels/{channel_id}

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "upload_settings": {
      "default_visibility": "unlisted",
      "auto_publish": true,
      "schedule_time": "09:00",
      "timezone": "Asia/Seoul"
    }
  }

Response (200 OK):
  {
    "success": true,
    "data": {...updated channel}
  }
```

### 5.3 채널 연결 해제
```yaml
DELETE /v1/projects/{project_id}/channels/{channel_id}

Headers:
  Authorization: Bearer {access_token}

Response (204 No Content)
```

---

## 6. 데이터 소스 API

### 6.1 데이터 소스 추가
```yaml
POST /v1/projects/{project_id}/sources

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request (RSS Feed):
  {
    "name": "건강뉴스 피드",
    "source_type": "rss",
    "config": {
      "feed_url": "https://health.news.com/rss",
      "filter_keywords": ["노인", "건강", "운동"]
    },
    "schedule_cron": "0 9 * * *",
    "is_active": true
  }

Request (YouTube Channel):
  {
    "name": "참조 채널",
    "source_type": "youtube_channel",
    "config": {
      "channel_id": "UCxxxxxxxx",
      "extract_mode": "highlights",
      "min_duration": 60,
      "max_age_days": 30
    },
    "schedule_cron": "0 */6 * * *",
    "is_active": true
  }

Request (API - Finance):
  {
    "name": "증시 데이터",
    "source_type": "api",
    "config": {
      "api_type": "yahoo_finance",
      "symbols": ["005930.KS", "035420.KS"],
      "data_type": "daily_summary"
    },
    "schedule_cron": "0 18 * * 1-5",
    "is_active": true
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "id": "src_abc123",
      "name": "건강뉴스 피드",
      "source_type": "rss",
      "config": {...},
      "schedule_cron": "0 9 * * *",
      "is_active": true,
      "last_fetched_at": null,
      "created_at": "2025-12-24T10:00:00Z"
    }
  }
```

### 6.2 데이터 소스 수동 실행
```yaml
POST /v1/projects/{project_id}/sources/{source_id}/fetch

Headers:
  Authorization: Bearer {access_token}

Response (202 Accepted):
  {
    "success": true,
    "data": {
      "job_id": "job_xyz789",
      "status": "pending",
      "message": "Fetch job queued"
    }
  }
```

---

## 7. 콘텐츠 API

### 7.1 콘텐츠 목록 조회
```yaml
GET /v1/contents

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  project_id: prj_abc123 (required)
  status: draft | processing | ready | published | failed
  page: 1
  per_page: 20
  sort: created_at | published_at
  order: desc

Response (200 OK):
  {
    "success": true,
    "data": [
      {
        "id": "cnt_001",
        "project_id": "prj_abc123",
        "title": "노인 운동의 중요성",
        "status": "published",
        "thumbnail_url": "https://...",
        "video_duration": 45.5,
        "safety_score": 0.95,
        "uploads": [
          {
            "platform": "youtube",
            "status": "published",
            "platform_url": "https://youtube.com/shorts/xxx",
            "views": 1500
          }
        ],
        "created_at": "2025-12-20T10:00:00Z",
        "published_at": "2025-12-20T12:00:00Z"
      },
      ...
    ],
    "pagination": {...}
  }
```

### 7.2 콘텐츠 상세 조회
```yaml
GET /v1/contents/{id}

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  include: script,jobs,uploads (comma separated)

Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "cnt_001",
      "project_id": "prj_abc123",
      "title": "노인 운동의 중요성",
      "description": "규칙적인 운동이 노인 건강에 미치는 영향...",
      "script": {
        "hook": "65세 이상이라면 꼭 알아야 할 운동의 비밀!",
        "body": [
          "노인 운동은 근육량 유지에 필수적입니다.",
          "하루 30분의 가벼운 걷기만으로도..."
        ],
        "cta": "더 많은 건강 정보를 원하시면 구독하세요!",
        "full_text": "..."
      },
      "tags": ["노인건강", "운동", "건강정보"],
      "thumbnail_url": "https://cdn.autoclip.io/thumbs/cnt_001.jpg",
      "media_assets": [
        {
          "type": "image",
          "url": "https://cdn.autoclip.io/assets/...",
          "source": "generated",
          "prompt": "elderly person doing light exercise"
        }
      ],
      "audio_url": "https://cdn.autoclip.io/audio/cnt_001.mp3",
      "audio_duration": 42.5,
      "video_url": "https://cdn.autoclip.io/videos/cnt_001.mp4",
      "video_duration": 45.0,
      "video_resolution": "1080x1920",
      "status": "ready",
      "safety_score": 0.95,
      "safety_flags": [],
      "source_type": "rss",
      "source_url": "https://health.news.com/article/123",
      "jobs": [
        {
          "id": "job_001",
          "job_type": "script_generation",
          "status": "completed",
          "completed_at": "2025-12-20T10:01:00Z"
        },
        {
          "id": "job_002",
          "job_type": "tts",
          "status": "completed",
          "completed_at": "2025-12-20T10:02:00Z"
        },
        {
          "id": "job_003",
          "job_type": "render",
          "status": "completed",
          "completed_at": "2025-12-20T10:05:00Z"
        }
      ],
      "uploads": [
        {
          "id": "upl_001",
          "channel_id": "ch_001",
          "platform": "youtube",
          "platform_video_id": "abc123xyz",
          "platform_url": "https://youtube.com/shorts/abc123xyz",
          "status": "published",
          "published_at": "2025-12-20T12:00:00Z",
          "metrics": {
            "views": 1500,
            "likes": 45,
            "comments": 3
          }
        }
      ],
      "created_at": "2025-12-20T10:00:00Z",
      "updated_at": "2025-12-20T12:00:00Z"
    }
  }
```

### 7.3 콘텐츠 수동 생성 요청
```yaml
POST /v1/contents

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request (주제 기반):
  {
    "project_id": "prj_abc123",
    "generation_type": "topic",
    "topic": "노인 관절 건강 관리법",
    "options": {
      "duration_target": 45,
      "tone_override": "casual",
      "include_cta": true
    }
  }

Request (URL 기반):
  {
    "project_id": "prj_abc123",
    "generation_type": "url",
    "source_url": "https://health.news.com/article/123",
    "options": {
      "extract_key_points": true,
      "max_points": 3
    }
  }

Request (텍스트 기반):
  {
    "project_id": "prj_abc123",
    "generation_type": "text",
    "source_text": "노인 관절 건강을 위해서는...",
    "options": {
      "rewrite_style": "engaging"
    }
  }

Response (202 Accepted):
  {
    "success": true,
    "data": {
      "id": "cnt_new001",
      "status": "processing",
      "jobs": [
        {
          "id": "job_001",
          "job_type": "script_generation",
          "status": "pending"
        }
      ],
      "estimated_completion": "2025-12-24T10:05:00Z"
    }
  }

Errors:
  402 - Credits exhausted
  422 - Invalid source content
```

### 7.4 콘텐츠 수정
```yaml
PATCH /v1/contents/{id}

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "title": "수정된 제목",
    "script": {
      "hook": "수정된 훅 멘트"
    },
    "tags": ["태그1", "태그2", "태그3"]
  }

Response (200 OK):
  {
    "success": true,
    "data": {...updated content}
  }

Note: 
  - status가 'published'인 경우 수정 불가
  - script 수정 시 재렌더링 필요 여부 반환
```

### 7.5 콘텐츠 재생성
```yaml
POST /v1/contents/{id}/regenerate

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "regenerate_parts": ["script", "audio", "video"],
    "options": {
      "tone_override": "urgent"
    }
  }

Response (202 Accepted):
  {
    "success": true,
    "data": {
      "id": "cnt_001",
      "status": "processing",
      "jobs": [...new jobs]
    }
  }
```

### 7.6 콘텐츠 승인 및 발행
```yaml
POST /v1/contents/{id}/publish

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "channels": ["ch_001", "ch_002"],
    "schedule": null,  // 즉시 발행
    "visibility": "public"
  }

Request (예약 발행):
  {
    "channels": ["ch_001"],
    "schedule": "2025-12-25T09:00:00+09:00",
    "visibility": "public"
  }

Response (202 Accepted):
  {
    "success": true,
    "data": {
      "id": "cnt_001",
      "status": "publishing",
      "uploads": [
        {
          "channel_id": "ch_001",
          "status": "uploading"
        }
      ]
    }
  }

Errors:
  400 - Content not ready for publish
  402 - Channel disconnected
```

---

## 8. 템플릿 API

### 8.1 템플릿 목록 조회
```yaml
GET /v1/templates

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  type: system | custom | premium
  vertical: senior_health | finance | tech | history | commerce
  content_format: short | mid | long

Response (200 OK):
  {
    "success": true,
    "data": [
      {
        "id": "tpl_001",
        "name": "뉴스 브리핑 스타일",
        "thumbnail_url": "https://...",
        "template_type": "system",
        "vertical": "finance",
        "content_format": "short",
        "is_premium": false,
        "usage_count": 1500
      },
      ...
    ]
  }
```

### 8.2 템플릿 상세 조회
```yaml
GET /v1/templates/{id}

Response (200 OK):
  {
    "success": true,
    "data": {
      "id": "tpl_001",
      "name": "뉴스 브리핑 스타일",
      "description": "속보성 뉴스에 적합한 긴박한 분위기의 템플릿",
      "thumbnail_url": "https://...",
      "preview_url": "https://...",
      "template_type": "system",
      "vertical": "finance",
      "content_format": "short",
      "template_data": {
        "creatomate_template_id": "xxx",
        "duration": 60,
        "resolution": "1080x1920",
        "elements": {
          "intro": {
            "duration": 3,
            "animation": "slide_up"
          },
          "body": {
            "layout": "center_text",
            "text_animation": "typewriter"
          },
          "outro": {
            "duration": 5,
            "include_logo": true
          }
        },
        "fonts": ["Noto Sans KR Bold", "Noto Sans KR Regular"],
        "colors": {
          "primary": "#FF6B35",
          "secondary": "#004E89",
          "text": "#FFFFFF",
          "background": "#1A1A2E"
        }
      },
      "is_premium": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
```

---

## 9. 분석 API

### 9.1 사용량 조회
```yaml
GET /v1/analytics/usage

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  period: day | week | month
  start_date: 2025-12-01
  end_date: 2025-12-24

Response (200 OK):
  {
    "success": true,
    "data": {
      "summary": {
        "total_contents": 45,
        "total_credits_used": 45,
        "credits_remaining": 5,
        "total_api_cost": 4.15
      },
      "by_date": [
        {
          "date": "2025-12-24",
          "contents_created": 2,
          "credits_used": 2,
          "api_calls": {
            "gemini": 15,
            "elevenlabs": 2,
            "creatomate": 2
          }
        },
        ...
      ],
      "by_service": {
        "gemini": { "calls": 500, "cost": 0.85 },
        "elevenlabs": { "calls": 45, "cost": 2.25 },
        "creatomate": { "calls": 45, "cost": 1.05 }
      }
    }
  }
```

### 9.2 콘텐츠 성과 조회
```yaml
GET /v1/analytics/performance

Headers:
  Authorization: Bearer {access_token}

Query Parameters:
  project_id: prj_abc123 (optional)
  period: week | month | all
  
Response (200 OK):
  {
    "success": true,
    "data": {
      "summary": {
        "total_views": 150000,
        "total_likes": 3500,
        "total_comments": 250,
        "avg_engagement_rate": 0.025,
        "estimated_revenue": 45.50
      },
      "top_contents": [
        {
          "id": "cnt_001",
          "title": "노인 운동의 중요성",
          "views": 15000,
          "engagement_rate": 0.045
        }
      ],
      "by_platform": {
        "youtube_shorts": {
          "views": 120000,
          "engagement_rate": 0.028
        },
        "tiktok": {
          "views": 30000,
          "engagement_rate": 0.018
        }
      },
      "trends": [
        {
          "date": "2025-12-24",
          "views": 5000,
          "engagement_rate": 0.025
        }
      ]
    }
  }
```

---

## 10. Webhook API

### 10.1 Webhook 등록
```yaml
POST /v1/webhooks

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Request:
  {
    "url": "https://your-server.com/webhook",
    "events": [
      "content.created",
      "content.ready",
      "content.published",
      "content.failed"
    ],
    "secret": "your_webhook_secret"
  }

Response (201 Created):
  {
    "success": true,
    "data": {
      "id": "wh_abc123",
      "url": "https://your-server.com/webhook",
      "events": [...],
      "status": "active",
      "created_at": "2025-12-24T10:00:00Z"
    }
  }
```

### 10.2 Webhook 페이로드 형식
```json
{
  "event": "content.ready",
  "timestamp": "2025-12-24T10:05:00Z",
  "data": {
    "content_id": "cnt_001",
    "project_id": "prj_abc123",
    "title": "노인 운동의 중요성",
    "status": "ready",
    "video_url": "https://cdn.autoclip.io/videos/cnt_001.mp4"
  },
  "signature": "sha256=xxxxxxxxxxxxxxxxxxxx"
}
```

---

## 11. Rate Limiting

### 11.1 제한 정책
```yaml
Tiers:
  starter:
    requests_per_minute: 60
    requests_per_day: 1000
    
  pro:
    requests_per_minute: 120
    requests_per_day: 5000
    
  business:
    requests_per_minute: 300
    requests_per_day: 20000
    
  enterprise:
    requests_per_minute: 1000
    requests_per_day: unlimited
```

### 11.2 응답 헤더
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1735034400
```

### 11.3 초과 시 응답
```json
{
  "success": false,
  "error": {
    "type": "https://api.autoclip.io/errors/rate-limit-exceeded",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "You have exceeded the rate limit. Please try again later.",
    "retry_after": 60
  }
}
```

---

## 12. OpenAPI 스펙 예시

```yaml
openapi: 3.0.3
info:
  title: AutoClip API
  description: AI 기반 자동 동영상 콘텐츠 생성 플랫폼 API
  version: 1.0.0
  contact:
    email: api@autoclip.io
    
servers:
  - url: https://api.autoclip.io/v1
    description: Production
  - url: https://api.staging.autoclip.io/v1
    description: Staging

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
  schemas:
    Project:
      type: object
      properties:
        id:
          type: string
          example: "prj_abc123"
        name:
          type: string
          maxLength: 100
        vertical:
          type: string
          enum: [senior_health, finance, tech, history, commerce]
        # ... 이하 생략
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-12-24  
**작성자**: API Team
