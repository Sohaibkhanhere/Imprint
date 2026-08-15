import JSZip from "jszip";
import fs from "node:fs";
import { mergeResumeIntoXml, detectDocMeta } from "../src/lib/wordTemplateMerge";
import { createBlankResume } from "../src/lib/sampleData";

const buf = fs.readFileSync("public/word-templates/Sohiab Resume.docx");
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file("word/document.xml")!.async("string");
const meta = detectDocMeta(xml);
console.log("DOC META:", JSON.stringify(meta));

const resume = {
  ...createBlankResume(),
  contact: { ...createBlankResume().contact, fullName: "Bilal Ahmed", title: "Senior Software Engineer", phone: "+92 300 1234567", email: "bilal@test.com", city: "Lahore", country: "Pakistan" },
  summary: "Automation & AI enthusiast with 6+ years of experience.",
  experience: [
    {
      id: "x1",
      company: "QUANTUM DIGITIZIN",
      role: "Founder",
      location: "Karachi",
      startDate: "2025",
      endDate: "",
      present: true,
      descriptor: "",
      bullets: ["Built automation tools", "Led production workflows"],
    },
  ],
  skills: [{ id: "s1", name: "Skills", skills: ["CorelDraw", "Illustrator", "Photoshop", "Automation"] }],
} as never;

const merged = mergeResumeIntoXml(xml, resume as never);
console.log("MERGE OK, length:", merged.length);
console.log("name replaced:", merged.includes("Bilal Ahmed"));
console.log("old name gone:", !merged.includes("M. SOHAIB KHAN"));
console.log("email replaced:", merged.includes("bilal@test.com"));
console.log("title replaced:", merged.includes("Senior Software Engineer"));
