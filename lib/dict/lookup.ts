import { lookupDict as cacheLookupDict } from "@/lib/content/cache";

export async function lookupWord(
  surface: string
): Promise<{ reading: string; meaning: string } | null> {
  return cacheLookupDict(surface);
}

export function tokenizePassage(text: string): { text: string; isWord: boolean }[] {
  const tokens: { text: string; isWord: boolean }[] = [];
  const re = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]+|[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const t = m[0];
    const isWord = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(t);
    tokens.push({ text: t, isWord });
  }
  return tokens;
}
