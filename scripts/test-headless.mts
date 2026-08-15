import puppeteer from "puppeteer-core";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import JSZip from "jszip";

const PORT = 5199;
const URL = `http://localhost:${PORT}/`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DL_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "wt-dl-"));

const server: ChildProcess = spawn("npx vite preview --port " + String(PORT) + " --strictPort", { shell: true, stdio: "ignore" });

function waitFor(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await waitFor(500);
  }
  throw new Error("preview server did not start");
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

let failures = 0;
const check = (cond: boolean, label: string) => {
  console.log(`${cond ? "ok" : "FAIL"} - ${label}`);
  if (!cond) failures++;
};

try {
  await startServer();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const cdp = await page.createCDPSession();
  await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DL_DIR, eventsEnabled: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("button", { timeout: 20000 });
  const hasTemplateButton = await page.evaluate(() => Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.includes("Template")));
  check(hasTemplateButton, "app rendered with Template button");

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Template"));
    (b as HTMLButtonElement).click();
  });
  await page.waitForSelector(".fixed", { timeout: 15000 });

  const tabButtons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => b.textContent || ""));
  check(tabButtons.some((t) => t.includes("Word (.docx)")), "gallery shows Word (.docx) tab");

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Word (.docx)"));
    (b as HTMLButtonElement).click();
  });
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.includes("Use & export .docx")), { timeout: 20000 });

  const cards = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button")).filter((b) => b.textContent?.includes("Use & export .docx"));
    return btns.length;
  });
  check(cards === 24, `24 Word template cards rendered (got ${cards})`);

  await page.waitForFunction(
    () => {
      const spans = Array.from(document.querySelectorAll("span"));
      return spans.some((s) => (s.getAttribute("style") || "").includes("transform: scale(0.5)") && s.firstElementChild && s.firstElementChild.childElementCount > 0);
    },
    { timeout: 60000 }
  );
  await waitFor(8000);
  const previewInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button")).filter((b) => b.textContent?.includes("Use & export .docx"));
    const cards = buttons.map((b) => b.closest("div")?.querySelector("p:last-of-type")?.textContent || "");
    const scaledWithChildren = Array.from(document.querySelectorAll("span")).filter((s) => (s.getAttribute("style") || "").includes("scale(0.5)") && s.firstElementChild && s.firstElementChild.childElementCount > 0).length;
    const errors = cards.filter((c) => c.includes("Preview unavailable"));
    return { previews: scaledWithChildren, errorCards: errors.length };
  });
  check(previewInfo.previews >= 22, `mammoth previews rendered (${previewInfo.previews}/24)`);
  check(previewInfo.errorCards === 0, `no preview errors (${previewInfo.errorCards})`);

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Use & export .docx"));
    (b as HTMLButtonElement).click();
  });
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.includes("Export .docx")), { timeout: 10000 });
  const modalHasInputs = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("p")).some((p) => p.textContent?.includes("Enter your details"));
    const inputs = Array.from(document.querySelectorAll("input")).filter((i) => i.placeholder);
    return heading && inputs.length >= 6;
  });
  check(modalHasInputs, "input modal opens first with details form");
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    const nameInput = inputs.find((i) => i.placeholder?.toLowerCase().includes("bilal"));
    const emailInput = inputs.find((i) => i.placeholder?.toLowerCase().includes("you@example"));
    if (nameInput) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(nameInput, "Bilal Ahmed");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (emailInput) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(emailInput, "bilal@example.com");
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes("Export .docx"));
    (b as HTMLButtonElement).click();
  });
  await waitFor(7000);

  const files = fs.readdirSync(DL_DIR);
  check(files.length === 1, `download captured (${files.join(", ")})`);
  const file = files[0];
  if (file) {
    const buf = fs.readFileSync(path.join(DL_DIR, file));
    check(buf[0] === 0x50 && buf[1] === 0x4b, "downloaded file is a zip (docx)");
    const zip = await JSZip.loadAsync(buf);
    const doc = zip.file("word/document.xml");
    check(!!doc, "docx contains word/document.xml");
    if (doc) {
      const xml = await doc.async("string");
      check(xml.includes("<w:p"), "document.xml is valid paragraph markup");
    }
  }

  const jsErrors = errors.filter((e) => !/Download the React DevTools/i.test(e));
  if (jsErrors.length) console.log("errors:", jsErrors.join(" || ").slice(0, 400));
  check(jsErrors.length === 0, `no console/page errors (${jsErrors.length})`);
} finally {
  await browser.close();
  server.kill();
}

console.log(failures ? `RESULT: ${failures} FAILURE(S)` : "RESULT: ALL OK");
process.exit(failures ? 1 : 0);
