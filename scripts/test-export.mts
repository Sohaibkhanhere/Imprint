import JSZip from "jszip";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { mergeResumeIntoXml } from "../src/lib/wordTemplateMerge.ts";
import { resume as SAMPLE_RESUME } from "./sample-resume.mts";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

const dir = path.resolve("public/word-templates");
const ids = ["cv-01", "cv-02", "cv-05", "cv-22", "cv-13", "cv-24"];
let pass = 0;
let fail = 0;

for (const id of ids) {
  const file = path.join(dir, `${id}.docx`);
  const buf = fs.readFileSync(file);
  try {
    const zip = await JSZip.loadAsync(buf);
    const entry = zip.file("word/document.xml");
    if (!entry) throw new Error("missing document.xml");
    const xml = await entry.async("string");
    const merged = mergeResumeIntoXml(xml, SAMPLE_RESUME);
    zip.file("word/document.xml", merged);
    const out = await zip.generateAsync({ type: "nodebuffer" });
    const zip2 = await JSZip.loadAsync(out);
    const entry2 = zip2.file("word/document.xml");
    if (!entry2) throw new Error("rezipped docx missing document.xml");
    const xml2 = await entry2.async("string");
    const html = await mammoth.convertToHtml({ buffer: out });
    const text = html.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const checks = ["Bilal Ahmed", "TechNova", "ByteWorks", "JavaScript"];
    const missing = checks.filter((c) => !text.includes(c));
    if (missing.length) throw new Error(`missing in output: ${missing.join(", ")}`);
    const stillSample = /\bAlice\b|\bRobert\b|\bRobinson\b|\bRichardson\b/i.test(text);
    if (stillSample) throw new Error(`sample persona text still present: ${text.match(/Alice|Robert|Robinson|Richardson/gi)?.join(",")}`);
    const badEntities = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(xml2);
    if (badEntities) throw new Error("unescaped ampersand/entity in merged XML");
    console.log(`${id}: ok`);
    pass++;
  } catch (e) {
    console.log(`${id}: FAIL - ${(e as Error).message}`);
    fail++;
  }
}
console.log(`PASS: ${pass}/${ids.length}  FAIL: ${fail}/${ids.length}`);
process.exit(fail ? 1 : 0);
