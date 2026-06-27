export const GRAMMAR_HIGHLIGHT_PATTERNS: { pattern: string; regex: RegExp; label: string }[] = [
  { pattern: "ばかりか", regex: /ばかりか/g, label: "ばかりか〜も" },
  { pattern: "だけでなく", regex: /だけでなく/g, label: "だけでなく〜も" },
  { pattern: "はもちろん", regex: /はもちろん/g, label: "はもちろん〜も" },
  { pattern: "に限らず", regex: /に限らず/g, label: "に限らず" },
  { pattern: "に加えて", regex: /に加えて/g, label: "に加えて" },
  { pattern: "をはじめ", regex: /をはじめ/g, label: "をはじめ" },
  { pattern: "を中心に", regex: /を中心に/g, label: "を中心に" },
  { pattern: "に伴って", regex: /に伴って/g, label: "に伴って" },
  { pattern: "に応じて", regex: /に応じて/g, label: "に応じて" },
  { pattern: "に基づいて", regex: /に基づいて/g, label: "に基づいて" },
];

export function findGrammarMatches(text: string): { index: number; length: number; label: string }[] {
  const matches: { index: number; length: number; label: string }[] = [];
  for (const p of GRAMMAR_HIGHLIGHT_PATTERNS) {
    const re = new RegExp(p.regex.source, "g");
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ index: m.index, length: m[0].length, label: p.label });
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}
