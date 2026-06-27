"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { getSettings, saveSettings } from "@/lib/db/local/schema";
import { exportLocalData, importRemoteData, getLastSyncTime } from "@/lib/db/sync";
import { AudioPackDownloader } from "@/components/settings/audio-pack-downloader";
import type { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState("");

  useEffect(() => {
    getSettings().then(setSettings);
    getLastSyncTime().then(setLastSync);
  }, []);

  async function updateSettings(partial: Partial<UserSettings>) {
    if (!settings) return;
    const next = { ...settings, ...partial };
    await saveSettings(next);
    setSettings(next);
  }

  async function syncToCloud() {
    if (!session) {
      setSyncStatus("ログインが必要です");
      return;
    }
    try {
      const data = await exportLocalData();
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("同期失敗");
      setSyncStatus("同期完了");
      setLastSync(Date.now());
    } catch {
      setSyncStatus("同期に失敗しました");
    }
  }

  async function syncFromCloud() {
    if (!session) {
      setSyncStatus("ログインが必要です");
      return;
    }
    try {
      const res = await fetch("/api/sync");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      await importRemoteData(data);
      setSyncStatus("復元完了");
      setLastSync(Date.now());
    } catch {
      setSyncStatus("復元に失敗しました");
    }
  }

  if (!settings) {
    return (
      <MainLayout>
        <PageHeader title="設定" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="設定" description="学習目標と同期の管理" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">学習設定</CardTitle>
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">1日の学習目標（分）</span>
              <Input
                type="number"
                className="mt-1"
                value={settings.dailyGoalMinutes}
                onChange={(e) =>
                  updateSettings({ dailyGoalMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">新規カード/日</span>
              <Input
                type="number"
                className="mt-1"
                value={settings.newCardsPerDay}
                onChange={(e) =>
                  updateSettings({ newCardsPerDay: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">復習上限/日</span>
              <Input
                type="number"
                className="mt-1"
                value={settings.reviewCardsPerDay}
                onChange={(e) =>
                  updateSettings({ reviewCardsPerDay: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">クラウド同期</CardTitle>
          {session ? (
            <div className="space-y-3">
              <p className="text-sm">ログイン中: {session.user?.email}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={syncToCloud}>アップロード</Button>
                <Button variant="outline" onClick={syncFromCloud}>
                  ダウンロード
                </Button>
                <Button variant="ghost" onClick={() => signOut()}>
                  ログアウト
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => signIn()}>ログイン</Button>
          )}
          {lastSync && (
            <p className="mt-2 text-xs text-zinc-500">
              最終同期: {new Date(lastSync).toLocaleString("ja-JP")}
            </p>
          )}
          {syncStatus && <p className="mt-2 text-sm">{syncStatus}</p>}
        </Card>

        <Card>
          <CardTitle className="mb-4">オフライン</CardTitle>
          <p className="mb-3 text-sm text-zinc-500">
            聴解音源パックをダウンロードしてオフラインで聴解練習ができます。
          </p>
          <AudioPackDownloader onDone={() => updateSettings({ audioPackDownloaded: true })} />
          {settings.audioPackDownloaded && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">ダウンロード済み</p>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">診断テスト</CardTitle>
          <p className="mb-3 text-sm text-zinc-500">
            初回診断をやり直す場合はリセットできます。
          </p>
          <Button
            variant="outline"
            onClick={() => updateSettings({ placementCompleted: false })}
          >
            診断をリセット
          </Button>
        </Card>
      </div>
    </MainLayout>
  );
}
