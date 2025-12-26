# Task Breakdown: MVP Phase 1
## TubeGenius AI - Senior Health Vertical

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 48 |
| Phase 1 (Setup) | 8 tasks |
| Phase 2 (Foundation) | 12 tasks |
| Phase 3 (US1-US4) | 16 tasks |
| Phase 4 (US5-US8) | 12 tasks |
| Estimated Duration | 12 weeks |

---

## Phase 1: Project Setup (Week 1-2)

### T001: Initialize Monorepo Structure
```yaml
ID: T001
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Set up monorepo structure with pnpm workspaces.
  Create apps/web, apps/api, packages/shared directories.

Acceptance Criteria:
  - [ ] pnpm workspace configured
  - [ ] apps/web (Next.js) initialized
  - [ ] apps/api (NestJS) initialized
  - [ ] packages/shared created
  - [ ] TypeScript path aliases configured

Dependencies: None
Parallel: No
```

### T002: Configure Next.js Frontend
```yaml
ID: T002
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Set up Next.js 14 with App Router, Tailwind CSS, shadcn/ui.
  Configure TypeScript, ESLint, Prettier.

Acceptance Criteria:
  - [ ] Next.js 14 with App Router
  - [ ] Tailwind CSS configured
  - [ ] shadcn/ui components installed
  - [ ] TypeScript strict mode
  - [ ] ESLint + Prettier configured

Dependencies: T001
Parallel: T003 [P]
```

### T003: Configure NestJS Backend
```yaml
ID: T003
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Set up NestJS backend with TypeScript.
  Configure Prisma ORM, validation pipes.

Acceptance Criteria:
  - [ ] NestJS project initialized
  - [ ] Prisma ORM configured
  - [ ] class-validator configured
  - [ ] Swagger documentation setup
  - [ ] Health check endpoint

Dependencies: T001
Parallel: T002 [P]
```

### T004: Docker Development Environment
```yaml
ID: T004
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Create Docker Compose for local development.
  Include PostgreSQL, Redis, n8n.

Acceptance Criteria:
  - [ ] docker-compose.dev.yml created
  - [ ] PostgreSQL 15 container
  - [ ] Redis 7 container
  - [ ] n8n container configured
  - [ ] Volume mounts for persistence

Dependencies: T001
Parallel: T002, T003 [P]
```

### T005: Database Schema Setup
```yaml
ID: T005
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Create Prisma schema for all entities.
  Run initial migration.

Acceptance Criteria:
  - [ ] User model defined
  - [ ] Project model defined
  - [ ] DataSource model defined
  - [ ] Content model defined
  - [ ] ContentJob model defined
  - [ ] Initial migration successful

Dependencies: T003, T004
Parallel: No
```

### T006: Environment Configuration
```yaml
ID: T006
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 2h

Description: |
  Set up environment variable management.
  Create .env.example templates.

Acceptance Criteria:
  - [ ] .env.example for all services
  - [ ] Environment validation on startup
  - [ ] Secrets management documented

Dependencies: T001
Parallel: T002, T003, T004 [P]
```

### T007: CI Pipeline Setup
```yaml
ID: T007
Phase: Setup
Priority: P1
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Configure GitHub Actions for CI.
  Include lint, type-check, test stages.

Acceptance Criteria:
  - [ ] Lint workflow
  - [ ] Type-check workflow
  - [ ] Unit test workflow
  - [ ] Build verification workflow

Dependencies: T001, T002, T003
Parallel: No
```

### T008: n8n Initial Configuration
```yaml
ID: T008
Phase: Setup
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Configure n8n self-hosted instance.
  Set up queue mode with Redis.

Acceptance Criteria:
  - [ ] n8n running in queue mode
  - [ ] Redis connection established
  - [ ] Webhook URL configured
  - [ ] API key generated
  - [ ] Basic workflow template created

Dependencies: T004
Parallel: No
```

---

## Phase 2: Foundation (Week 3-4)

### T009: Authentication - OAuth Setup
```yaml
ID: T009
Phase: Foundation
Priority: P0
Story: US1 (implicit)
Estimate: 8h

Description: |
  Implement Google OAuth authentication.
  JWT session management.

Acceptance Criteria:
  - [ ] Google OAuth flow implemented
  - [ ] JWT token generation
  - [ ] Refresh token rotation
  - [ ] Auth guards for protected routes
  - [ ] Frontend auth context

Dependencies: T002, T003, T005
Parallel: No
```

### T010: User Service Implementation
```yaml
ID: T010
Phase: Foundation
Priority: P0
Story: US1 (implicit)
Estimate: 4h

Description: |
  Implement user profile management.
  CRUD operations for user data.

Acceptance Criteria:
  - [ ] GET /users/me endpoint
  - [ ] PATCH /users/me endpoint
  - [ ] User profile UI component
  - [ ] Settings page layout

Dependencies: T009
Parallel: T011 [P]
```

### T011: Project Service Implementation
```yaml
ID: T011
Phase: Foundation
Priority: P0
Story: US1
Estimate: 8h

Description: |
  Implement project (channel configuration) service.
  CRUD operations for projects.

Acceptance Criteria:
  - [ ] GET /projects endpoint
  - [ ] POST /projects endpoint
  - [ ] PATCH /projects/:id endpoint
  - [ ] DELETE /projects/:id endpoint
  - [ ] Project list UI component
  - [ ] Project detail UI component

Dependencies: T009
Parallel: T010 [P]
```

### T012: Frontend Layout & Navigation
```yaml
ID: T012
Phase: Foundation
Priority: P0
Story: US8
Estimate: 6h

Description: |
  Create main application layout.
  Sidebar navigation, header, responsive design.

Acceptance Criteria:
  - [ ] Sidebar component with navigation
  - [ ] Header with user menu
  - [ ] Responsive mobile layout
  - [ ] Dark mode support (optional)

Dependencies: T002, T009
Parallel: T010, T011 [P]
```

### T013: Shared Types Package
```yaml
ID: T013
Phase: Foundation
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Create shared TypeScript types.
  API request/response types, enums.

Acceptance Criteria:
  - [ ] NicheType enum
  - [ ] ContentConfig interface
  - [ ] GeneratedContent interface
  - [ ] API response types
  - [ ] Published to workspace

Dependencies: T001
Parallel: T009-T012 [P]
```

### T014: Error Handling Infrastructure
```yaml
ID: T014
Phase: Foundation
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Implement global error handling.
  Consistent error response format.

Acceptance Criteria:
  - [ ] Global exception filter (NestJS)
  - [ ] Error boundary (React)
  - [ ] Toast notification system
  - [ ] Error logging setup

Dependencies: T002, T003
Parallel: T009-T013 [P]
```

### T015: API Client Setup
```yaml
ID: T015
Phase: Foundation
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Set up TanStack Query for API calls.
  Create API client utilities.

Acceptance Criteria:
  - [ ] TanStack Query provider
  - [ ] API client with interceptors
  - [ ] Auth token injection
  - [ ] Error handling in queries

Dependencies: T002, T009
Parallel: T010-T014 [P]
```

### T016: Gemini Service Setup
```yaml
ID: T016
Phase: Foundation
Priority: P0
Story: US3
Estimate: 6h

Description: |
  Create Gemini API integration service.
  Implement script generation logic.

Acceptance Criteria:
  - [ ] Gemini SDK integrated
  - [ ] generateScript function
  - [ ] JSON schema validation
  - [ ] Error handling and retry
  - [ ] Cost tracking

Dependencies: T003
Parallel: T009-T015 [P]
```

### T017: Safety Filter Service
```yaml
ID: T017
Phase: Foundation
Priority: P0
Story: US4
Estimate: 8h

Description: |
  Implement safety filter service.
  Forbidden topics, YMYL detection.

Acceptance Criteria:
  - [ ] Forbidden topic database
  - [ ] Pre-generation safety check
  - [ ] Post-generation validation
  - [ ] Critical claims extraction
  - [ ] Safety report generation

Dependencies: T016
Parallel: No
```

### T018: Webhook Service Setup
```yaml
ID: T018
Phase: Foundation
Priority: P0
Story: N/A (Infrastructure)
Estimate: 4h

Description: |
  Implement webhook endpoints for n8n.
  Status update handlers.

Acceptance Criteria:
  - [ ] POST /webhooks/n8n/script-complete
  - [ ] POST /webhooks/n8n/media-complete
  - [ ] POST /webhooks/n8n/upload-complete
  - [ ] Signature verification
  - [ ] Content status updates

Dependencies: T003, T011
Parallel: T016, T017 [P]
```

### T019: n8n Script Generation Workflow
```yaml
ID: T019
Phase: Foundation
Priority: P0
Story: US3
Estimate: 8h

Description: |
  Create n8n workflow for script generation.
  Gemini integration, safety filter.

Acceptance Criteria:
  - [ ] Webhook trigger configured
  - [ ] Gemini HTTP request node
  - [ ] Safety filter node
  - [ ] Callback webhook node
  - [ ] Error handling branch

Dependencies: T008, T016, T017, T018
Parallel: No
```

### T020: Content Service Foundation
```yaml
ID: T020
Phase: Foundation
Priority: P0
Story: US3, US4
Estimate: 6h

Description: |
  Implement content service basics.
  CRUD operations, status management.

Acceptance Criteria:
  - [ ] GET /contents endpoint
  - [ ] POST /contents/generate endpoint
  - [ ] GET /contents/:id endpoint
  - [ ] Content status state machine
  - [ ] Job tracking

Dependencies: T011, T016, T017
Parallel: T018, T019 [P]
```

---

## Phase 3: Core Features - US1 to US4 (Week 5-8)

### T021: Content Configuration Wizard UI [US1]
```yaml
ID: T021
Phase: US1
Priority: P0
Story: US1
Estimate: 8h

Description: |
  Build step-by-step configuration wizard.
  Vertical, tone, format, language selection.

Acceptance Criteria:
  - [ ] AC1.1: Vertical selection step
  - [ ] AC1.2: Tone selection step
  - [ ] AC1.3: Format selection step
  - [ ] AC1.4: Language selection step
  - [ ] AC1.5: Configuration persistence

Dependencies: T011, T012
Parallel: No
```

### T022: Data Source Management UI [US2]
```yaml
ID: T022
Phase: US2
Priority: P0
Story: US2
Estimate: 6h

Description: |
  Build data source management interface.
  Add, edit, delete data sources.

Acceptance Criteria:
  - [ ] Data source list view
  - [ ] Add data source modal
  - [ ] RSS feed URL validation
  - [ ] Test connection button

Dependencies: T011, T012
Parallel: T021 [P]
```

### T023: Data Source Service [US2]
```yaml
ID: T023
Phase: US2
Priority: P0
Story: US2
Estimate: 6h

Description: |
  Implement data source backend service.
  RSS fetching, validation.

Acceptance Criteria:
  - [ ] AC2.1: PubMed RSS integration
  - [ ] AC2.2: Google News Health integration
  - [ ] AC2.3: Custom RSS support
  - [ ] AC2.4: Source validation
  - [ ] AC2.5: Source attribution storage

Dependencies: T003, T005
Parallel: T021, T022 [P]
```

### T024: n8n Data Collection Workflow [US2]
```yaml
ID: T024
Phase: US2
Priority: P0
Story: US2
Estimate: 6h

Description: |
  Create n8n workflow for data collection.
  Scheduled RSS fetching.

Acceptance Criteria:
  - [ ] Cron trigger (daily 09:00)
  - [ ] RSS parser node
  - [ ] Duplicate filter
  - [ ] Database storage
  - [ ] Error notification

Dependencies: T008, T023
Parallel: No
```

### T025: Script Generation UI [US3]
```yaml
ID: T025
Phase: US3
Priority: P0
Story: US3
Estimate: 8h

Description: |
  Build content generation studio UI.
  Topic input, generation trigger, preview.

Acceptance Criteria:
  - [ ] Topic input field
  - [ ] Source article selector
  - [ ] Generate button
  - [ ] Loading state
  - [ ] Script preview panel

Dependencies: T012, T020
Parallel: T024 [P]
```

### T026: Script Generation Integration [US3]
```yaml
ID: T026
Phase: US3
Priority: P0
Story: US3
Estimate: 6h

Description: |
  Wire up script generation end-to-end.
  Frontend → API → n8n → Callback.

Acceptance Criteria:
  - [ ] AC3.1: Hook generation
  - [ ] AC3.2: Body generation
  - [ ] AC3.3: CTA generation
  - [ ] AC3.4: Senior-friendly vocabulary
  - [ ] AC3.5: Voiceover text
  - [ ] AC3.6: < 30s generation time

Dependencies: T019, T025
Parallel: No
```

### T027: Safety Filter UI [US4]
```yaml
ID: T027
Phase: US4
Priority: P0
Story: US4
Estimate: 6h

Description: |
  Display safety information in UI.
  Critical claims, safety report.

Acceptance Criteria:
  - [ ] Safety score badge
  - [ ] Critical claims list
  - [ ] Source links
  - [ ] Warning indicators
  - [ ] Disclaimer preview

Dependencies: T017, T025
Parallel: T026 [P]
```

### T028: Safety Filter Integration [US4]
```yaml
ID: T028
Phase: US4
Priority: P0
Story: US4
Estimate: 6h

Description: |
  Complete safety filter integration.
  Blocking, warnings, auto-disclaimer.

Acceptance Criteria:
  - [ ] AC4.1: Forbidden topic blocking
  - [ ] AC4.2: Auto-disclaimer insertion
  - [ ] AC4.3: Confidence scores
  - [ ] AC4.4: YMYL enhanced review
  - [ ] AC4.5: Safety report persistence

Dependencies: T017, T026
Parallel: T027 [P]
```

### T029: Content List View [US3, US8]
```yaml
ID: T029
Phase: US3
Priority: P0
Story: US3, US8
Estimate: 6h

Description: |
  Build content list with status filters.
  Draft, review, approved, published.

Acceptance Criteria:
  - [ ] Content table/grid view
  - [ ] Status filter tabs
  - [ ] Search functionality
  - [ ] Pagination
  - [ ] Bulk actions

Dependencies: T020, T012
Parallel: T025-T028 [P]
```

### T030: Content Detail View [US3, US4]
```yaml
ID: T030
Phase: US3
Priority: P0
Story: US3, US4
Estimate: 6h

Description: |
  Build content detail page.
  Full script, safety info, media preview.

Acceptance Criteria:
  - [ ] Script display with sections
  - [ ] Safety report panel
  - [ ] Image prompts display
  - [ ] Action buttons (approve, regenerate)
  - [ ] Status history

Dependencies: T025, T027
Parallel: T029 [P]
```

### T031: Content Approval Flow [US7]
```yaml
ID: T031
Phase: US3
Priority: P0
Story: US7
Estimate: 4h

Description: |
  Implement content approval workflow.
  Approve, reject, regenerate actions.

Acceptance Criteria:
  - [ ] Approve button action
  - [ ] Reject with reason
  - [ ] Regenerate trigger
  - [ ] Status transition validation
  - [ ] Approval timestamp

Dependencies: T020, T030
Parallel: No
```

### T032: Script Edit Capability [US3]
```yaml
ID: T032
Phase: US3
Priority: P1
Story: US3
Estimate: 6h

Description: |
  Allow manual script editing.
  Edit before approval.

Acceptance Criteria:
  - [ ] Inline script editor
  - [ ] Save draft changes
  - [ ] Revert to original
  - [ ] Edit history

Dependencies: T030
Parallel: T031 [P]
```

---

## Phase 4: Media & Publishing - US5 to US8 (Week 9-12)

### T033: TTS Service Integration [US5]
```yaml
ID: T033
Phase: US5
Priority: P1
Story: US5
Estimate: 6h

Description: |
  Integrate ElevenLabs TTS API.
  Voice selection, audio generation.

Acceptance Criteria:
  - [ ] AC5.1: Korean TTS generation
  - [ ] AC5.2: Senior-appropriate voice
  - [ ] AC5.3: Broadcast quality
  - [ ] AC5.4: < 60s generation
  - [ ] OpenAI TTS fallback

Dependencies: T003
Parallel: T034 [P]
```

### T034: Image Generation Service [US6]
```yaml
ID: T034
Phase: US6
Priority: P1
Story: US6
Estimate: 6h

Description: |
  Integrate Gemini Image generation.
  Scene image generation.

Acceptance Criteria:
  - [ ] Gemini Image API integration
  - [ ] Batch image generation
  - [ ] Image storage to S3
  - [ ] Thumbnail generation

Dependencies: T016
Parallel: T033 [P]
```

### T035: n8n Media Production Workflow [US5, US6]
```yaml
ID: T035
Phase: US5
Priority: P1
Story: US5, US6
Estimate: 8h

Description: |
  Create n8n workflow for media production.
  Parallel TTS and image generation.

Acceptance Criteria:
  - [ ] Webhook trigger on approval
  - [ ] Parallel TTS generation
  - [ ] Parallel image generation
  - [ ] Wait for both completion
  - [ ] Trigger video render

Dependencies: T019, T033, T034
Parallel: No
```

### T036: Video Rendering Integration [US6]
```yaml
ID: T036
Phase: US6
Priority: P1
Story: US6
Estimate: 8h

Description: |
  Integrate Creatomate for video rendering.
  Template-based rendering.

Acceptance Criteria:
  - [ ] AC6.1: Shorts format (9:16)
  - [ ] AC6.2: Large subtitles
  - [ ] AC6.3: High-contrast colors
  - [ ] AC6.4: AI/stock images
  - [ ] AC6.5: < 2 min rendering

Dependencies: T035
Parallel: No
```

### T037: n8n Video Render Workflow [US6]
```yaml
ID: T037
Phase: US6
Priority: P1
Story: US6
Estimate: 6h

Description: |
  Extend n8n workflow for video rendering.
  Creatomate API integration.

Acceptance Criteria:
  - [ ] Creatomate template selection
  - [ ] Dynamic content injection
  - [ ] Render status polling
  - [ ] Video upload to S3
  - [ ] Callback on completion

Dependencies: T035, T036
Parallel: No
```

### T038: Audio Preview UI [US5]
```yaml
ID: T038
Phase: US5
Priority: P1
Story: US5
Estimate: 4h

Description: |
  Add audio preview in content detail.
  Play/pause, progress bar.

Acceptance Criteria:
  - [ ] AC5.5: Audio player component
  - [ ] Play/pause controls
  - [ ] Progress indicator
  - [ ] Volume control

Dependencies: T030, T033
Parallel: T036, T037 [P]
```

### T039: Video Preview UI [US6]
```yaml
ID: T039
Phase: US6
Priority: P1
Story: US6
Estimate: 4h

Description: |
  Add video preview in content detail.
  Embedded video player.

Acceptance Criteria:
  - [ ] Video player component
  - [ ] Fullscreen option
  - [ ] Download button
  - [ ] Share options

Dependencies: T030, T037
Parallel: T038 [P]
```

### T040: YouTube OAuth Integration [US7]
```yaml
ID: T040
Phase: US7
Priority: P1
Story: US7
Estimate: 8h

Description: |
  Implement YouTube channel connection.
  OAuth flow, token storage.

Acceptance Criteria:
  - [ ] AC7.1: YouTube OAuth flow
  - [ ] Channel selection
  - [ ] Token refresh handling
  - [ ] Connection status UI
  - [ ] Disconnect option

Dependencies: T009, T011
Parallel: T033-T039 [P]
```

### T041: YouTube Upload Service [US7]
```yaml
ID: T041
Phase: US7
Priority: P1
Story: US7
Estimate: 8h

Description: |
  Implement YouTube upload functionality.
  Video upload, metadata setting.

Acceptance Criteria:
  - [ ] AC7.2: Upload as Private
  - [ ] AC7.3: Auto-generated metadata
  - [ ] Title optimization
  - [ ] Description with disclaimer
  - [ ] Tags from content

Dependencies: T040
Parallel: No
```

### T042: n8n Publication Workflow [US7]
```yaml
ID: T042
Phase: US7
Priority: P1
Story: US7
Estimate: 6h

Description: |
  Create n8n workflow for YouTube upload.
  Approval trigger, upload, callback.

Acceptance Criteria:
  - [ ] Approval webhook trigger
  - [ ] YouTube API integration
  - [ ] Upload status tracking
  - [ ] Public/Private toggle
  - [ ] Callback on completion

Dependencies: T037, T041
Parallel: No
```

### T043: Publication UI [US7]
```yaml
ID: T043
Phase: US7
Priority: P1
Story: US7
Estimate: 6h

Description: |
  Build publication interface.
  Approve, schedule, publish actions.

Acceptance Criteria:
  - [ ] AC7.4: Approval confirmation
  - [ ] AC7.5: Schedule picker
  - [ ] Publish now option
  - [ ] YouTube status display
  - [ ] Link to YouTube video

Dependencies: T030, T042
Parallel: No
```

### T044: Dashboard Overview [US8]
```yaml
ID: T044
Phase: US8
Priority: P1
Story: US8
Estimate: 8h

Description: |
  Build main dashboard with stats.
  Generation counts, status overview.

Acceptance Criteria:
  - [ ] AC8.1: Daily generation count
  - [ ] AC8.2: Pending approvals count
  - [ ] AC8.3: Upload status summary
  - [ ] Recent activity feed
  - [ ] Quick action buttons

Dependencies: T012, T020
Parallel: T038-T043 [P]
```

---

## Dependency Graph

```
Setup Phase:
T001 ──┬── T002 ──┐
       ├── T003 ──┼── T005 ── T009 ──┬── T010
       ├── T004 ──┤                  ├── T011
       └── T006   └── T008           └── T012

Foundation Phase:
T009 ──┬── T010 ──┐
       ├── T011 ──┼── T021 (US1)
       ├── T012 ──┤
       ├── T015   │
       └── T016 ──┼── T017 ── T019 ── T026 (US3)
                  └── T020

US Features:
T021 ── T022 ── T023 ── T024 (US2)
     └── T025 ── T026 ── T027 ── T028 (US3, US4)
              └── T029 ── T030 ── T031 ── T032

Media & Publish:
T033 ──┬── T035 ── T036 ── T037 ── T039
T034 ──┘                         │
T040 ── T041 ── T042 ── T043 ────┘
T044 (Dashboard)
```

---

## Parallel Execution Opportunities

| Task Group | Tasks | Notes |
|------------|-------|-------|
| Setup | T002, T003, T004, T006 | Can run in parallel after T001 |
| Foundation | T010, T011, T012, T015 | After auth setup |
| US1-US2 | T021, T022, T023 | UI and backend in parallel |
| Media | T033, T034 | TTS and Image generation |
| Publish | T038, T039 | Audio and video preview |

---

## Checkpoint Summary

| Checkpoint | Tasks | Deliverable |
|------------|-------|-------------|
| Week 2 | T001-T008 | Dev environment ready |
| Week 4 | T009-T020 | Auth, API, n8n foundation |
| Week 6 | T021-T028 | Content generation working |
| Week 8 | T029-T032 | Full content management |
| Week 10 | T033-T039 | Media production pipeline |
| Week 12 | T040-T044 | YouTube integration, Dashboard |

---

**Tasks Version**: 1.0
**Last Updated**: 2025-12-24
**Author**: Engineering Team
