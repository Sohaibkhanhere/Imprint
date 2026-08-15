import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(process.cwd() + "/");
const mammoth = require("mammoth");

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const workerPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const dir = "D:/Antigravity/Resumer Maker/Model Train";
const files = fs.readdirSync(dir).filter((f) => /\.(pdf|docx)$/i.test(f));
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  let text = "";
  if (/\.docx$/i.test(f)) {
    const r = await mammoth.extractRawText({ buffer: buf });
    text = r.value;
  } else {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let line = "";
      const pageLines = [];
      for (const item of content.items) {
        if ("str" in item) {
          const s = item.str;
          if (item.hasEOL) { pageLines.push((line + s).trimEnd()); line = ""; }
          else line += s + (item.width && /^\s$/.test(s) ? "" : " ");
        }
      }
      if (line.trim()) pageLines.push(line.trimEnd());
      pages.push(pageLines.join("\n"));
    }
    text = pages.join("\n\n");
  }
  const out = path.join(process.cwd(), "scripts", "train-dump", f.replace(/\.[^.]+$/, "") + ".txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, text);
  console.log("WROTE", f, "->", text.length, "chars");
}
