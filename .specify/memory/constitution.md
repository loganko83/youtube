# TubeGenius AI Constitution

## Core Principles

### I. Cost Optimization First
Every feature must consider cost implications. Free or low-cost alternatives (like Edge TTS vs ElevenLabs) are preferred. All API calls must be monitored and optimized.

### II. Automation-Driven
The platform automates content creation end-to-end. Manual intervention should be minimal. Scheduled tasks and trend-based generation are core features.

### III. Quality & Safety
Generated content must pass safety filtering. Critical claims require fact-checking. Senior-friendly accessibility is mandatory for all video content.

### IV. Modular Architecture
NestJS modules are self-contained with clear boundaries. Each module (contents, trends, scheduler, youtube) can be developed and tested independently.

### V. Type Safety
Strict TypeScript with no `any` types in production code. Prisma for type-safe database access. Zod schemas for runtime validation.

### VI. Test Coverage
Unit tests for business logic. Integration tests for API endpoints. E2E tests for critical user flows.

## Technology Stack

### Backend (NestJS)
- **Runtime**: Node.js 20+
- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Bull for job processing
- **Scheduler**: @nestjs/schedule for cron jobs

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **State**: TanStack Query (server), Zustand (client)
- **UI**: Custom components with Tailwind CSS
- **Icons**: Lucide React

### External Services
- **AI**: Google Gemini for script generation
- **TTS**: Edge TTS (free, primary), ElevenLabs (fallback)
- **Video**: Creatomate for rendering
- **Platform**: YouTube Data API v3

## Development Workflow

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code restructuring
- `docs:` Documentation
- `test:` Testing changes

### Quality Gates
1. TypeScript compilation passes
2. ESLint/Prettier formatting
3. Unit tests pass
4. Build succeeds

## Governance

This constitution guides all development decisions. Any deviation requires explicit justification and documentation.

**Version**: 1.0.0 | **Ratified**: 2024-12-25 | **Last Amended**: 2024-12-25
