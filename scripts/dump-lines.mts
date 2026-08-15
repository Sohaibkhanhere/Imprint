import { readFileSync } from "node:fs";
const file = process.argv[2] ?? "Sohaib Curriculum Vitae (CV) Updated.txt";
const text = readFileSync("scripts/train-dump/" + file, "utf8");
const lines = text.split(/\r?\n/).map((l) => l.replace(/[\u0000\u00ad\u200b\u200c\u200d\u2060]/g, "").replace(/\u00a0/g," ").trim()).filter(Boolean).filter((l) => /[A-Za-z0-9]/.test(l));
lines.forEach((l, i) => console.log(String(i).padStart(3) + ": " + JSON.stringify(l.slice(0, 100))));
