# Feature Specification: MVP Phase 1
## TubeGenius AI - Senior Health Vertical Automation

---

## Overview

| Field | Value |
|-------|-------|
| Feature ID | 001-mvp-phase1 |
| Title | Senior Health Content Automation Pipeline |
| Priority | P0 (Critical) |
| Target Release | Q1 2025 |
| Business Value | Establish Beachhead market, validate unit economics |

---

## Problem Statement

### The Gap
시니어 건강 정보 시장에서 신뢰할 수 있는 맞춤형 정보 콘텐츠가 부족합니다. 기존 크리에이터들은 영상 제작 기술 부재, 시간 부족, 콘텐츠 아이디어 고갈로 어려움을 겪고 있습니다.

### Target Users
1. **Primary**: 요양병원 마케팅 담당자 (40-60대 보호자 타겟)
2. **Secondary**: 부업 크리에이터 (패시브 인컴 추구)
3. **Tertiary**: 건강정보 채널 운영 희망자

### Success Metrics
- 파일럿 채널 5개 운영
- 월간 영상 150개 생성
- 월간 조회수 10만+
- 운영 비용 < $50/월

---

## User Stories

### US1: Content Configuration Wizard (P0)
```
AS A channel owner
I WANT TO configure my content preferences through a simple wizard
SO THAT the system generates relevant content for my audience

Acceptance Criteria:
- [ ] AC1.1: User can select vertical (Senior Health selected by default)
- [ ] AC1.2: User can choose tone (Professional, Friendly, Urgent)
- [ ] AC1.3: User can select content format (Shorts 60s / Long-form 5min+)
- [ ] AC1.4: User can set target language (Korean default)
- [ ] AC1.5: Configuration is saved and persisted across sessions

Independent Test:
1. New user completes wizard in < 2 minutes
2. All selections are saved to database
3. Next visit shows previously saved configuration
```

### US2: Data Source Integration (P0)
```
AS A channel owner
I WANT TO connect reliable health data sources
SO THAT my content is based on trustworthy information

Acceptance Criteria:
- [ ] AC2.1: System connects to PubMed RSS for medical research
- [ ] AC2.2: System connects to health news APIs (Google News Health)
- [ ] AC2.3: User can add custom RSS feeds
- [ ] AC2.4: Data sources are validated for reliability
- [ ] AC2.5: System displays data source attribution in content

Independent Test:
1. Add PubMed RSS feed
2. System fetches 10 recent health articles
3. Each article shows source and publication date
```

### US3: AI Script Generation (P0)
```
AS A channel owner
I WANT TO automatically generate video scripts from data sources
SO THAT I don't have to write content manually

Acceptance Criteria:
- [ ] AC3.1: System generates Hook (0-3s attention grabber)
- [ ] AC3.2: System generates Body (main content, easy language)
- [ ] AC3.3: System generates CTA (call to action)
- [ ] AC3.4: Script is optimized for senior audience (simple vocabulary)
- [ ] AC3.5: Script includes voiceover text separately
- [ ] AC3.6: Generation completes in < 30 seconds

Independent Test:
1. Select a health article from data source
2. Click "Generate Script"
3. Review generated script with Hook-Body-CTA structure
4. Verify vocabulary is senior-friendly
```

### US4: Safety Filter System (P0)
```
AS A channel owner
I WANT TO ensure generated content is safe and compliant
SO THAT my channel avoids policy violations

Acceptance Criteria:
- [ ] AC4.1: System blocks forbidden health topics (specific treatments)
- [ ] AC4.2: System adds medical disclaimer automatically
- [ ] AC4.3: Critical claims are extracted with confidence scores
- [ ] AC4.4: YMYL content triggers enhanced review
- [ ] AC4.5: Safety report is generated for each content

Independent Test:
1. Generate script about "diabetes treatment"
2. System flags sensitive medical content
3. Disclaimer is automatically added
4. Critical claims are highlighted with sources
```

### US5: TTS Voice Generation (P1)
```
AS A channel owner
I WANT TO convert scripts to natural voice audio
SO THAT my videos have professional narration

Acceptance Criteria:
- [ ] AC5.1: System generates Korean TTS with clear pronunciation
- [ ] AC5.2: Voice style is calm and reassuring (senior-appropriate)
- [ ] AC5.3: Audio quality is broadcast-ready
- [ ] AC5.4: Generation completes in < 60 seconds for 60s script
- [ ] AC5.5: User can preview audio before video generation

Independent Test:
1. Generate TTS from approved script
2. Play audio preview
3. Verify pronunciation and tone
4. Audio file is saved for video rendering
```

### US6: Video Rendering Pipeline (P1)
```
AS A channel owner
I WANT TO automatically render videos from scripts and audio
SO THAT I have publish-ready content

Acceptance Criteria:
- [ ] AC6.1: System renders Shorts format (9:16, 60s max)
- [ ] AC6.2: Template includes large subtitles (senior-friendly)
- [ ] AC6.3: Template uses high-contrast colors
- [ ] AC6.4: Background images are AI-generated or stock
- [ ] AC6.5: Rendering completes in < 2 minutes

Independent Test:
1. Submit script + audio for rendering
2. Video renders in < 2 minutes
3. Output is 9:16 aspect ratio
4. Subtitles are readable on mobile
```

### US7: YouTube Auto-Upload (P1)
```
AS A channel owner
I WANT TO automatically upload videos to my YouTube channel
SO THAT I don't have to manually upload each video

Acceptance Criteria:
- [ ] AC7.1: User connects YouTube channel via OAuth
- [ ] AC7.2: Videos are uploaded as "Private" by default
- [ ] AC7.3: Metadata (title, description, tags) is auto-generated
- [ ] AC7.4: User approves before publishing
- [ ] AC7.5: Scheduling option available

Independent Test:
1. Connect YouTube channel
2. Upload video to Private
3. Review metadata
4. Approve for publication
5. Video goes live on YouTube
```

### US8: Dashboard Monitoring (P1)
```
AS A channel owner
I WANT TO see my content generation status and performance
SO THAT I can track my channel's progress

Acceptance Criteria:
- [ ] AC8.1: Dashboard shows daily generation count
- [ ] AC8.2: Dashboard shows pending approvals
- [ ] AC8.3: Dashboard shows upload status
- [ ] AC8.4: Dashboard shows basic analytics (if connected)
- [ ] AC8.5: Dashboard refreshes automatically

Independent Test:
1. Open dashboard
2. See today's generated content count
3. See list of pending approvals
4. See recent upload statuses
```

---

## Non-Functional Requirements

### Performance
| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Script Generation | < 30 seconds | p95 latency |
| TTS Generation | < 60 seconds | p95 latency |
| Video Rendering | < 2 minutes | p95 latency |
| API Response | < 200ms | p95 latency |
| Dashboard Load | < 1 second | First contentful paint |

### Security
- OAuth 2.0 for YouTube connection
- JWT session management (24h expiry)
- All API calls over HTTPS
- User data encrypted at rest (AES-256)
- PII masking in logs

### Availability
- 99.5% uptime target
- Graceful degradation on API failures
- Auto-retry for transient errors
- Queue-based processing for reliability

### Cost Efficiency
| Component | Target Cost/Content |
|-----------|---------------------|
| LLM (Gemini) | $0.01 |
| TTS (ElevenLabs) | $0.015 |
| Images | $0.01 |
| Rendering | $0.05 |
| **Total** | **< $0.10** |

---

## Out of Scope (MVP)

The following are explicitly NOT included in MVP:
- Multi-vertical support (Finance, Tech, History)
- TikTok/Instagram integration
- A/B testing
- B2B white-label features
- Team collaboration
- Advanced analytics
- Multi-language support

---

## Dependencies

### External Services
| Service | Purpose | Fallback |
|---------|---------|----------|
| Google Gemini | Script generation | Manual input |
| ElevenLabs | TTS generation | OpenAI TTS |
| Creatomate | Video rendering | Shotstack |
| YouTube API | Upload/metadata | Manual upload |

### Internal Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| n8n Instance | DevOps | Required |
| PostgreSQL | DevOps | Required |
| Redis | DevOps | Required |
| S3/GCS Bucket | DevOps | Required |

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| YouTube API quota exceeded | Medium | High | Implement rate limiting, request quota increase |
| Gemini generates unsafe content | Low | Critical | Multi-layer safety filter, human review option |
| TTS quality issues | Low | Medium | Fallback to alternative TTS provider |
| Rendering failures | Medium | Medium | Retry logic, alternative rendering service |
| Cost overrun | Medium | High | Strict cost monitoring, usage alerts |

---

## Glossary

| Term | Definition |
|------|------------|
| Shorts | YouTube video format, max 60 seconds, 9:16 aspect |
| YMYL | Your Money or Your Life - high-sensitivity content categories |
| Hook | Opening 3 seconds of video to capture attention |
| CTA | Call to Action - prompt for viewer engagement |
| CPM | Cost Per Mille - revenue per 1,000 views |
| Beachhead | Initial target market for market validation |

---

**Specification Version**: 1.0
**Last Updated**: 2025-12-24
**Author**: Product Team
**Reviewers**: Engineering, QA, Business
