# Performance Baseline

## Content delivery (Wave 4)

- Vocab/kanji/grammar served from `/public/content/*/shard-*.json`
- IndexedDB cache: `contentShards` table (Dexie v4)
- Grammar list uses `/content/grammar/meta.json` (~15KB) instead of full 461KB JSON

## Targets

| Metric | Target |
|--------|--------|
| Grammar list first fetch | < 20KB |
| Vocab first screen | 1 shard (~100 words) |
| Dict lookup | Single bucket shard, not full 380KB |
| Largest JS chunk (gzip) | < 250KB |

## Commands

```bash
npm run content:shard
npm run build
npx tsx scripts/check-bundle-budget.ts
npm run test
```

## Manual Lighthouse (recommended)

1. `npm run build && npm run start`
2. Test `/dashboard`, `/vocab`, `/grammar`, `/reading`
3. Record LCP and TTI

## Architecture

```
Page → lib/content/cache.ts → fetch /content/{type}/shard-NN.json
                            → IndexedDB contentShards (persistent)
                            → memory LRU (6 shards)
```

Fallback: bundled `@/content/*.json` when shards unavailable (dev without `content:shard`).
