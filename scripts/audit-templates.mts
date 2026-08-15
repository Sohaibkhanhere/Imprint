import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { parseCvText } from "../src/lib/cvImport";

const require = createRequire(process.cwd() + "/");
const mammoth = require("mammoth");
const dir = path.resolve("public/word-templates");
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".docx")).sort();

for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  const r = await mammoth.extractRawText({ buffer: buf });
  const d = parseCvText(r.value);
  const exp = d.experience.map((e) => {
    const bullets = (e.bullets ?? []).length;
    const role = e.role || e.company || e.title || "?";
    const dates = `${e.startDate ?? ""}${e.present ? "+" : e.endDate ? "-" + e.endDate : ""}`;
    return `${role}@${dates}[${bullets}b${e.descriptor ? ",d=" + e.descriptor.slice(0, 24) : ""}]`;
  });
  console.log(`\n=== ${f} ===`);
  console.log(`  NAME: ${JSON.stringify(d.contact.fullName)} | TITLE: ${JSON.stringify(d.contact.title)}`);
  console.log(`  PHONE: ${JSON.stringify(d.contact.phone)} | EMAIL: ${JSON.stringify(d.contact.email)} | CITY: ${JSON.stringify(d.contact.city)} | WEB: ${JSON.stringify(d.contact.website)}`);
  console.log(`  SUMMARY: ${JSON.stringify((d.summary || "").slice(0, 80))}`);
  console.log(`  EXP: ${exp.join(" || ")}`);
  console.log(`  SKILLS: ${JSON.stringify(d.skills.map((s) => s.skills?.join("; ")).join(" | ").slice(0, 160))}`);
  console.log(`  EDU: ${JSON.stringify(d.education.map((e) => `${e.degree}@${e.field}@${e.institution}@${e.startDate ?? ""}${e.endDate ? "-" + e.endDate : ""}`).join(" || "))}`);
  console.log(`  WARN: ${JSON.stringify(d.warnings)}`);
}
