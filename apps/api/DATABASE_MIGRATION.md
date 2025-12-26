# Database Migration Guide - Video Rendering Support

## Overview

This guide covers the database schema updates required to support video rendering functionality in TubeGenius AI.

## Schema Changes

### Content Model Updates

Add the following fields to the `Content` model in `prisma/schema.prisma`:

```prisma
model Content {
  id                String            @id @default(cuid())
  projectId         String
  status            String            // pending, script_generating, tts_processing, video_rendering, uploading, completed, failed
  config            Json

  // Generated content
  title             String?
  script            String?           @db.Text
  voiceoverText     String?           @db.Text
  imagePrompts      Json?
  scenePreviews     Json?
  criticalClaims    Json?
  metadata          Json?
  safetyReport      Json?

  // NEW: Audio & Video fields
  audioUrl          String?           // TTS audio URL
  videoUrl          String?           // Rendered video URL
  renderId          String?           // Creatomate render job ID
  renderingCost     Float?            // Cost in USD

  // YouTube publishing
  youtubeVideoId    String?

  // Metadata
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  error             String?           @db.Text

  // Relations
  project           Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([status])
  @@index([createdAt])
}
```

## Migration Steps

### Step 1: Update Schema File

Edit `apps/api/prisma/schema.prisma` and add the new fields to the `Content` model:

```prisma
model Content {
  // ... existing fields ...

  // Add these new fields:
  audioUrl          String?
  videoUrl          String?
  renderId          String?
  renderingCost     Float?

  // ... rest of the model ...
}
```

### Step 2: Generate Migration

Run the Prisma migration command:

```bash
cd apps/api
npx prisma migrate dev --name add_video_rendering_fields
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your development database
3. Regenerate the Prisma Client

### Step 3: Verify Migration

Check the generated migration SQL:

```bash
# View the migration file
cat prisma/migrations/[timestamp]_add_video_rendering_fields/migration.sql
```

Expected SQL:

```sql
-- AlterTable
ALTER TABLE "Content" ADD COLUMN "audioUrl" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "renderId" TEXT,
ADD COLUMN "renderingCost" DOUBLE PRECISION;
```

### Step 4: Update Prisma Client

Regenerate the Prisma Client to include the new fields:

```bash
npx prisma generate
```

### Step 5: Production Deployment

For production deployment:

```bash
# Apply migrations without prompts
npx prisma migrate deploy

# Or use the db:push script
npm run db:push
```

## Rollback Plan

If you need to rollback the migration:

### Option 1: Revert Migration (Development)

```bash
# Reset database to previous state
npx prisma migrate reset

# Then re-apply only previous migrations
npx prisma migrate deploy
```

### Option 2: Manual Rollback (Production)

```sql
-- Remove the added columns
ALTER TABLE "Content"
  DROP COLUMN "audioUrl",
  DROP COLUMN "videoUrl",
  DROP COLUMN "renderId",
  DROP COLUMN "renderingCost";
```

## Data Migration (Optional)

If you have existing content records that need migration:

### Backfill Script

Create `apps/api/scripts/backfill-video-fields.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillVideoFields() {
  console.log('Starting backfill...');

  // Find all completed content without video URLs
  const contents = await prisma.content.findMany({
    where: {
      status: 'completed',
      videoUrl: null,
    },
  });

  console.log(`Found ${contents.length} records to backfill`);

  for (const content of contents) {
    // Set default values or skip
    await prisma.content.update({
      where: { id: content.id },
      data: {
        renderingCost: 0, // Default value
        // Keep audioUrl and videoUrl as null
      },
    });
  }

  console.log('Backfill completed');
}

backfillVideoFields()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the script:

```bash
npx ts-node scripts/backfill-video-fields.ts
```

## Testing the Migration

### Verify Schema

```typescript
// Test in TypeScript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchema() {
  // Create content with new fields
  const content = await prisma.content.create({
    data: {
      projectId: 'test-project-id',
      status: 'pending',
      config: { format: 'Shorts', niche: 'Senior Health' },
      audioUrl: 'https://example.com/audio.mp3',
      videoUrl: 'https://example.com/video.mp4',
      renderId: 'render_123',
      renderingCost: 0.05,
    },
  });

  console.log('Content created:', content);

  // Verify fields exist
  console.log('Audio URL:', content.audioUrl);
  console.log('Video URL:', content.videoUrl);
  console.log('Render ID:', content.renderId);
  console.log('Rendering Cost:', content.renderingCost);
}

testSchema();
```

### Query Examples

```typescript
// Find all content with rendered videos
const renderedContent = await prisma.content.findMany({
  where: {
    videoUrl: { not: null },
  },
  select: {
    id: true,
    title: true,
    videoUrl: true,
    renderingCost: true,
  },
});

// Calculate total rendering costs
const totalCost = await prisma.content.aggregate({
  _sum: {
    renderingCost: true,
  },
  where: {
    status: 'completed',
  },
});

console.log(`Total rendering cost: $${totalCost._sum.renderingCost}`);

// Find failed renders
const failedRenders = await prisma.content.findMany({
  where: {
    status: 'failed',
    renderId: { not: null },
  },
});
```

## Environment Variables

Update your `.env` files:

### Development (`.env.local`)

```bash
# Existing variables...

# Video Rendering (Creatomate)
CREATOMATE_API_KEY=your_dev_api_key_here
```

### Production (`.env.production`)

```bash
# Existing variables...

# Video Rendering (Creatomate)
CREATOMATE_API_KEY=your_prod_api_key_here
```

## Monitoring

After deployment, monitor the new fields:

```sql
-- Check field usage
SELECT
  COUNT(*) as total,
  COUNT(audioUrl) as with_audio,
  COUNT(videoUrl) as with_video,
  COUNT(renderId) as with_render_id,
  AVG(renderingCost) as avg_cost
FROM "Content"
WHERE status = 'completed';

-- Find orphaned renders (renderId but no videoUrl)
SELECT id, renderId, status, error
FROM "Content"
WHERE renderId IS NOT NULL
  AND videoUrl IS NULL
  AND status != 'video_rendering';
```

## Troubleshooting

### Issue: Migration Fails with Foreign Key Error

**Solution**: Ensure the `Project` table exists and has the correct schema before running the migration.

### Issue: Existing Records Cause Constraint Violations

**Solution**: New fields are nullable, so this shouldn't happen. If it does, check for database-level constraints.

### Issue: Prisma Client Not Updated

**Solution**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Regenerate client
npx prisma generate
```

## Cost Analysis Queries

After deployment, you can analyze rendering costs:

```sql
-- Daily rendering costs
SELECT
  DATE(createdAt) as date,
  COUNT(*) as videos_rendered,
  SUM(renderingCost) as total_cost,
  AVG(renderingCost) as avg_cost_per_video
FROM "Content"
WHERE videoUrl IS NOT NULL
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Cost by niche
SELECT
  config->>'niche' as niche,
  COUNT(*) as videos,
  SUM(renderingCost) as total_cost,
  AVG(renderingCost) as avg_cost
FROM "Content"
WHERE videoUrl IS NOT NULL
GROUP BY config->>'niche';

-- Cost by format
SELECT
  config->>'format' as format,
  COUNT(*) as videos,
  SUM(renderingCost) as total_cost,
  AVG(renderingCost) as avg_cost
FROM "Content"
WHERE videoUrl IS NOT NULL
GROUP BY config->>'format';
```

## Next Steps

1. ✅ Apply migration to development database
2. ✅ Test VideoService with new schema
3. ✅ Update API controllers to use new fields
4. ✅ Add cost tracking to dashboard
5. ✅ Deploy to staging environment
6. ✅ Run backfill script if needed
7. ✅ Deploy to production

## Support

For migration issues:
- Check Prisma logs: `npx prisma studio`
- Review migration history: `npx prisma migrate status`
- Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
