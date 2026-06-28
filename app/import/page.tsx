"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { ErrorState } from "@/components/ui/error-state";
import { importCsvVocab, parseAnkiApkg } from "@/lib/import/parsers";
import {
  addImportedToSrs,
  getImportedNotInSrsCount,
} from "@/lib/import/merge";
import { db, type ImportRecord } from "@/lib/db/local/schema";

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [pendingSrs, setPendingSrs] = useState(0);
  const [adding, setAdding] = useState(false);

  async function loadImports() {
    setImports(await db.imports.toArray());
    setPendingSrs(await getImportedNotInSrsCount());
  }

  useEffect(() => {
    loadImports();
  }, []);

  async function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importCsvVocab(file, file.name);
      setMessage(`${count}語をインポートしました`);
      setMessageIsError(false);
      await loadImports();
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : "不明"}`);
      setMessageIsError(true);
    }
  }

  async function handleAnki(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await parseAnkiApkg(file);
      setMessage(`${count}枚のカードをインポートしました`);
      setMessageIsError(false);
      await loadImports();
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : "不明"}`);
      setMessageIsError(true);
    }
  }

  async function handleAddToSrs() {
    setAdding(true);
    try {
      const count = await addImportedToSrs();
      setMessage(`${count}語をSRSに追加しました`);
      setMessageIsError(false);
      await loadImports();
    } catch (err) {
      setMessage(`エラー: ${err instanceof Error ? err.message : "不明"}`);
      setMessageIsError(true);
    } finally {
      setAdding(false);
    }
  }

  return (
    <MainLayout>
      <PageHeader title="教材インポート" description="CSV または Anki デッキを取り込み" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">CSV インポート</CardTitle>
          <p className="mb-4 text-sm text-zinc-500">
            形式: word,reading,meaning,example,tags
          </p>
          <FilePicker accept=".csv" label="CSVファイルを選択" hint="word,reading,meaning,example,tags" onChange={handleCsv} />
        </Card>

        <Card>
          <CardTitle className="mb-4">Anki (.apkg)</CardTitle>
          <p className="mb-4 text-sm text-zinc-500">
            Ankiデッキを単語カードに変換します
          </p>
          <FilePicker accept=".apkg" label="Ankiデッキを選択" hint=".apkg形式" onChange={handleAnki} />
        </Card>
      </div>

      {message && (
        messageIsError ? (
          <ErrorState title="インポートエラー" description={message} className="mt-4 py-8" />
        ) : (
          <Card variant="success" className="mt-4">
            <p>{message}</p>
          </Card>
        )
      )}

      {pendingSrs > 0 && (
        <Card className="mt-4">
          <p className="mb-3 text-sm">
            インポート済みで未登録の語彙: <strong>{pendingSrs}</strong>語
          </p>
          <Button onClick={handleAddToSrs} disabled={adding}>
            {adding ? "追加中..." : `SRSに追加 (${pendingSrs}語)`}
          </Button>
        </Card>
      )}

      <Card className="mt-6">
        <CardTitle className="mb-4">インポート履歴</CardTitle>
        <Button variant="outline" size="sm" onClick={loadImports} className="mb-3">
          更新
        </Button>
        {imports.length === 0 ? (
          <EmptyState title="まだインポートがありません" description="CSV または Anki ファイルをアップロードしてください。" />
        ) : (
          <ul className="space-y-2 text-sm">
            {imports.map((imp) => (
              <li key={imp.id}>
                {imp.name} · {imp.type} · {imp.itemCount}件 ·{" "}
                {new Date(imp.importedAt).toLocaleDateString("ja-JP")}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </MainLayout>
  );
}
