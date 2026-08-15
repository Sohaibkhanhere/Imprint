# OpenCode Master Prompt — Resume Types, Formats & Content Standards

Copy this entire document into OpenCode as context/instructions for building the Resume Maker's content engine, template logic, and guidance system. This defines WHAT KINDS of resumes the app must be able to produce and HOW each should be structured, written, and formatted — pair this with the earlier "Resume Maker Build Prompt" (app architecture) and the 9 HTML templates already built.

---

## 1. Resume Format Types (the app must support all of these)

Every resume the app generates must be buildable in each of these formats, because different users need different formats depending on career stage and situation. The app's data model should support tagging a resume as one of these types, and each type should slightly reorder/reweight sections.

### 1.1 Chronological Resume (default/most common)
- Structure: Contact → Summary → Work Experience (most recent first) → Education → Skills
- Best for: candidates with steady, relevant work history and no major gaps
- Rule: Every job listed in reverse-chronological order, no gaps left unexplained
- ATS-safest format — recruiters and ATS parsers expect this structure by default

### 1.2 Functional / Skills-Based Resume
- Structure: Contact → Summary → Core Skills/Competencies (grouped, detailed) → Selected Achievements → brief Work History (titles/dates only, no bullets) → Education
- Best for: career changers, people with employment gaps, people re-entering the workforce, recent graduates with more relevant projects than jobs
- Rule: Skills sections must still be backed by concrete evidence/achievements, not just a bare list — avoid the classic weakness of functional resumes (looking like something is being hidden)

### 1.3 Combination / Hybrid Resume
- Structure: Contact → Summary → Key Skills (short) → Work Experience (full, with bullets) → Education
- Best for: experienced professionals with strong, relevant work history who also want to highlight a specific skill set up front (e.g., switching specialization within the same field)
- This should be the app's "recommended default" for most users with 3+ years experience

### 1.4 Targeted Resume
- Not a separate layout — a MODE. Same base data, but the app must let a user paste a job description and automatically re-rank/re-word bullet points and skills to mirror that job posting's language and priorities (keyword matching for ATS).
- Feature requirement: "Tailor to a job posting" — textarea for pasting JD, app extracts key terms/skills, highlights which of the user's existing bullets/skills match, flags missing keywords the user might want to address.

### 1.5 Curriculum Vitae (CV) — Academic/Research/Medical
- Structure: Contact → Research Summary/Objective → Education (detailed, with thesis titles) → Publications → Research Experience → Teaching Experience → Grants/Fellowships → Conference Presentations → Awards/Honors → Professional Affiliations → Skills/Technical Competencies → References
- Best for: academia, research positions, medical/clinical roles, fellowships, PhD applicants
- Key difference from a resume: length is NOT capped at 1-2 pages — CVs can run multiple pages and are comprehensive, not curated
- Publications must support a strict academic citation format (APA/MLA/Chicago toggle)

### 1.6 Executive Resume
- Structure: Contact → Executive Summary (leadership-framed, 4-6 lines) → Core Leadership Competencies → Professional Experience (with heavy emphasis on P&L, team size, strategic outcomes) → Board Positions/Advisory Roles (if any) → Education → Selected Achievements/Awards
- Best for: C-suite, VP, Director-level candidates
- Tone: strategic, outcome-driven, larger scope language (revenue, headcount, market expansion) — avoid task-level language entirely
- Length: can extend to 2 pages (only resume type besides CV where this is acceptable)

### 1.7 Entry-Level / Recent Graduate Resume
- Structure: Contact → Objective or Summary (short, potential-focused) → Education (moved UP, near top, with relevant coursework/GPA if strong) → Projects/Internships → Skills → Extracurriculars/Leadership (clubs, volunteer work, sports captaincy — these count as real experience at this stage)
- Best for: students, new graduates, first job seekers
- Rule: Never leave a section empty because "no work experience" — projects, coursework, volunteer work, and leadership roles must be treated as legitimate experience entries with the same bullet-point achievement structure as a job

### 1.8 Creative/Portfolio-Adjacent Resume
- Structure: same core sections as combination resume, but visually bolder, and must include a **Portfolio/Work Samples** section with links (Behance, Dribbble, GitHub, personal site)
- Best for: designers, writers, marketers, video editors, photographers, developers with public repos
- The app should let this type link out to an external portfolio prominently near the top, not buried at the bottom

### 1.9 One-Page vs Two-Page Mode
- App must have an explicit toggle: Auto-fit to 1 page (compress spacing, trim older/less relevant bullets) vs Allow 2 pages (for 10+ years experience, executives, CVs)
- Rule of thumb the app should enforce/warn on: under 10 years experience → 1 page; 10+ years or executive/CV type → 2 pages max unless CV mode

### 1.10 Industry-Specific Variants (content presets, not new layouts)
The app should offer content presets/prompts tuned to these common industries, adjusting which sections are emphasized and what "strong bullet" examples look like:
- **Tech/Software**: emphasize tech stack, GitHub/portfolio links, quantify system scale (users served, uptime, latency improvements), list languages/frameworks clearly
- **Sales/Business Development**: lead every bullet with numbers (quota %, revenue closed, deal size, pipeline growth)
- **Marketing**: campaign metrics (CTR, conversion, ROAS, reach), tools used (ad platforms, CRM, analytics)
- **Finance/Accounting**: certifications prominent (CFA, ACCA, CPA), accuracy/compliance framing, $ figures managed
- **Healthcare/Medical**: licensure and certifications at the top near contact info, patient-outcome framing where appropriate, clinical hours/rotations for students
- **Education/Teaching**: certifications, grade levels/subjects taught, curriculum development, measurable student outcomes
- **Skilled Trades**: certifications/licenses prominent, safety record, equipment/systems expertise, apprenticeship details
- **Customer Service/Operations**: volume handled, satisfaction scores, resolution time, process improvements
- **Legal**: bar admission, practice areas, case types, notable matters (without confidential details)
- **Non-Profit/NGO**: program impact metrics, funds raised/managed, community reach, grant writing experience

## 2. Content Writing Rules the App Must Enforce/Guide

### 2.1 The Bullet Point Formula (core rule, used everywhere)
```
[Strong Action Verb] + [What you did / task] + [How, using what method or tool] + [Quantifiable result / impact]
```
Example: "Redesigned the onboarding funnel using A/B tested email sequences, increasing 30-day user retention by 22%."

The app should ship a categorized **action verb bank** (100+ verbs) grouped by function:
- Leadership: Led, Directed, Championed, Orchestrated, Mentored, Spearheaded
- Achievement: Achieved, Surpassed, Delivered, Exceeded, Attained
- Improvement: Streamlined, Optimized, Overhauled, Modernized, Enhanced
- Creation: Built, Designed, Launched, Developed, Established, Pioneered
- Analysis: Analyzed, Evaluated, Assessed, Diagnosed, Investigated
- Communication: Presented, Negotiated, Authored, Facilitated, Advised

Never allow weak/passive starters in generated content: "Responsible for," "Duties included," "Worked on," "Helped with," "Was involved in."

### 2.2 Quantification Rules
- Every work experience section should aim for at least 50% of bullets to contain a number: %, $, team size, time saved, volume, ranking
- If the user has no hard numbers, the app should still guide toward scope indicators: "across 3 regional offices," "for a team of 12," "supporting 40,000+ monthly users"
- Never fabricate numbers — the app's "Improve this bullet" helper must ask the user for a real figure rather than inventing one

### 2.3 Tense Rules
- Current role → present tense ("Manages," "Leads," "Builds")
- Past roles → past tense ("Managed," "Led," "Built")
- Never mix tense within the same role's bullet list
- Summary section → present tense, third-person-omitted style ("Marketing manager with 6 years...")

### 2.4 Length & Density Rules
- Each bullet: 1–2 lines max (roughly 12–22 words) — the app should flag/warn on bullets exceeding this
- 3–6 bullets per role for recent/relevant jobs; 1–3 bullets for older/less relevant roles (10+ years back)
- Summary: 2–4 sentences, never a full paragraph block exceeding 5 lines
- Skills section: 8–15 skills, grouped by category if more than 10

### 2.5 Words/Phrases to Avoid (app should flag these in the health-check feature)
- Generic filler with no evidence: "hardworking," "team player," "detail-oriented," "results-driven," "go-getter," "synergy," "think outside the box," "self-starter" — these are only acceptable if immediately followed by concrete proof, otherwise flag as vague
- First-person pronouns: "I," "my," "me" — resumes are written in implied first person without stating it
- Reference to "References available upon request" — outdated, omit entirely (only actual named references, or nothing)

### 2.6 ATS-Safety Rules (must be enforced for the "Classic" and "ATS-safe" template specifically, and offered as a toggle for all templates)
- No text inside images/icons for content that needs to be parsed (name, contact info, job titles)
- No tables for layout in ATS-safe mode (many ATS parsers break on tables) — this affects the 2-column/sidebar templates: those must ship an "ATS-safe export" variant that linearizes content into a single column
- Standard section headings ATS parsers recognize: "Work Experience" / "Professional Experience" (not cute alternatives like "My Journey"), "Education," "Skills," "Certifications"
- Standard, widely-installed fonts only for ATS mode (Arial, Calibri, Georgia, Times New Roman) — no decorative/script fonts
- File format: PDF text-based (not scanned/rasterized) or DOCX — never resume-as-image

## 3. Section-by-Section Content Standards

### 3.1 Contact/Header
Required: Full name, phone, professional email, city + country (no full street address needed for privacy)
Optional but recommended: LinkedIn URL (cleaned, e.g. linkedin.com/in/name — not the full tracking URL), portfolio/website, GitHub (if technical)
Never include: date of birth, marital status, photo (unless CV/regional norm expects it — flag as region-dependent), national ID numbers, full home address

### 3.2 Professional Summary vs Objective
- **Summary** (for anyone with relevant experience): 2-4 sentences — who you are professionally, years of experience, top 2-3 strengths, one standout achievement or specialization
- **Objective** (only for entry-level/career-changers with little relevant experience): 1-2 sentences — what role you're seeking and what you bring, framed around value to the employer, not what you want personally
- The app should auto-suggest which one to use based on the resume type selected (section 1.7 → Objective allowed; all others → Summary)

### 3.3 Work Experience Entry Structure
```
[Job Title]                                    [Start Date] – [End Date/Present]
[Company Name] | [Location]
• Bullet 1 (formula above)
• Bullet 2
• Bullet 3
```
- Company name and job title both matter for ATS keyword matching — never abbreviate either
- If company is not well-known, a single 4-8 word descriptor is acceptable in parentheses (e.g., "Northline Retail Co. (mid-size DTC apparel brand)")

### 3.4 Education Entry Structure
```
[Degree], [Field of Study]                     [Start Year] – [End Year]
[Institution Name] | [Location]
[GPA if 3.5+/4.0, Honors, relevant coursework — only if student/recent grad or GPA is strong]
```
- Experienced professionals (5+ years out): drop GPA and coursework, keep it to one line
- List most recent/highest degree first

### 3.5 Skills Section Standards
- Split into logical groups when list exceeds ~10 items: e.g., "Technical Skills" vs "Soft Skills" vs "Tools & Platforms"
- Avoid skill-rating bars/sliders (like "Photoshop ●●●●○") for ATS-safe mode — these don't parse and are seen as unverifiable by recruiters; fine for visual-only templates aimed at design-forward industries
- List actual tool/platform names precisely as the industry knows them (e.g., "Google Analytics 4" not "Analytics tools")

### 3.6 Optional Sections — When to Include
- **Projects**: always for entry-level/tech; optional elsewhere if a project demonstrates a skill not shown in work history
- **Certifications**: include if relevant and current (flag expired certs)
- **Languages**: include if genuinely relevant to the role or a differentiator; note fluency level (Native / Fluent / Professional / Conversational — never vague "Good")
- **Volunteer Experience**: include especially for entry-level or when it demonstrates leadership/relevant skills; use the same bullet formula as work experience
- **Awards/Honors**: include only 2-4 most relevant/impressive; skip minor/irrelevant ones
- **Publications** (non-academic resume): only if genuinely relevant (e.g., thought-leadership blog for a marketing role)

## 4. Resume Health-Check Rules (build into the app's real-time validator)

Flag/warn the user when:
1. Any work experience entry has zero bullet points
2. Contact section is missing phone or email
3. Summary/Objective section is empty
4. A bullet point exceeds ~25 words
5. A bullet starts with a weak verb from the banned list (2.5)
6. Resume exceeds 2 pages for a non-CV, non-executive resume type
7. Dates have gaps of 6+ months unexplained (suggest addressing via a brief note, freelance entry, or functional format)
8. Same action verb is repeated 3+ times across the resume (suggest variety from the verb bank)
9. Skills section has fewer than 5 or more than 20 entries
10. No quantified bullets exist anywhere in Work Experience (suggest at least 2-3)

## 5. Output Requirements Recap (ties back to earlier build prompt)

- The resume TYPE selection (section 1) should be a first step in the app's wizard, before the user even opens the form — it changes which sections are shown/required and pre-fills the Summary vs Objective toggle
- The 9 existing templates should each be tagged with which resume types they suit best (e.g., Tech-dark → Tech/Software + Chronological/Combination; CV-heavy long-form needs a new dedicated CV template — build a 10th "Academic CV" template: single column, no color blocks, sections for Publications/Grants/Teaching as described in 1.5)
- The "Tailor to a job posting" feature (1.4) should be built as a distinct feature, not a new template
- All content rules in section 2 and the health-checks in section 4 should power the "Improve this bullet" and resume-scoring features already specified in the main build prompt

---

Work through this alongside the main build prompt. If anything here conflicts with the main build prompt on formatting details, this document's content/writing rules take precedence; the main build prompt's app architecture and template visuals take precedence for layout/UI decisions.
