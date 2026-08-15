import fs from "node:fs";
import path from "node:path";
import { paragraphTexts, detectDocMeta } from "../src/lib/wordTemplateMerge.ts";
const dir = "C:/Users/SOHAIB~1/AppData/Local/Temp/opencode";
for (const n of [4, 8, 9, 11, 18]) {
  const xml = fs.readFileSync(path.join(dir, `docx_CV_${n}/x/word/document.xml`), "utf8");
  console.log(`===== CV(${n}) meta:`, JSON.stringify(detectDocMeta(xml)));
  paragraphTexts(xml).forEach((t, i) => console.log(`  [${i}] ${t.slice(0, 90)}`));
}
