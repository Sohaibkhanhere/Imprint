import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { parseCvText } from "../src/lib/cvImport";

const require = createRequire(process.cwd() + "/");
const mammoth = require("mammoth");
const src = path.resolve(process.argv[2]);
const buf = fs.readFileSync(src);
const r = await mammoth.extractRawText({ buffer: buf });
const draft = parseCvText(r.value);

console.log("NAME:", JSON.stringify(draft.contact.fullName));
console.log("TITLE:", JSON.stringify(draft.contact.title));
console.log("PHONE:", JSON.stringify(draft.contact.phone));
console.log("EMAIL:", JSON.stringify(draft.contact.email));
console.log("CITY:", JSON.stringify(draft.contact.city));
console.log("COUNTRY:", JSON.stringify(draft.contact.country));
console.log("WEBSITE:", JSON.stringify(draft.contact.website));
console.log("SUMMARY:", JSON.stringify((draft.summary || "").slice(0, 110)));
console.log("--- EXPERIENCE ---");
for (const e of draft.experience) {
  console.log(JSON.stringify({ role: e.role, company: e.company, startDate: e.startDate, endDate: e.endDate, present: e.present, descriptor: e.descriptor, bullets: (e.bullets ?? []).slice(0, 3) }));
}
console.log("--- SKILLS ---");
for (const g of draft.skills) console.log(g.name, "->", g.skills.join(" | "));
console.log("--- EDUCATION ---");
for (const e of draft.education) {
  console.log(JSON.stringify({ degree: e.degree, field: e.field, institution: e.institution, startDate: e.startDate, endDate: e.endDate }));
}
console.log("SECTION ORDER:", draft.sectionOrder.join(", "));
console.log("WARNINGS:", draft.warnings.join("; "));
