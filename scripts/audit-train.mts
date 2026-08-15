import fs from "node:fs";
import path from "node:path";
import { parseCvText } from "../src/lib/cvImport.ts";

const dir = path.resolve("scripts/train-dump");
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  const d = parseCvText(text);
  console.log(`\n=== ${f} ===`);
  console.log("NAME:", JSON.stringify(d.contact.fullName), "| TITLE:", JSON.stringify(d.contact.title), "| PHONE:", JSON.stringify(d.contact.phone), "| EMAIL:", JSON.stringify(d.contact.email), "| CITY:", JSON.stringify(d.contact.city), "| WEB:", JSON.stringify(d.contact.website));
  console.log("SUMMARY:", JSON.stringify(d.summary.slice(0, 100)));
  console.log("EXP:", d.experience.map((e) => `${e.role || e.company || "-"}[${e.startDate || "-"}-${e.endDate || (e.present ? "now" : "-")}]${(e.bullets ?? []).length}b`).join(" || "));
  console.log("SKILLS:", d.skills.map((g) => g.skills.join("; ")).join(" | ").slice(0, 180));
  console.log("EDU:", d.education.map((e) => `${e.degree || "-"}@${e.field || "-"}@${e.institution || "-"}@${e.startDate || "-"}`).join(" || "));
  console.log("WARN:", JSON.stringify(d.warnings));
}
