# N2 日文學習系統

JLPT N2 対策のための総合学習 PWA（local-first · 日文 UI · 無 AI）。

## 機能

- **初回診断** — 45 分プラスメントで弱点分析（未完了時は自動誘導）
- **26 週カリキュラム** — ダッシュボードから今日のタスクを自動生成
- **弱点ヒートマップ** — 間違えた問題を可視化し復習へ誘導
- **SRS 復習** — FSRS（単語・漢字、認識 / 想起 / 穴埋め / 聴解）
- **文法** — 200 ポイント + 週次フィルタ + 類似文法練習
- **読解** — 計時モード・タップ辞書
- **聴解** — 試験 / 練習モード（120 問・音源 120 / 核心 60）
- **混合復習** — SRS + 錯題キューを交互に
- **模擬試験** — JLPT N2 形式 + 合格予測
- **インポート** — CSV / Anki (.apkg) → SRS 追加
- **クラウド同期** — NextAuth + PostgreSQL（任意）/ メモリ fallback
- **PWA** — Service Worker + オフライン音源パック

## セットアップ

```bash
npm install
npm run content:generate   # コンテンツ JSON・分片・音源を生成
npm run dev
```

ブラウザで http://localhost:3000 を開く（ポートが使用中の場合は 3001 など）。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | プロダクションビルド |
| `npm run test` | Vitest ユニットテスト |
| `npm run test:e2e` | Playwright E2E |
| `npm run content:generate` | 全コンテンツパイプライン（seed + 音源 120） |
| `npm run content:shard` | `public/content/` 分片のみ再生成 |
| `npm run content:check-audio` | 聴解 MP3 数チェック（既定 120） |
| `npm run content:check-quality` | 語彙日文釋義品質チェック（≥40%） |
| `npm run content:check-bundle` | JS バンドル予算チェック |
| `npm run db:push` | Drizzle → PostgreSQL（任意） |

## デプロイ

[DEPLOY.md](./DEPLOY.md) を参照。パフォーマンス詳細は [docs/PERF.md](./docs/PERF.md)。

## 技術スタック

Next.js 16 · TypeScript · Tailwind CSS v4 · Dexie (IndexedDB v4) · ts-fsrs · NextAuth · Drizzle（任意）

## リポジトリ

https://github.com/q5060/jlpt-n2-learning
