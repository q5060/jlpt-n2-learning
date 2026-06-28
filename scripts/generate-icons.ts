#!/usr/bin/env npx tsx
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "public/icons");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#c45c5c"/>
  <text x="256" y="300" font-size="180" font-family="sans-serif" fill="white" text-anchor="middle" font-weight="bold">N2</text>
</svg>`;

writeFileSync(join(OUT, "icon.svg"), svg);

const PNG_STUB = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), PNG_STUB);
}

console.log("Icons generated in public/icons (SVG + PNG placeholders)");
