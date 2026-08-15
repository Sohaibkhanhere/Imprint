import fs from "node:fs";
import { mergeResumeIntoXml, paragraphTexts } from "../src/lib/wordTemplateMerge.ts";
import { resume } from "./sample-resume.mts";
const dir = "C:/Users/SOHAIB~1/AppData/Local/Temp/opencode";
for (const n of [1, 2, 5, 22]) {
  const xml = fs.readFileSync(`${dir}/docx_CV_${n}/x/word/document.xml`, "utf8");
  console.log(`===== CV(${n}) MERGED =====`);
  paragraphTexts(mergeResumeIntoXml(xml, resume)).forEach((t) => console.log("  " + t.slice(0, 90)));
}
