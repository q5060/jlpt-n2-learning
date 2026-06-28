# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL (optional, for cloud sync)

## Environment variables

Copy `.env.example` to `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/n2study
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-random-secret
```

## Build pipeline

```bash
npm install
npm run content:generate   # vocab + content + shards + audio (120) + icons
npm run build
npm run test
npm run test:e2e
npm run content:check-quality
npm run content:check-audio   # expects 120 files
npm run content:check-bundle
```

## Content sharding

After `content:generate`, static shards live in `public/content/`. The app loads them via `lib/content/cache.ts` with IndexedDB persistence.

Re-shard only:

```bash
npm run content:shard
```

## PostgreSQL migrations

```bash
npx drizzle-kit push
# Extended tables (manual if needed):
psql $DATABASE_URL -f drizzle/0001_sync_extended.sql
psql $DATABASE_URL -f drizzle/0002_weakness_sessions.sql
```

## Hosting (Vercel)

1. Connect repository; CI runs on push to `main`
2. Set environment variables in project settings
3. Build command: `npm run content:generate && npm run build`
4. `public/content/` and `public/icons/` must be present in deployment artifact

## PWA

- Icons: `public/icons/icon-192.png`, `icon-512.png` (from `scripts/generate-icons.ts`)
- Service worker: `public/sw.js`
- Audio packs downloaded client-side via Settings
