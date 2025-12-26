# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TubeGenius AI** - AI-powered automated video content generation platform for YouTube Shorts and long-form videos. Uses Google Gemini for script generation, Edge TTS/ElevenLabs for voiceover, Creatomate for video rendering, and supports automated publishing via cron scheduling.

## Development Commands

```bash
# Install all dependencies (from root)
npm install

# Development
npm run dev           # Run all apps in parallel
npm run dev:web       # Run web app only (Next.js on port 3000)
npm run dev:api       # Run API only (NestJS on port 3001)

# Build
npm run build         # Build all packages and apps
npm run lint          # Lint all packages
npm run test          # Run tests in all packages
npm run clean         # Clean all build artifacts and node_modules

# Database (Prisma)
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio GUI

# Single package commands
cd apps/api && npm test              # Test API only
cd apps/api && npm run test:watch    # Watch mode for tests
```

## Architecture

### Monorepo Structure (Turborepo)

```
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   └── api/          # NestJS backend
├── packages/
│   ├── shared/       # Shared types, schemas, constants
│   ├── ui/           # React component library (shadcn-based)
│   └── config/       # Shared TypeScript/ESLint configs
```

### Web App (`@tubegenius/web`)

Next.js 14 with App Router. Key files:
- `src/lib/api.ts` - API client with typed endpoints
- `src/lib/hooks.ts` - React Query hooks for data fetching
- `src/lib/store.ts` - Zustand stores

State management pattern:
- **Server state**: TanStack Query (`useQuery`, `useMutation`)
- **Client state**: Zustand with persist middleware

### API (`@tubegenius/api`)

NestJS modular architecture:

```
src/modules/
├── auth/           # JWT authentication
├── projects/       # Project CRUD with YouTube OAuth
├── contents/       # Content generation pipeline
│   ├── tts.service.ts         # TTS provider orchestration
│   ├── edge-tts.service.ts    # Edge TTS (FREE)
│   └── elevenlabs-tts.service.ts
├── trends/         # Google Trends, Naver DataLab, RSS feeds
├── scheduler/      # Cron-based automation (@nestjs/schedule)
├── analytics/      # Cost tracking, success rates
├── data-sources/   # External data source management
├── youtube/        # YouTube Data API integration
└── webhooks/       # n8n webhook handlers
```

### Database (Prisma + PostgreSQL)

Schema at `apps/api/prisma/schema.prisma`. Core models:
- `User` → `Project` → `Content` (one-to-many chain)
- `ProjectAutomation` - scheduling and trend settings per project
- `DataSource` - RSS/API/Trends sources per project

Content status flow:
```
PENDING → SCRIPT_GENERATING → TTS_PROCESSING → VIDEO_RENDERING → UPLOADING → SCHEDULED/COMPLETED/FAILED
```

## Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001

# apps/api/.env.local
DATABASE_URL=postgresql://...
JWT_SECRET=...
GEMINI_API_KEY=...              # Google Gemini for script generation
TTS_PROVIDER=edge               # edge (free) or elevenlabs
ELEVENLABS_API_KEY=...          # Only if using ElevenLabs
CREATOMATE_API_KEY=...          # Video rendering
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
NAVER_CLIENT_ID=...             # For Naver DataLab trends
NAVER_CLIENT_SECRET=...
```

## Type Safety Notes

- Strict TypeScript: Array access like `arr[0]` needs fallback values or `as const` assertions
- Use `??` (nullish coalescing) rather than `||` for type safety
- When accessing `Record<string, T>` with dynamic keys, provide explicit fallback objects
- Unused imports/parameters cause build failures - prefix with `_` or remove them

## Key Implementation Patterns

### TTS Provider Pattern
The TTS service uses strategy pattern with automatic fallback:
- Primary: Edge TTS (free, set via `TTS_PROVIDER=edge`)
- Fallback: ElevenLabs (if primary fails)
- Each provider implements `ITTSProvider` interface

### Content Generation Flow
1. User creates project with niche selection
2. Content job created with PENDING status
3. Pipeline: Gemini script → TTS audio → Creatomate video → YouTube upload
4. Content metadata tracks TTS provider, costs, and render details

### Shared Package Enum Mapping
The shared package uses display-friendly enum values (e.g., `'Finance & Investing'`) while the Prisma schema uses enum keys (e.g., `FINANCE`). The web app often uses lowercase slugs (e.g., `'finance'`) for UI routing.
