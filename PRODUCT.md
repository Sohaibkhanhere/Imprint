# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone making a resume, without a backend or account: students/freshers building a first resume and working professionals upgrading, tailoring, or reformatting an existing one. Confirmed as a general-purpose tool for both groups — not scoped to one.

## Product Purpose

A desktop-first web app that turns structured resume content into a professional, print-faithful document. The user edits sections on the left and sees the exact printed page (the resume) live on the right, gets guidance on completeness and quality, then exports PDF or Word. Success = a user goes from empty to a polished, exported resume in minutes without design or ATS knowledge.

## Positioning

The preview is the printed document: what you see on screen is exactly what goes to paper, at A4/Letter, across 10 curated designs. The differentiator is the combination of a truthful live page, ATS-safe output by default, and built-in writing/health guidance — design and compliance handled, so the user only supplies content.

## Operating Context

- Single-user, client-only web app. State persists to localStorage (`resume-studio:v1`), autosaved while typing.
- Editing chrome (sidebar forms, header, panels, feedback bar) is hidden when printing/exporting PDF.
- Resume types: combination (default), functional, chronological, targeted, federal, academic, nursing + wizard-led selection.
- Sections: contact, summary, skills, experience, education, projects, certifications, languages, publications, awards, volunteer, teaching, grants, presentations, affiliations, references, portfolio.
- Outputs: PDF via browser print, Word via .docx export. Page size A4 or Letter.

## Capabilities and Constraints

- 10 templates (classic, modern-minimal, two-column, executive, creative, academic-cv, skills-based, entry-level, tech, portfolio); per-template accent palette, 3 font pairings, comfortable/compact density, ATS-safe mode, citation format (APA/MLA/Chicago) for publications.
- Health checks score the resume (runHealthChecks + computeScore) and show issues; "Tailor to a job" rewrites bullets against a pasted job description.
- Must remain working: all 17 sections render, ATS-safe stacking (data-ats), print/PDF single-page correctness, DOCX export, autosave/migrations, `?template=` dev hook.
- No backend, no accounts, no telemetry. One page, left editor + right live preview.
- Undecided: no confirmed brand guidelines, logo system, or external assets beyond the in-app name "Resume Studio".

## Brand Commitments

- Name shown in app: "Resume Studio".
- The resume output pages must stay ATS-safe and print-faithful; this is a binding constraint, not aesthetic freedom.
- No other confirmed identity commitments. No user-provided testimonials, logos, or proof assets exist.

## Evidence on Hand

- The incumbent implementation (src/components, src/templates, src/lib) is the working evidence of capability and current behavior; both editor and templates are confirmed for redesign.
- No real user content, testimonials, or brand assets on hand — none to cite, none to fabricate.

## Product Principles

1. The preview is the truth: screen fidelity equals printed/exported fidelity.
2. Guidance over gatekeeping: health and writing feedback inform but never block.
3. ATS-safety and compliance are defaults, not options the user must discover.
4. Speed to export: content-first, fewest steps from open to a finished file.
5. One design system across editor and output: the redesign of the app and the templates reads as a single, coherent brand.
