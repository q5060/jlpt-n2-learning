import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("content shards", () => {
  it("meta.json exists with vocab shards", () => {
    const metaPath = join(process.cwd(), "public/content/meta.json");
    expect(existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
    expect(meta.types.vocab.total).toBeGreaterThan(1000);
    expect(meta.types.vocab.shards.length).toBeGreaterThan(5);
    expect(meta.types.vocab.idToShard).toBeDefined();
  });

  it("grammar meta is lightweight", () => {
    const metaPath = join(process.cwd(), "public/content/grammar/meta.json");
    expect(existsSync(metaPath)).toBe(true);
    const raw = readFileSync(metaPath, "utf-8");
    expect(raw.length).toBeLessThan(50_000);
  });

  it("vocab shard files exist", () => {
    const shard = join(process.cwd(), "public/content/vocab/shard-00.json");
    expect(existsSync(shard)).toBe(true);
    const data = JSON.parse(readFileSync(shard, "utf-8"));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});
