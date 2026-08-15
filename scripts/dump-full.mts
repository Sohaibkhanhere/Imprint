import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { parseCvText } from "../src/lib/cvImport";

const require = createRequire(process.cwd() + "/");
const mammoth = require("mammoth");
const src = path.resolve(process.argv[2]);
const buf = fs.readFileSync(src);
const r = await mammoth.extractRawText({ buffer: buf });
console.log("=== RAW TEXT ===");
console.log(r.value);
console.log("=== DRAFT ===");
const draft = parseCvText(r.value);
console.log(JSON.stringify(draft, null, 2));
