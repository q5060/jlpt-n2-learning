#!/usr/bin/env npx tsx
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const OUT = join(process.cwd(), "public/icons");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#b91c1c"/>
  <text x="256" y="300" font-size="180" font-family="sans-serif" fill="white" text-anchor="middle" font-weight="bold">N2</text>
</svg>`;

writeFileSync(join(OUT, "icon.svg"), svg);

for (const size of [192, 512]) {
  const out = join(OUT, `icon-${size}.png`);
  try {
    execSync(
      `qlmanage -t -s ${size} -o "${OUT}" "${join(OUT, "icon.svg")}" 2>/dev/null && mv "${join(OUT, "icon.svg.png")}" "${out}"`,
      { stdio: "ignore" }
    );
  } catch {
    const stub = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    writeFileSync(out, stub);
  }
}
console.log("Icons generated in public/icons");
