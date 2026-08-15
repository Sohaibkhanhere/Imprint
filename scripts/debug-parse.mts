import { readFileSync } from "node:fs";
import { parseCvText } from "../src/lib/cvImport.ts";

const file = process.argv[2] ?? "Resume.txt";
const text = readFileSync(`scripts/train-dump/${file}`, "utf8");
const draft = parseCvText(text);
console.log(JSON.stringify(draft, null, 1));
