# N2 日文學習系統

JLPT N2 対策のための総合学習 PWA。

## 機能

- **初回診断** — 45分のプラスメントテストで弱点を分析
- **26週カリキュラム** — N3→N2 の6ヶ月学習計画
- **SRS復習** — FSRS アルゴリズムによる単語・漢字の間隔反復
- **文法** — 200ポイント + 4種類の練習問題
- **読解** — 計時モード付き長文読解（60篇）
- **聴解** — 試験/練習モードの聴解問題（120問）
- **模擬試験** — JLPT N2 形式の模擬試験 + 合格予測
- **インポート** — CSV / Anki (.apkg) 対応
- **クラウド同期** — オプションのログイン同期
- **オフライン** — PWA + Service Worker

## セットアップ

```bash
npm install
npx tsx scripts/generate-content.ts
npm run dev
```

## スクリプト

- `npm run dev` — 開発サーバー
- `npm run build` — プロダクションビルド
- `npm run test` — Vitest ユニットテスト
- `npm run test:e2e` — Playwright E2E テスト
- `npm run content:generate` — コンテンツ JSON 再生成

## 技術スタック

Next.js 16 · TypeScript · Tailwind CSS · Dexie (IndexedDB) · ts-fsrs · NextAuth
