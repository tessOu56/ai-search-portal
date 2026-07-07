/** pnpm deck:build -- --input src/fixtures/resume-interview.json [--out dist/out] */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  renderBrief,
  renderOutline,
  renderScript,
} from "../renderers/brief-markdown.js";
import { DeckDocument } from "../schema/deck-document.js";

const args = process.argv.slice(2);
const get = (k: string, d: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const input = get("--input", "src/fixtures/resume-interview.json");
const out = get("--out", "dist/out");

const parsed = DeckDocument.safeParse(
  JSON.parse(readFileSync(input, "utf-8")) as unknown
);
if (!parsed.success) {
  console.error("❌ DeckDocument 驗證失敗（降級：不產出，僅報錯）");
  console.error(JSON.stringify(parsed.error.issues, null, 2));
  throw new Error("invalid DeckDocument");
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "brief.md"), renderBrief(parsed.data));
writeFileSync(join(out, "outline.md"), renderOutline(parsed.data));
writeFileSync(join(out, "script.md"), renderScript(parsed.data));
console.log(
  `✅ ${parsed.data.slides.length} slides → ${out}/{brief,outline,script}.md`
);
console.log("B1 TODO: slides.pdf (marp) / slides.pptx (pptxgenjs)");
