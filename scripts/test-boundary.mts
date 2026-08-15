import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0", timeout: 60000 });

  // Inject a poisoned resume: skills as a plain string + an experience with a null nested field.
  const poisoned = {
    meta: { id: "x", name: "broken", type: "combination", createdAt: "", updatedAt: "" },
    target: { jobDescription: "", enabled: false },
    contact: { fullName: "Broken Person", title: "Dev", phone: "", email: "", city: "", country: "", linkedin: "", website: "", github: "", portfolioUrl: "" },
    summary: "Hello",
    objective: "",
    useObjective: false,
    experience: [{ id: "j1", company: "ACME", role: "Engineer", location: "", startDate: null, endDate: undefined, present: false, descriptor: "", bullets: ["bulleted", null] }],
    education: [{ id: "e1", institution: "MIT", degree: "BS", field: "", location: "", startDate: "", endDate: "", gpa: "", honors: "", coursework: "", thesis: "" }],
    skills: [{ id: "s1", name: "Skills", skills: "not-an-array" }],
    projects: [],
    certifications: [],
    languages: [],
    volunteer: [],
    awards: [],
    publications: [],
    teaching: [],
    references: [],
    sectionOrder: ["summary", "experience", "education", "skills"],
    visibility: { summary: true, experience: true, education: true, skills: true, projects: false, certifications: false, languages: false, volunteer: false, awards: false, publications: false, teaching: false, references: false, objective: false },
    theme: { template: "classic", accent: "#b45309", fontPair: "editorial", pageSize: "a4", density: "comfortable", atsSafe: false, citationFormat: "apa" },
  };
  await page.evaluate((p) => {
    window.localStorage.setItem("resume-studio:v2", JSON.stringify(p));
  }, poisoned);
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  const state = await page.evaluate(() => {
    const body = document.body.textContent || "";
    const boundaryMsg = body.includes("The proof couldn't render this data");
    const appShellMsg = body.includes("Resume Studio hit a snag");
    const formVisible = body.includes("Contents") || body.includes("Your copy");
    return { boundaryMsg, appShellMsg, formVisible, bodyHead: body.trim().slice(0, 120) };
  });
  console.log(JSON.stringify(state, null, 2));
  console.log("JS errors:", errors.length ? errors.join("\n") : "none");
} finally {
  await browser.close();
}
