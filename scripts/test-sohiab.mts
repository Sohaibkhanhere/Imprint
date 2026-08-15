import puppeteer from "puppeteer-core";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Open the gallery then the Word (.docx) tab
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Template"));
    if (b) (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Word (.docx)"));
    if (b) (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 4000));

  const gallery = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("button"))
      .map((x) => x.textContent || "")
      .filter((t) => /Sohiab|Word Template|cv /i.test(t.trim()))
      .slice(0, 8);
    const hasSohiab = document.body.textContent?.includes("Sohiab Resume") ?? false;
    const hasCount = /Word \(\.docx\) files · fill in your details/.test(document.body.textContent || "");
    const allButtons = Array.from(document.querySelectorAll("button")).map((x) => x.textContent?.trim()).filter(Boolean);
    const cardCount = allButtons.filter((t) => /^Word Template \d+$|^Sohiab Resume$/.test(t || "")).length;
    return { labels, hasSohiab, hasCount, cardCount };
  });
  console.log("GALLERY:", JSON.stringify(gallery, null, 2));

  // Close gallery, import Sohiab Resume.docx
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Done");
    if (b) (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Import CV"));
    (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const fileInput = await page.$('input[type="file"]');
  await fileInput!.uploadFile(path.resolve("public/word-templates/Sohiab Resume.docx"));
  await new Promise((r) => setTimeout(r, 4000));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Import resume"));
    if (b) (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  const importState = await page.evaluate(() => {
    const sheet = document.querySelector(".preview-sheet") as HTMLElement | null;
    const sheetText = sheet ? (sheet.textContent || "").trim().replace(/\s+/g, " ").slice(0, 400) : "(no sheet)";
    const wizardCovering = Array.from(document.querySelectorAll("p")).some((p) => p.textContent?.includes("Which format suits this issue?"));
    const name = (document.querySelector(".preview-folio")?.textContent || "").trim().slice(0, 60);
    const hasFounder = sheetText.includes("QUANTUM DIGITIZIN");
    const hasIcom = sheetText.includes("I.COM");
    const hasKarachi = sheetText.includes("Karachi");
    return { sheetText, wizardCovering, name, hasFounder, hasIcom, hasKarachi };
  });
  console.log("IMPORT:", JSON.stringify(importState, null, 2));
  console.log("JS errors:", errors.length ? errors.join("\n") : "none");
} finally {
  await browser.close();
}
