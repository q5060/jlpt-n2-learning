import Papa from "papaparse";
import { db } from "@/lib/db/local/schema";
import type { VocabEntry } from "@/lib/types";

export interface CsvRow {
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  tags?: string;
}

export async function importCsvVocab(
  file: File,
  sourceName: string
): Promise<number> {
  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

  let count = 0;
  for (const row of parsed.data) {
    if (!row.word || !row.reading || !row.meaning) continue;
    const id = `import-${sourceName}-${row.word}`;
    await db.customVocab.put({
      id,
      word: row.word,
      reading: row.reading,
      meaning: row.meaning,
      example: row.example,
      tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : ["imported"],
      source: sourceName,
    });
    count++;
  }

  await db.imports.put({
    id: `csv-${Date.now()}`,
    name: sourceName,
    type: "csv",
    itemCount: count,
    importedAt: Date.now(),
  });

  return count;
}

export async function getImportedVocab(): Promise<VocabEntry[]> {
  const records = await db.customVocab.toArray();
  return records.map((r) => ({
    id: r.id,
    word: r.word,
    reading: r.reading,
    meaning: r.meaning,
    example: r.example ?? "",
    tags: r.tags,
    jlptLevel: "N2" as const,
  }));
}

export async function parseAnkiApkg(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const SQL = await import("sql.js");
  const initSqlJs = SQL.default;
  const sql = await initSqlJs({
    locateFile: (file: string) =>
      `https://sql.js.org/dist/${file}`,
  });

  const zipData = new Uint8Array(buffer);
  const { unzipSync } = await import("fflate");
  const files = unzipSync(zipData);
  const collectionFile = files["collection.anki21"] ?? files["collection.anki2"];
  if (!collectionFile) throw new Error("無効なAnkiファイルです");

  const dbAnki = new sql.Database(collectionFile);
  const notes = dbAnki.exec("SELECT flds FROM notes");
  let count = 0;

  if (notes.length > 0) {
    for (const row of notes[0].values) {
      const fields = String(row[0]).split("\x1f");
      if (fields.length >= 2) {
        const word = fields[0].replace(/<[^>]*>/g, "").trim();
        const meaning = fields[1].replace(/<[^>]*>/g, "").trim();
        if (word && meaning) {
          await db.customVocab.put({
            id: `anki-${Date.now()}-${count}`,
            word,
            reading: fields[2]?.replace(/<[^>]*>/g, "").trim() || word,
            meaning,
            example: fields[3]?.replace(/<[^>]*>/g, "").trim(),
            tags: ["anki-import"],
            source: file.name,
          });
          count++;
        }
      }
    }
  }

  dbAnki.close();

  await db.imports.put({
    id: `anki-${Date.now()}`,
    name: file.name,
    type: "anki",
    itemCount: count,
    importedAt: Date.now(),
  });

  return count;
}

export function validateCsvTemplate(csv: string): boolean {
  const parsed = Papa.parse(csv, { header: true });
  const fields = parsed.meta.fields ?? [];
  return ["word", "reading", "meaning"].every((f) => fields.includes(f));
}
