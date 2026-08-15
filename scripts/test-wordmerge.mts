import fs from "node:fs";
import path from "node:path";
import { mergeResumeIntoXml, detectDocMeta, paragraphTexts } from "../src/lib/wordTemplateMerge.ts";
import { resume } from "./sample-resume.mts";

const dir = "C:/Users/SOHAIB~1/AppData/Local/Temp/opencode";

function loadXml(n: number): string {
  return fs.readFileSync(path.join(dir, `docx_CV_${n}/x/word/document.xml`), "utf8");
}

function showParas(xml: string): string[] {
  return paragraphTexts(xml);
}

let ok = 0;
let fail = 0;
for (let n = 1; n <= 24; n++) {
  try {
    const xml = loadXml(n);
    const meta = detectDocMeta(xml);
    const merged = mergeResumeIntoXml(xml, resume);
    const texts = showParas(merged);
    const all = texts.join(" | ");
    const problems: string[] = [];
    if (!all.includes("Bilal Ahmed")) problems.push("NAME MISSING");
    if (!all.includes("bilal.ahmed@example.com")) problems.push("EMAIL MISSING");
    if (!all.includes("+92 300 1234567")) problems.push("PHONE MISSING");
    if (!all.includes("Results-driven full-stack")) problems.push("SUMMARY MISSING");
    if (all.includes("Alice Robinson") || all.includes("Christopher Morgan") || all.includes("Susan Williams") || all.includes("ROBERT RICHARDSON") || all.includes("Melanie Robinson")) problems.push("SAMPLE NAME LEFT");
    if (all.includes("alice.robinson") || all.includes("christoper.") || all.includes("susan.williams") || all.includes("robert.richardson@gmail") || all.includes("morgan@gmail")) problems.push("SAMPLE EMAIL LEFT");
    const hasExp = resume.experience.length > 0 && /experience|expierence/i.test(all);
    const hasTech = all.includes("TechNova");
    if (hasExp && !hasTech) problems.push("EXPERIENCE NOT FILLED");
    const hasEdu = /university|degree/i.test(all) && all.includes("Computer Science");
    if (hasEdu && !all.includes("Computer Science")) problems.push("EDUCATION NOT FILLED");
    const hasSk = /skills|highlights|proficiencies/i.test(all) && all.includes("JavaScript");
    if (hasSk && !all.includes("JavaScript")) problems.push("SKILLS NOT FILLED");

    if (problems.length) {
      fail++;
      console.log(`CV(${n}) [${meta.name || "?"} | ${meta.title || "?"}] FAIL: ${problems.join(", ")}`);
    } else {
      ok++;
      console.log(`CV(${n}) [${meta.name || "?"} | ${meta.title || "?"}] ok`);
    }
  } catch (e: any) {
    fail++;
    console.log(`CV(${n}) ERROR: ${e.message}`);
  }
}
console.log(`\nPASS: ${ok}/24  FAIL: ${fail}/24`);
