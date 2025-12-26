# Feature Specification: Real-time UX & Notifications

**Feature ID**: 003-ux-realtime
**Created**: 2024-12-25
**Priority**: P1 (High)
**Status**: In Progress

## Overview

Enhance user experience with real-time content generation progress updates and a notification system for pipeline events.

## User Stories

### US-1: Real-time Progress Display
**As a** content creator
**I want to** see real-time progress of my content generation
**So that** I know exactly what stage my content is in

**Acceptance Criteria**:
- Progress indicator shows current stage with animation
- All 5 stages displayed: Script → TTS → Video → Upload → Complete
- Status updates automatically without page refresh
- Estimated time remaining for each stage
- Visual feedback for errors with retry option

### US-2: Toast Notifications
**As a** user
**I want to** receive notifications when content generation completes or fails
**So that** I can take action without constantly checking the page

**Acceptance Criteria**:
- Toast appears when content completes
- Toast appears when content fails with error message
- Toast auto-dismisses after 5 seconds
- User can manually dismiss notifications
- Notification includes link to content detail page

### US-3: Processing Queue Visibility
**As a** user with multiple contents generating
**I want to** see a queue of all processing contents
**So that** I can monitor all my active generation jobs

**Acceptance Criteria**:
- Floating indicator shows count of processing contents
- Click reveals mini-list of processing contents
- Each item shows title, status, and progress
- Quick link to content detail page

## Technical Requirements

### Frontend Components
1. `Toast` - Notification toast component
2. `ToastContainer` - Container for multiple toasts
3. `ProcessingQueue` - Floating queue indicator
4. `ProgressStepper` - Enhanced progress display

### State Management
- Use existing `useNotificationStore` from `lib/store.ts`
- Add polling hooks for real-time updates

### API Requirements
- No new APIs required
- Use existing `/contents/:id` with refetchInterval

## Dependencies
- Zustand notification store (exists)
- React Query polling (exists)
- Content status enum updates (completed in Phase 5)
