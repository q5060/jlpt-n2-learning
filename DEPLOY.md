# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL (optional, for cloud sync)
- macOS `say` + `afconvert` (optional, for listening audio generation)

## Environment variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/n2study
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-random-secret
```

## Build pipeline

```bash
npm install
npm run content:generate   # vocab + kanji + grammar + shards + audio
npm run build
npm run test
npm run test:e2e
npx tsx scripts/check-bundle-budget.ts
npm run content:check-audio  # expects 60 files by default
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
# or apply SQL manually:
psql $DATABASE_URL -f drizzle/0001_sync_extended.sql
```

## Hosting (Vercel)

1. Set env vars in project settings
2. Build command: `npm run content:generate && npm run build`
3. Ensure `public/content/**` and `public/audio/**` are deployed as static assets

## PWA

Service worker: `public/sw.js` (shell cache + content stale-while-revalidate)

Icons: `public/icons/icon-192.png`, `icon-512.png`

## Performance

See [docs/PERF.md](docs/PERF.md)
