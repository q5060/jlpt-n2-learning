"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { tokenizePassage, lookupWord } from "@/lib/dict/lookup";
import { findGrammarMatches } from "@/lib/grammar/patterns";
import { getOrCreateCard } from "@/lib/srs/fsrs";
import { getVocabByWord } from "@/lib/content/loader";

export function TokenizedPassage({ content }: { content: string }) {
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    word: string;
    reading: string;
    meaning: string;
  } | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const grammarMatches = findGrammarMatches(content);
  const tokens = tokenizePassage(content);

  async function handleWordClick(word: string, e: React.MouseEvent) {
    if (!/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(word)) return;
    const result = await lookupWord(word);
    if (result) {
      setPopover({
        x: e.clientX,
        y: e.clientY,
        word,
        reading: result.reading,
        meaning: result.meaning,
      });
    }
  }

  async function addToSrs() {
    if (!popover) return;
    const entry = await getVocabByWord(popover.word);
    const contentId = entry?.id ?? `lookup-${popover.word}`;
    await getOrCreateCard(contentId, "vocab");
    setAdded(popover.word);
    setTimeout(() => setAdded(null), 2000);
  }

  return (
    <div className="relative leading-loose">
      {tokens.map((tok, i) => {
        if (!tok.isWord) return <span key={i}>{tok.text}</span>;
        const highlighted = grammarMatches.some((m) => content.indexOf(tok.text, i) >= 0);
        return (
          <span
            key={i}
            className={`cursor-pointer rounded px-0.5 hover:bg-red-100 dark:hover:bg-red-950 ${highlighted ? "border-b border-dashed border-orange-400" : ""}`}
            onClick={(e) => handleWordClick(tok.text, e)}
          >
            {tok.text}
          </span>
        );
      })}
      {popover && (
        <div
          className="fixed z-50 max-w-xs rounded-lg border bg-white p-3 shadow-lg dark:bg-zinc-900"
          style={{ left: popover.x, top: popover.y + 10 }}
        >
          <p className="font-bold">{popover.word}</p>
          <p className="text-sm text-zinc-500">{popover.reading}</p>
          <p className="text-sm">{popover.meaning}</p>
          <Button size="sm" className="mt-2" onClick={addToSrs}>
            {added === popover.word ? "追加済み" : "SRSに追加"}
          </Button>
          <Button size="sm" variant="ghost" className="ml-1" onClick={() => setPopover(null)}>
            閉じる
          </Button>
        </div>
      )}
    </div>
  );
}
