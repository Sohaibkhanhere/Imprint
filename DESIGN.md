---
name: Resume Studio
description: A resume builder that treats every resume as an issue and every preview as a proof sheet.
colors:
  paper-50: "#faf9f6"
  paper-100: "#f4f2ec"
  paper-200: "#e7e4dc"
  paper-300: "#d4d0c4"
  paper-400: "#a29e91"
  ink-500: "#6f6c61"
  ink-600: "#4f4d45"
  ink-700: "#3a3832"
  ink-800: "#2a2924"
  ink-900: "#1c1b17"
  vermilion-50: "#fbf0ec"
  vermilion-100: "#f6ddd6"
  vermilion-200: "#eebcb1"
  vermilion-300: "#e39385"
  vermilion-400: "#d56a58"
  vermilion-500: "#c44a3a"
  vermilion-600: "#b0302a"
  vermilion-700: "#942822"
  emerald-600: "#059669"
  emerald-700: "#047857"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontWeight: 700
    lineHeight: "1.1"
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontWeight: 600
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "10px"
    letterSpacing: "0.14em"
    fontWeight: 500
rounded:
  sm: "2px"
  md: "6px"
spacing:
  section: "20px"
  control: "8px"
  gut: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink-900}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink-800}"
  button-ghost:
    backgroundColor: "{colors.paper-50}"
    textColor: "{colors.ink-700}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  folio-label:
    typography: "{typography.label}"
    textColor: "{colors.ink-500}"
  contents-active:
    backgroundColor: "{colors.vermilion-600}"
    size: "2px"
---

# Design System: Resume Studio

## Overview

**Creative North Star: "The Small Publishing House"**

Resume Studio behaves like a tiny editorial office, not a dashboard. Every resume in progress is "the current issue"; the form is the copy desk; the preview is a proof sheet laid out on a light table; the health check reads as an editor's notes strip beneath it. The whole surface speaks the vocabulary of print — masthead, contents, folio, proof, held copy — so that building a resume feels like assembling a clean issue of a magazine.

The material is warm paper and ink, not SaaS gray. Neutrals are remapped from cool stone to a warm paper range (`#faf9f6` lightest through `#1c1b17` ink), rules and text are deep ink, and surfaces stay flat so the single lifted object — the proof sheet — carries all the depth. Hairline borders (1px), near-square corners (2px), 10px tabular section numbers, and uppercase mono folios give it the mechanical precision of a printed page.

One signal color runs the whole system: editor's vermilion, reserved strictly for the active section and anything that needs fixing. Its rarity is the point — when a section rule lights up red or an error mark appears, it means something specific. Everything else stays ink on paper, with emerald reserved for the two positive/verified states (ATS-safe, a clean sheet).

**Key Characteristics:**
- Publishing vocabulary on every surface: masthead, contents, folio, proof, held copy, editor's notes.
- Warm paper + deep ink; flat chrome; only the proof sheet is elevated.
- One vermilion signal, spent only on active and needs-fix states.
- Serif display voice (Source Serif 4) against a quiet sans body (Inter) and mono furniture (IBM Plex Mono).
- Hairline rules, near-square corners, tabular numbers — print mechanics over app chrome.

## Colors

The palette is two families: warm-paper neutrals (the paper scale, remapped from Tailwind stone) and one vermilion signal (remapped from Tailwind amber), plus a small emerald positive.

### Primary
- **Editor's Vermilion** (#b0302a; lighter #c44a3a, deeper #942822): the single accent. Used for the active section's rule in the contents sidebar, error/warning marks and the failing score in editor's notes, the masthead rule and "R" monogram, active selection highlights (chosen format, template, font pairing, density), and focus rings. Never spent on static captions or resting CTAs.

### Tertiary (positive signal)
- **Emerald** (#059669 / #047857): machine-verified states only — ATS-safe on, a clean sheet, keyword matches in the tailor report.

### Neutral
- **Warm Paper** (#faf9f6): page and panel background; app shell sits on paper-100 (#f4f2ec).
- **Paper Hairline** (#e7e4dc / #d4d0c4): borders, rules, dividers.
- **Paper Muted** (#a29e91): weakest acceptable ink on white — icon-only buttons that darken on hover.
- **Ink Muted** (#6f6c61): folio labels, secondary text, placeholders, 10–11px captions. The floor for readable static text.
- **Ink** (#1c1b17): masthead rules, headings, primary button fills, the darkest surfaces.

### Named Rules
**The One Vermilion Rule.** Vermilion exists for exactly two jobs: marking the active section and flagging something that needs a fix. It never decorates static labels, folios, or resting buttons. Primary CTAs are ink, not red.
**The Paper-Not-Gray Rule.** Neutrals are warm paper, never cool gray. If a new surface looks neutral-gray, it is off-system.

## Typography

**Display Font:** Source Serif 4 (fallback Georgia, serif)
**Body Font:** Inter (fallback ui-sans-serif, system-ui)
**Label/Mono Font:** IBM Plex Mono (fallback ui-monospace, Menlo)

**Character:** A serif editorial voice carries titles and mastheads; a quiet sans carries form copy; a mono typewriter voice carries all editorial furniture. The pairing reads like a printed magazine's headline set, body copy, and running heads.

### Hierarchy
- **Display** (Source Serif 4, 700, ~30–36px, -0.01em): issue-level headlines — wizard titles, logotype. Serif, tight tracking.
- **Headline** (Source Serif 4, 600, 15–18px): panel titles — "Editor's notes", "Tailor to a job description".
- **Title** (Inter, 600, 13–15px): form section names, card headers.
- **Body** (Inter, 400, 12–14px): form fields, descriptions, editor's notes detail. Keep to ~65ch max in prose.
- **Label** (IBM Plex Mono, 500, 10px, +0.14em, uppercase): folios ("The current issue", "Contents", "Proof", "Copy-desk review"), section numbers, score, ticks. The editorial furniture of the system.

### Named Rules
**The Folio Rule.** Editorial furniture is always mono, 10px, uppercase, 0.14em tracking — never sans, never bold serif, never sentence-case. When it is not furniture, it is not a folio.

## Layout

The editor is a two-column print shop: a fixed 400px contents sidebar on the left (the copy desk — sections as numbered contents entries with reorder/hide controls and a scroll-spy that lights the active entry's vermilion rule) and a flex light table on the right (the proof). The proof sheet is centered on a hairline registration grid (26px cell, 2% ink alpha) and scaled to fit its frame; the proof folio strips under it ("Proof · name · template · page"). Editor's notes dock below the light table. A masthead-rule row and folio line sit above the work area.

On small screens the two columns collapse into a mobile-only Copy desk / Proof sheet tab switcher (below the masthead); the sidebar becomes full-width and the proof is one tap away. The wizard and format picker open as full-issue overlays on top.

Density: comfortable default with a compact option for the sheet itself. Horizontal rhythm runs on 16px gutters; vertical rhythm on 20px section gaps and 8px control gaps. Hairlines (1px paper-300/200) divide rows, panels, and the folio strip.

## Elevation & Depth

Flat by default. All app chrome — panels, cards, sidebar, masthead — sits flat on paper with hairline borders and tonal paper layering only. The single elevated object in the system is the proof sheet, which carries a three-layer shadow to read as a physical page lifted off the light table.

### Shadow Vocabulary
- **Sheet** (`0 1px 0 rgba(28,27,23,0.08), 0 2px 6px rgba(28,27,23,0.1), 0 26px 60px -18px rgba(28,27,23,0.35)`): the proof sheet only, plus a 1px hairline outline (0.1 ink). Never on chrome.
- **Panels** (none): collapsible form sections and popover panels get a paper background and hairline border, no shadow.

## Shapes

The form language is print-mechanical: near-square corners everywhere (2px radius on buttons, inputs, selects, cards, chips, entries), hairline 1px borders (paper-300), and a single 3px ink-and-vermilion rule for the masthead. Chips are square-cornered tags. The proof sheet is a true rectangle with a 1px outline — no rounding, it is paper. Registration grids and folio rules are the recurring geometry, not decorative curves.

## Components

### Buttons
- **Shape:** near-square (2px radius), sharp and mechanical.
- **Primary:** ink fill (#1c1b17) with white text, padding 14px 24px; hover lightens to ink-800. This is the resting CTA color — "Print issue", "Build my resume", "Apply".
- **Ghost:** paper background, ink-700 text, hairline border; hover to ink-900.
- **Hover / Focus:** focus rings are vermilion (2px, 60% alpha); destructive hover states use the vermilion ramp (e.g. remove buttons hover to amber-700 on amber-50) — never Tailwind's default red.
- **Danger:** ink-700 text at rest, vermilion on hover — one red hue in the system.

### Chips / Tags
- **Style:** paper background (paper-100), ink-700 text, square corners (2px), mono 10.5px for keyword chips; dashed paper-300 border for "held copy" sections.
- **State:** selected chips use vermilion border/text or emerald for verified; hidden sections restore with a dashed chip.

### Contents Entries (signature)
- **Style:** numbered `01…nn` in mono tabular figures (paper-400), uppercase label in ink-600, hairline underline; a 2px vermilion rule appears at the left edge on the active section (scroll-spy driven). Hover shows a faint paper-300 rule.
- **Controls:** lucide chevron reorder arrows and an EyeOff "Hide" affordance at stone-500, darkening on hover.

### Inputs / Fields
- **Style:** paper background, hairline paper-300 border, ink-900 text, 2px radius, 8–12px padding.
- **Focus:** vermilion ring (2px, 40–60% alpha) plus border shift to vermilion — the active-state signal again.
- **Placeholder / hint:** ink-muted (#6f6c61), never paper-400.

### Navigation (masthead nav + mobile tabs)
- Masthead nav rubrics ("Template", "Customize", "Writing tips", "Tailor to a job") are ink-muted links that go ink-900 on hover; the open panel's rubric inverts to vermilion text on vermilion-50 (an active state). Mobile Copy desk / Proof sheet tabs use the same pattern with a vermilion underline on the active tab.

### Proof Sheet + Folio (signature)
- The sheet renders the resume at true page size on the registration-grid light table, centered, scaled to fit. The proof folio strip beneath it — mono 10px folios with hairline rules — identifies the issue (Proof · name · template · page). A page-count chip (mono, paper-500) sits at the frame's top-right, anchored to the light table.

### Editor's Notes (signature)
- A docked strip under the proof: serif "Editor's notes" title, mono "Copy-desk review" folio, and proofreading marks (✎ fix, △ review, ¶ note) in vermilion for anything needing attention, emerald "Clean sheet" when clear, and the score as a mono folio (emerald ≥80, vermilion below).

## Do's and Don'ts

### Do:
- **Do** keep vermilion to the active section, needs-fix states, masthead mark, and focus/active highlights.
- **Do** set resting primary CTAs to ink, not red.
- **Do** use mono 10px uppercase folios for all editorial furniture.
- **Do** let the proof sheet be the only elevated object; keep chrome flat on paper.
- **Do** reach for warm paper neutrals and deep ink before any gray.
- **Do** keep readable text at ink-muted (#6f6c61) or darker — placeholders, hints, and folios included.

### Don't:
- **Don't** paint static captions, labels, or ticking folio marks vermilion.
- **Don't** introduce a second red hue (Tailwind `red-*`) for destructive actions — route them through the vermilion ramp.
- **Don't** round corners past 6px on app chrome; the sheet itself stays unrounded.
- **Don't** put shadows under panels, cards, or the sidebar — depth belongs to the proof sheet.
- **Don't** replace the folio vocabulary with generic dashboard labels ("status bar", "toolbar", "preview panel").
