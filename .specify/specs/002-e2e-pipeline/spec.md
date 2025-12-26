# Feature Specification: E2E Content Pipeline Completion

**Feature Branch**: `002-e2e-pipeline`
**Created**: 2024-12-25
**Status**: Draft
**Input**: User description: "Complete the end-to-end content generation pipeline: video rendering, YouTube upload, and automation job execution"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Video Rendering Pipeline (Priority: P1)

사용자가 콘텐츠를 생성하면, 스크립트와 TTS 오디오가 완료된 후 자동으로 비디오가 렌더링되어야 합니다.

**Why this priority**: 비디오 렌더링 없이는 YouTube에 업로드할 콘텐츠가 없음. 핵심 기능.

**Independent Test**: TTS 완료 후 VIDEO_RENDERING 상태로 전환되고, Creatomate API 호출이 발생하며, 완료 시 videoUrl이 저장되는지 확인

**Acceptance Scenarios**:

1. **Given** 콘텐츠가 TTS_COMPLETED 상태일 때, **When** 파이프라인이 다음 단계로 진행하면, **Then** VideoService.renderVideo()가 호출되고 상태가 VIDEO_RENDERING으로 변경됨
2. **Given** 비디오 렌더링이 완료되면, **When** Creatomate 웹훅이 수신되면, **Then** 콘텐츠의 videoUrl이 업데이트되고 상태가 VIDEO_COMPLETED로 변경됨
3. **Given** 렌더링 중 오류 발생 시, **When** Creatomate에서 실패 응답이 오면, **Then** 상태가 FAILED로 변경되고 에러 메시지가 기록됨

---

### User Story 2 - YouTube Upload Pipeline (Priority: P1)

비디오 렌더링이 완료되면 자동으로 YouTube에 업로드되어야 합니다.

**Why this priority**: YouTube 업로드는 최종 결과물 전달의 핵심. 사용자 가치 실현.

**Independent Test**: VIDEO_COMPLETED 상태의 콘텐츠가 YouTube API를 통해 업로드되고, youtubeVideoId가 저장되는지 확인

**Acceptance Scenarios**:

1. **Given** 콘텐츠가 VIDEO_COMPLETED 상태이고 프로젝트에 YouTube OAuth 토큰이 있을 때, **When** 업로드 프로세스가 시작되면, **Then** YouTubeService.uploadVideo()가 호출됨
2. **Given** 업로드가 성공하면, **When** YouTube API가 videoId를 반환하면, **Then** 콘텐츠의 youtubeVideoId가 저장되고 상태가 COMPLETED로 변경됨
3. **Given** 업로드 중 인증 오류 발생 시, **When** OAuth 토큰이 만료되면, **Then** 토큰 갱신을 시도하고 재업로드함

---

### User Story 3 - Automated Content Generation (Priority: P1)

설정된 시간에 자동으로 트렌드를 수집하고 콘텐츠를 생성해야 합니다.

**Why this priority**: 자동화 없이는 수동 운영 필요. 플랫폼의 핵심 가치.

**Independent Test**: 크론 잡이 실행되어 활성화된 프로젝트의 콘텐츠가 자동 생성되는지 확인

**Acceptance Scenarios**:

1. **Given** 자동화가 활성화된 프로젝트가 있을 때, **When** 트렌드 수집 크론(06:00)이 실행되면, **Then** TrendsService.collectAll()이 호출되고 결과가 DB에 저장됨
2. **Given** 트렌드 데이터가 수집된 후, **When** 콘텐츠 생성 크론(09:00)이 실행되면, **Then** 각 프로젝트의 dailyLimit까지 콘텐츠가 생성됨
3. **Given** autoPublish가 활성화된 프로젝트, **When** 콘텐츠 생성이 완료되면, **Then** 자동으로 YouTube 업로드까지 진행됨

---

### Edge Cases

- 비디오 렌더링 중 Creatomate API rate limit 초과 시 재시도 로직
- YouTube 업로드 시 할당량(quota) 초과 처리
- 동시에 여러 프로젝트의 자동화 작업이 실행될 때 병렬 처리
- OAuth 토큰 만료 시 자동 갱신 및 알림
- 트렌드 데이터가 없을 때 랜덤 토픽 선택 폴백

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST call VideoService.renderVideo() when content reaches TTS_COMPLETED status
- **FR-002**: System MUST update content status to VIDEO_RENDERING during render process
- **FR-003**: System MUST handle Creatomate webhook for render completion/failure
- **FR-004**: System MUST call YouTubeService.uploadVideo() when content reaches VIDEO_COMPLETED status
- **FR-005**: System MUST store youtubeVideoId and update status to COMPLETED on successful upload
- **FR-006**: System MUST execute trend collection cron job at configured time (default 06:00 KST)
- **FR-007**: System MUST execute content generation cron job at configured time (default 09:00 KST)
- **FR-008**: System MUST respect dailyLimit per project for automated content generation
- **FR-009**: System MUST handle OAuth token refresh automatically
- **FR-010**: System MUST log all automation activities for monitoring

### Key Entities

- **Content**: Extended with videoUrl, youtubeVideoId, uploadedAt fields
- **ProjectAutomation**: Existing model with isEnabled, generateTime, publishTime, dailyLimit
- **TrendData**: Collected trends with source, keyword, score, category

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 콘텐츠 생성부터 YouTube 업로드까지 전체 파이프라인이 수동 개입 없이 완료됨
- **SC-002**: 자동화된 프로젝트에서 하루 dailyLimit 개수의 콘텐츠가 자동 생성됨
- **SC-003**: 비디오 렌더링 성공률 95% 이상
- **SC-004**: YouTube 업로드 성공률 95% 이상 (할당량 제외)
- **SC-005**: 전체 파이프라인 완료 시간 10분 이내 (평균)
