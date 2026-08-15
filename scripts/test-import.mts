import puppeteer from "puppeteer-core";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const file = process.argv[2] || "public/word-templates/cv-01.docx";

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

  const wizardOpen = await page.evaluate(() => Array.from(document.querySelectorAll("p")).some((p) => p.textContent?.includes("Which format suits this issue?")));
  if (wizardOpen) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Skip"));
      if (b) (b as HTMLButtonElement).click();
    });
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log("wizard was open, closed:", wizardOpen);

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Import CV"));
    (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  const fileInput = await page.$('input[type="file"]');
  await fileInput!.uploadFile(path.resolve(file));
  await new Promise((r) => setTimeout(r, 4000));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Import resume"));
    if (b) (b as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  const afterImport = await page.evaluate(() => {
    const sheet = document.querySelector(".preview-sheet") as HTMLElement | null;
    const sheetText = sheet ? (sheet.textContent || "").trim().replace(/\s+/g, " ").slice(0, 300) : "(no .preview-sheet)";
    const sheetLen = sheet ? (sheet.innerHTML || "").length : 0;
    const wizardCovering = Array.from(document.querySelectorAll("p")).some((p) => p.textContent?.includes("Which format suits this issue?"));
    const name = (document.querySelector(".preview-folio")?.textContent || "").trim().slice(0, 60);
    return { sheetText, sheetLen, wizardCovering, name };
  });
  console.log("AFTER IMPORT:", JSON.stringify(afterImport, null, 2));

  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const afterReload = await page.evaluate(() => {
    const sheet = document.querySelector(".preview-sheet") as HTMLElement | null;
    const sheetText = sheet ? (sheet.textContent || "").trim().replace(/\s+/g, " ").slice(0, 300) : "(no .preview-sheet)";
    const wizardCovering = Array.from(document.querySelectorAll("p")).some((p) => p.textContent?.includes("Which format suits this issue?"));
    return { sheetText, wizardCovering };
  });
  console.log("AFTER RELOAD:", JSON.stringify(afterReload, null, 2));
  console.log("JS errors:", errors.length ? errors.join("\n") : "none");
} finally {
  await browser.close();
}
