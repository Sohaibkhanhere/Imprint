import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(process.cwd() + "/");
const mammoth = require("mammoth");
const dir = path.resolve("public/word-templates");
const targets = process.argv.slice(2);
for (const t of targets) {
  const buf = fs.readFileSync(path.join(dir, t));
  const r = await mammoth.extractRawText({ buffer: buf });
  console.log(`\n===== ${t} =====`);
  console.log(r.value);
}
