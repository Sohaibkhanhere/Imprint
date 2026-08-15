# OpenCode Build Prompt — Professional Resume Maker

Copy everything below into OpenCode as your build prompt.

---

## Project

Build a **professional, production-quality Resume Maker web app** — a tool where users fill in their details once and generate a polished, authentic, ATS-friendly resume that they can preview live, customize, and export as PDF (and optionally DOCX).

Use every relevant Claude Code skill/tool available in this environment (docx generation, pdf generation, frontend-design guidance, file creation, etc.) to produce a genuinely professional result — not a generic template dump.

## Goal

A real, usable web application (not a mockup) where:
1. A user enters their resume data through a clean, guided form.
2. They see a **live preview** of the resume as they type.
3. They can switch between **multiple professionally designed templates**.
4. They can **export to PDF** (pixel-perfect, print-ready, one or two pages) and ideally **DOCX**.
5. The output looks like it was made by a human designer — good typography, spacing, hierarchy — not a default browser-print dump.

## Tech Stack

- Frontend: React + Tailwind CSS (or plain HTML/CSS/JS if simpler is preferred — decide based on what renders most reliably for PDF export)
- PDF export: use a reliable print-to-PDF approach (e.g., browser print stylesheet tuned for A4/Letter, or a PDF generation library) — must produce clean, correctly paginated output, not cut-off text
- Local state only — no backend/database required for v1. All data stays in the browser (localStorage) so users don't lose progress on refresh
- No external paid APIs required

## Core Features (must-have)

### 1. Guided Data Entry Form
Sections, each collapsible/expandable:
- **Header**: full name, target job title/tagline, phone, email, city/location, LinkedIn, portfolio/website
- **Summary**: 2–4 line professional summary
- **Work Experience**: repeatable entries — company, title, location, start/end date (or "Present"), 3–5 bullet points per role (achievement-focused, not just duties)
- **Education**: repeatable entries — institution, degree, field, dates, GPA/honors (optional)
- **Skills**: tag-style input, grouped optionally (e.g., Technical / Soft Skills / Tools)
- **Projects** (optional section): name, description, tech/tools used, link
- **Certifications** (optional)
- **Languages** (optional)
- Ability to **reorder sections** (drag-and-drop or up/down buttons)
- Ability to **hide/show optional sections**

### 2. Live Preview Pane
- Split-screen: form on one side, real-time resume preview on the other (or a toggle on mobile)
- Preview must exactly match what gets exported to PDF

### 3. Multiple Templates
Build **at least 5 original, professionally designed templates** (do NOT copy any existing brand's copyrighted template — design these from scratch):
1. **Classic/Traditional** — serif headers, conservative, ATS-safe, single column
2. **Modern Minimal** — clean sans-serif, generous whitespace, subtle accent color
3. **Two-Column Professional** — sidebar for contact/skills, main column for experience
4. **Executive** — bold header band, strong hierarchy, suited for senior roles
5. **Creative/Bold** — accent color blocks, modern typography, for design/marketing roles (still clean and readable)

Each template must:
- Support both light accent-color themes and a neutral/print-safe default
- Be genuinely ATS-friendly where relevant (avoid text-in-images, avoid tables that break parsing for the "ATS-safe" template specifically)
- Auto-paginate correctly for 1–2 page resumes
- Look distinct from the others, not just a recolor

### 4. Customization
- Accent color picker (a curated palette, not a full color wheel, to keep it looking professional)
- Font pairing choices (2–3 curated pairings per template, not arbitrary Google Fonts chaos)
- Section spacing/density toggle (Compact / Comfortable)

### 5. Export
- **Export to PDF**: must be clean, correctly sized (A4 and Letter options), no cut-off content, no browser URL/headers in the print output
- **Export to DOCX** (nice-to-have if time allows): a simplified but still clean version, since DOCX layout fidelity is harder — use the docx generation skill/tooling available to produce a real .docx file, not just renamed HTML
- Filename should auto-generate as `FirstName-LastName-Resume.pdf`

### 6. Content Quality Help (this is what makes it "authentic," not generic)
- For each work experience bullet, offer a **"Improve this bullet"** helper button that rewrites the user's rough input into a strong, achievement-oriented, action-verb-led bullet (using an AI call if an API key/tooling is available in this environment; otherwise provide a static library of strong action-verb starters and a formula guide: Action Verb + Task + Quantifiable Result)
- A built-in **checklist/tips panel**: no first person pronouns, quantify results where possible, keep bullets to 1–2 lines, tense consistency (past for past roles, present for current), avoid generic filler ("hardworking," "team player" alone)
- Real-time **resume health checks**: warn if summary is empty, if a work entry has no bullets, if contact info is missing, if resume exceeds 2 pages

## Design Requirements

- Follow strong modern design fundamentals: clear typographic hierarchy, consistent spacing scale, restrained color use, alignment discipline. No default/generic Bootstrap look.
- The *website itself* (not just the resume output) should also look professional and polished — a proper landing/builder UI, not a bare form. Clean navigation, good use of whitespace, a cohesive color system for the app's own UI (separate from the resume's own color customization).
- Fully responsive — usable on mobile for form-filling, though PDF export UX can be desktop-optimized.
- Use a consistent icon set (e.g., lucide-react) — no mismatched icon styles.

## Non-Negotiables

- Do NOT scrape, copy, or reproduce any third-party platform's (e.g., Canva, Zety, Novoresume) proprietary templates, layouts, or branded assets. All templates must be original designs built from scratch based on general resume best practices.
- No placeholder "Lorem ipsum" left in the final shipped UI — use realistic sample data (e.g., a fictional "Ayesha Khan — Marketing Manager" sample) so users see what a filled resume looks like before entering their own data.
- No broken exports — test that PDF output actually opens correctly and text is selectable (not a rasterized image) wherever possible.

## Deliverables

1. Fully working local web app (`npm run dev` should just work)
2. All 5 templates implemented and switchable without losing entered data
3. Working PDF export for all templates
4. A short README explaining how to run it and how to add a new template (for future extensibility)
5. Sample/demo data pre-loaded so the preview isn't empty on first load

## Build Order (suggested)

1. Scaffold app + data model (the resume JSON schema covering all sections above)
2. Build the form UI section-by-section, wired to state, with localStorage persistence
3. Build Template 1 (Classic) fully, including PDF export — get the export pipeline working end-to-end before building more templates
4. Build remaining 4 templates reusing the same data model
5. Add customization (color/font/density)
6. Add content-quality helpers and resume health checks
7. Polish: landing/intro screen, responsive pass, final QA on PDF output across all templates

Work through this in order and check in after step 3 (first working PDF export) before continuing, so the export pipeline can be validated early.
