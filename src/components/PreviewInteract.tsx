import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, GripVertical, Pencil } from "lucide-react";
import { useResume } from "../store/resumeStore";
import type { ID, ListSectionKey, Resume, SectionKey } from "../lib/types";
import { effectiveSections } from "../templates/shared";

export const PREVIEW_FOCUS_EVENT = "rs:focus-section";

const LIST_KEYS = new Set<string>([
  "experience",
  "education",
  "projects",
  "certifications",
  "languages",
  "volunteer",
  "publications",
  "awards",
  "teaching",
  "grants",
  "presentations",
  "affiliations",
  "references",
  "extras",
]);

const SECTION_LABEL: Record<string, string> = {
  contact: "Header",
  summary: "Summary",
  objective: "Objective",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  volunteer: "Volunteer",
  publications: "Publications",
  awards: "Awards",
  teaching: "Teaching",
  grants: "Grants",
  presentations: "Talks",
  affiliations: "Affiliations",
  references: "References",
  portfolio: "Portfolio",
  extras: "Details",
};

const ENTRY_LABEL: Record<string, string> = {
  experience: "Job",
  education: "School",
  projects: "Project",
  certifications: "Certificate",
  languages: "Language",
  volunteer: "Role",
  publications: "Paper",
  awards: "Award",
  teaching: "Course",
  grants: "Grant",
  presentations: "Talk",
  affiliations: "Affiliation",
  references: "Reference",
  extras: "Item",
};

const FIELD_LABEL: Record<string, string> = {
  fullName: "Name",
  title: "Job title",
  summary: "Summary",
  objective: "Objective",
};

const GRIP_W = 18;
const GRIP_H = 28;
const GRIP_GAP = 8;
const DRAG_THRESHOLD = 5;
const HOVER_HIDE_MS = 220;
const FLIP_MS = 200;

type FieldKey = "fullName" | "title" | "summary" | "objective";

type Hit = {
  id: string;
  kind: "section" | "entry" | "field";
  section: SectionKey;
  entryId?: ID;
  field?: FieldKey;
  left: number;
  top: number;
  width: number;
  height: number;
};

type DragState = {
  kind: "section" | "entry";
  section: SectionKey;
  entryId?: ID;
  before: string | null;
  y: number;
  left: number;
  width: number;
  height: number;
  grab: number;
};

function isSectionKey(v: string): v is SectionKey {
  return v in SECTION_LABEL;
}

function isListKey(v: string): v is ListSectionKey {
  return LIST_KEYS.has(v);
}

export function focusContentsSection(key: SectionKey) {
  window.dispatchEvent(new CustomEvent(PREVIEW_FOCUS_EVENT, { detail: key }));
}

function relRect(el: Element, host: HTMLElement) {
  const r = el.getBoundingClientRect();
  const origin = host.getBoundingClientRect();
  const sx = origin.width / Math.max(1, host.offsetWidth);
  const sy = origin.height / Math.max(1, host.offsetHeight);
  return {
    left: (r.left - origin.left) / sx,
    top: (r.top - origin.top) / sy,
    width: r.width / sx,
    height: r.height / sy,
  };
}

function collectHits(host: HTMLElement): Hit[] {
  const roots = [...host.querySelectorAll<HTMLElement>(".resume-sheet:not(.resume-sheet-measure)")];
  if (!roots.length) return [];
  const hits: Hit[] = [];
  const push = (hit: Hit) => {
    if (hit.width < 8 || hit.height < 8) return;
    hits.push(hit);
  };

  for (const root of roots) {
    for (const el of root.querySelectorAll<HTMLElement>("[data-rs-section]")) {
      const section = el.getAttribute("data-rs-section") || "";
      if (!isSectionKey(section)) continue;
      push({ id: `s-${section}-${hits.length}`, kind: "section", section, ...relRect(el, host) });
    }
    for (const el of root.querySelectorAll<HTMLElement>("header:not([data-rs-section])")) {
      push({ id: `s-contact-${hits.length}`, kind: "section", section: "contact", ...relRect(el, host) });
    }
    for (const el of root.querySelectorAll<HTMLElement>("[data-rs-entry]")) {
      const entryId = el.getAttribute("data-rs-entry") || "";
      const sectionAttr = el.closest("[data-rs-section]")?.getAttribute("data-rs-section") || "";
      if (!entryId || !isSectionKey(sectionAttr) || !isListKey(sectionAttr)) continue;
      push({ id: `e-${entryId}-${hits.length}`, kind: "entry", section: sectionAttr, entryId, ...relRect(el, host) });
    }
    for (const el of root.querySelectorAll<HTMLElement>("[data-rs-field]")) {
      const field = el.getAttribute("data-rs-field") as FieldKey | null;
      const sectionAttr = el.closest("[data-rs-section]")?.getAttribute("data-rs-section") || "contact";
      if (!field) continue;
      const section = isSectionKey(sectionAttr) ? sectionAttr : "contact";
      push({ id: `f-${field}-${hits.length}`, kind: "field", section, field, ...relRect(el, host) });
    }
    for (const el of root.querySelectorAll<HTMLElement>("h1:not([data-rs-field])")) {
      push({ id: `f-name-${hits.length}`, kind: "field", section: "contact", field: "fullName", ...relRect(el, host) });
    }
  }
  return hits;
}

function moveKey(order: SectionKey[], key: SectionKey, before: SectionKey | null): SectionKey[] {
  if (key === "contact") return order;
  const next = order.filter((k) => k !== key);
  const at = before ? next.indexOf(before) : next.length;
  if (at < 0) next.push(key);
  else next.splice(at, 0, key);
  return next;
}

function moveItem<T extends { id: ID }>(list: T[], id: ID, beforeId: ID | null): T[] {
  const next = [...list];
  const from = next.findIndex((i) => i.id === id);
  if (from < 0) return list;
  const [item] = next.splice(from, 1);
  if (!beforeId) {
    next.push(item);
    return next;
  }
  const to = next.findIndex((i) => i.id === beforeId);
  if (to < 0) next.push(item);
  else next.splice(to, 0, item);
  return next;
}

function fieldValue(resume: ReturnType<typeof useResume>["resume"], field: FieldKey): string {
  if (field === "fullName") return resume.contact.fullName ?? "";
  if (field === "title") return resume.contact.title ?? "";
  if (field === "objective") return resume.objective ?? "";
  return resume.summary ?? "";
}

function canDrag(hit: Hit) {
  if (hit.kind === "field") return false;
  if (hit.kind === "section" && hit.section === "contact") return false;
  return true;
}

function gripBox(hit: Hit) {
  return {
    left: Math.max(2, hit.left - GRIP_W - GRIP_GAP),
    top: hit.top + 3,
    width: GRIP_W,
    height: GRIP_H,
  };
}

function visibleOrder(resume: ReturnType<typeof useResume>["resume"]): SectionKey[] {
  return (effectiveSections(resume) as SectionKey[]).filter((k) => k !== "contact");
}

function insertBeforeSection(hits: Hit[], dragged: SectionKey, y: number): SectionKey | null {
  const others = hits
    .filter((h) => h.kind === "section" && h.section !== "contact" && h.section !== dragged)
    .sort((a, b) => a.top - b.top);
  const target = others.find((h) => y < h.top + h.height / 2);
  return target ? target.section : null;
}

function insertBeforeEntry(hits: Hit[], section: SectionKey, draggedId: ID, y: number): ID | null {
  const others = hits
    .filter((h) => h.kind === "entry" && h.section === section && h.entryId !== draggedId)
    .sort((a, b) => a.top - b.top);
  const target = others.find((h) => y < h.top + h.height / 2);
  return target?.entryId ?? null;
}

function dropLine(hits: Hit[], drag: DragState): { left: number; top: number; width: number } | null {
  if (drag.kind === "section") {
    const others = hits
      .filter((h) => h.kind === "section" && h.section !== "contact" && h.section !== drag.section)
      .sort((a, b) => a.top - b.top);
    const target = drag.before ? others.find((h) => h.section === drag.before) : null;
    if (target) return { left: target.left, top: target.top, width: target.width };
    const last = others[others.length - 1];
    return last ? { left: last.left, top: last.top + last.height, width: last.width } : null;
  }
  const others = hits
    .filter((h) => h.kind === "entry" && h.section === drag.section && h.entryId !== drag.entryId)
    .sort((a, b) => a.top - b.top);
  const target = drag.before ? others.find((h) => h.entryId === drag.before) : null;
  if (target) return { left: target.left, top: target.top, width: target.width };
  const last = others[others.length - 1];
  return last ? { left: last.left, top: last.top + last.height, width: last.width } : null;
}

function pickText(...parts: (string | undefined)[]) {
  for (const p of parts) {
    const s = (p || "").trim();
    if (s) return s;
  }
  return "";
}

function entryTitle(resume: Resume, section: SectionKey, entryId?: ID): string {
  const fallback = ENTRY_LABEL[section] ?? "Entry";
  if (!entryId || !isListKey(section)) return fallback;
  const list = (resume[section] as { id: ID }[] | undefined) ?? [];
  const item = list.find((i) => i.id === entryId) as Record<string, string> | undefined;
  if (!item) return fallback;
  switch (section) {
    case "experience":
      return pickText(item.role, item.company) || fallback;
    case "education": {
      const deg = [item.degree, item.field].filter((x) => (x || "").trim()).join(", ");
      return pickText(deg, item.institution) || fallback;
    }
    case "projects":
    case "certifications":
    case "languages":
    case "affiliations":
    case "references":
      return pickText(item.name) || fallback;
    case "volunteer":
      return pickText(item.title, item.org) || fallback;
    case "publications":
    case "awards":
    case "presentations":
      return pickText(item.title) || fallback;
    case "teaching":
      return pickText(item.course, item.role) || fallback;
    case "grants":
      return pickText(item.name) || fallback;
    case "extras":
      return pickText(item.label) || fallback;
    default:
      return fallback;
  }
}

function blockLabel(hit: Hit, resume: Resume) {
  if (hit.kind === "entry") return entryTitle(resume, hit.section, hit.entryId);
  return SECTION_LABEL[hit.section] ?? "Section";
}

export function PreviewInteract({ hostRef }: { hostRef: React.RefObject<HTMLDivElement | null> }) {
  const { resume, dispatch } = useResume();
  const [hits, setHits] = useState<Hit[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pinBar, setPinBar] = useState(false);
  const [edit, setEdit] = useState<{ field: FieldKey; hit: Hit } | null>(null);
  const [draft, setDraft] = useState("");
  const dragOrigin = useRef<{ x: number; y: number; hit: Hit; grab: number } | null>(null);
  const dragged = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const hitsRef = useRef(hits);
  const editRef = useRef(edit);
  const draftRef = useRef(draft);
  const resumeRef = useRef(resume);
  const flipFrom = useRef<Map<string, number> | null>(null);
  const flipKind = useRef<"section" | "entry" | null>(null);
  const flipLock = useRef(false);
  const hideTimer = useRef(0);
  const pinBarRef = useRef(false);
  const [flipTick, setFlipTick] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const listeners = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);
  dragRef.current = drag;
  hitsRef.current = hits;
  editRef.current = edit;
  draftRef.current = draft;
  resumeRef.current = resume;
  pinBarRef.current = pinBar;

  const keepHover = (id: string | null) => {
    window.clearTimeout(hideTimer.current);
    setHover(id);
  };

  const scheduleHideHover = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (pinBarRef.current || dragRef.current) return;
      setHover(null);
    }, HOVER_HIDE_MS);
  };

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let timer = 0;
    let raf = 0;
    const measure = () => {
      if (flipLock.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (flipLock.current) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setHits(collectHits(host)));
      }, 32);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const mo = new MutationObserver(measure);
    for (const sheet of host.querySelectorAll(".resume-sheet")) {
      ro.observe(sheet);
      mo.observe(sheet, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [hostRef, resume.theme.template, resume.theme.pageSize, resume.theme.maxPages]);

  useLayoutEffect(() => {
    const first = flipFrom.current;
    const kind = flipKind.current;
    if (!first || !kind) return;
    flipFrom.current = null;
    flipKind.current = null;
    const host = hostRef.current;
    if (!host) return;
    const sel = kind === "entry" ? "[data-rs-entry]" : "[data-rs-section]";
    const root = host.querySelectorAll<HTMLElement>(".resume-sheet:not(.resume-sheet-measure)");
    const anims: Animation[] = [];
    flipLock.current = true;
    setFlipping(true);
    for (const sheet of root) {
      for (const node of sheet.querySelectorAll<HTMLElement>(sel)) {
        const raw = kind === "entry" ? node.getAttribute("data-rs-entry") : node.getAttribute("data-rs-section");
        if (!raw) continue;
        const key = kind === "entry" ? `e:${raw}` : `s:${raw}`;
        const prevTop = first.get(key);
        if (prevTop == null) continue;
        const dy = prevTop - node.getBoundingClientRect().top;
        if (Math.abs(dy) < 2) continue;
        node.getAnimations().forEach((a) => a.cancel());
        anims.push(
          node.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0px)" }], {
            duration: FLIP_MS,
            easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          }),
        );
      }
    }
    const unlock = () => {
      flipLock.current = false;
      setFlipping(false);
      setHits(collectHits(host));
    };
    if (!anims.length) {
      unlock();
      return;
    }
    void Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(unlock);
  }, [flipTick, hostRef]);

  const captureFlip = (kind: "section" | "entry") => {
    const host = hostRef.current;
    if (!host) return;
    const map = new Map<string, number>();
    const sel = kind === "entry" ? "[data-rs-entry]" : "[data-rs-section]";
    for (const sheet of host.querySelectorAll<HTMLElement>(".resume-sheet:not(.resume-sheet-measure)")) {
      for (const node of sheet.querySelectorAll<HTMLElement>(sel)) {
        const raw = kind === "entry" ? node.getAttribute("data-rs-entry") : node.getAttribute("data-rs-section");
        if (!raw) continue;
        map.set(kind === "entry" ? `e:${raw}` : `s:${raw}`, node.getBoundingClientRect().top);
      }
    }
    flipFrom.current = map;
    flipKind.current = kind;
  };
  const hostEl = hostRef.current;
  const barHost = hostEl?.getBoundingClientRect();
  const sx = barHost && hostEl ? barHost.width / Math.max(1, hostEl.offsetWidth) : 1;
  const sy = barHost && hostEl ? barHost.height / Math.max(1, hostEl.offsetHeight) : 1;

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const r = host.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / (r.width / Math.max(1, host.offsetWidth)),
      y: (e.clientY - r.top) / (r.height / Math.max(1, host.offsetHeight)),
    };
  };

  const commitEdit = () => {
    const current = editRef.current;
    if (!current) return;
    const value = draftRef.current;
    const live = resumeRef.current;
    if (current.field === "fullName") dispatch({ type: "SET_CONTACT", contact: { ...live.contact, fullName: value } });
    else if (current.field === "title") dispatch({ type: "SET_CONTACT", contact: { ...live.contact, title: value } });
    else if (current.field === "objective") dispatch({ type: "PATCH", patch: { objective: value } });
    else dispatch({ type: "PATCH", patch: { summary: value } });
    setEdit(null);
  };

  const applyDrop = (state: DragState) => {
    const live = resumeRef.current;
    captureFlip(state.kind);
    if (state.kind === "section") {
      dispatch({ type: "SET_ORDER", order: moveKey(live.sectionOrder, state.section, state.before as SectionKey | null) });
      setFlipTick((n) => n + 1);
      return;
    }
    if (!state.entryId || !isListKey(state.section)) return;
    const key = state.section;
    const list = (live[key] as { id: ID }[]) ?? [];
    dispatch({ type: "SET_SECTION", key: key as Exclude<ListSectionKey, "skills">, items: moveItem(list, state.entryId, state.before) });
    setFlipTick((n) => n + 1);
  };

  const stopDragListeners = () => {
    const pair = listeners.current;
    if (!pair) return;
    window.removeEventListener("pointermove", pair.move);
    window.removeEventListener("pointerup", pair.up);
    window.removeEventListener("pointercancel", pair.up);
    listeners.current = null;
    document.body.classList.remove("preview-is-dragging");
  };

  const endDrag = () => {
    const state = dragRef.current;
    if (state && dragged.current) applyDrop(state);
    setDrag(null);
    dragOrigin.current = null;
    dragged.current = false;
    stopDragListeners();
  };

  const onWinMove = (e: PointerEvent) => {
    const start = dragOrigin.current;
    if (!start) return;
    if (!dragged.current) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      dragged.current = true;
      document.body.classList.add("preview-is-dragging");
    }
    const list = hitsRef.current;
    const { y } = localPoint(e);
    const hit = start.hit;
    const base = {
      y,
      left: hit.left,
      width: hit.width,
      height: hit.height,
      grab: start.grab,
    };
    if (hit.kind === "entry" && hit.entryId) {
      setDrag({
        kind: "entry",
        section: hit.section,
        entryId: hit.entryId,
        before: insertBeforeEntry(list, hit.section, hit.entryId, y),
        ...base,
      });
      return;
    }
    setDrag({ kind: "section", section: hit.section, before: insertBeforeSection(list, hit.section, y), ...base });
  };

  const startDrag = (e: React.PointerEvent, hit: Hit) => {
    if (e.button !== 0 || !canDrag(hit)) return;
    e.preventDefault();
    e.stopPropagation();
    stopDragListeners();
    dragOrigin.current = { x: e.clientX, y: e.clientY, hit, grab: localPoint(e).y - hit.top };
    dragged.current = false;
    setSelected(hit.id);
    setEdit(null);
    const pair = { move: onWinMove, up: endDrag };
    listeners.current = pair;
    window.addEventListener("pointermove", pair.move);
    window.addEventListener("pointerup", pair.up);
    window.addEventListener("pointercancel", pair.up);
  };

  const openField = (hit: Hit) => {
    if (!hit.field) return;
    setSelected(hit.id);
    setDraft(fieldValue(resume, hit.field));
    setEdit({ field: hit.field, hit });
  };

  const nudgeSection = (section: SectionKey, dir: -1 | 1) => {
    if (section === "contact") return;
    const order = visibleOrder(resume);
    const idx = order.indexOf(section);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= order.length) return;
    const next = [...resume.sectionOrder];
    const from = next.indexOf(section);
    const swap = next.indexOf(order[to]);
    if (from < 0 || swap < 0) return;
    captureFlip("section");
    [next[from], next[swap]] = [next[swap], next[from]];
    dispatch({ type: "SET_ORDER", order: next });
    setFlipTick((n) => n + 1);
  };

  const nudgeEntry = (section: SectionKey, id: ID, dir: -1 | 1) => {
    if (!isListKey(section)) return;
    const list = [...((resume[section] as { id: ID }[]) ?? [])];
    const idx = list.findIndex((i) => i.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= list.length) return;
    captureFlip("entry");
    [list[idx], list[to]] = [list[to], list[idx]];
    dispatch({ type: "SET_SECTION", key: section as Exclude<ListSectionKey, "skills">, items: list });
    setFlipTick((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setEdit(null);
      setSelected(null);
      setDrag(null);
      dragOrigin.current = null;
      dragged.current = false;
      stopDragListeners();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (dragRef.current) return;
      const node = e.target as Element | null;
      if (node?.closest?.(".preview-grip, .preview-field, .preview-edit-bar, .preview-edit-pop")) return;
      if (editRef.current) commitEdit();
      window.clearTimeout(hideTimer.current);
      setSelected(null);
      setHover(null);
      setPinBar(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => () => {
    stopDragListeners();
    window.clearTimeout(hideTimer.current);
  }, []);

  const activeId = hover || selected;
  const activeHit = hits.find((h) => h.id === activeId) ?? null;
  const glow =
    activeHit?.kind === "field"
      ? (hits.find(
          (h) =>
            h.kind === "section" &&
            h.section === activeHit.section &&
            h.top <= activeHit.top &&
            h.top + h.height >= activeHit.top,
        ) ?? activeHit)
      : activeHit;
  const drop = drag && dragged.current ? dropLine(hits, drag) : null;

  const gripOn = (hit: Hit) => {
    if (hover === hit.id || selected === hit.id) return true;
    if (!glow) return false;
    if (hit.kind === "entry") return glow.kind === "entry" && glow.entryId === hit.entryId;
    return glow.kind === "section" && glow.section === hit.section;
  };

  const movables = hits.filter((h) => canDrag(h));
  const fields = hits.filter((h) => h.kind === "field");
  const showToolbar = Boolean((hover || selected || pinBar) && glow && canDrag(glow) && !edit && !drag && !flipping);
  const barStyle: CSSProperties | undefined =
    showToolbar && glow && barHost
      ? { left: barHost.left + glow.left * sx, top: Math.max(8, barHost.top + glow.top * sy - 40) }
      : undefined;
  const popStyle: CSSProperties | undefined =
    edit && barHost
      ? {
          left: Math.min(barHost.left + edit.hit.left * sx, window.innerWidth - 336),
          top: barHost.top + (edit.hit.top + edit.hit.height) * sy + 8,
          width: Math.max(280, Math.min(edit.hit.width * sx, 440)),
          transformOrigin: "top left",
        }
      : undefined;

  const leaveOverlay = (e: React.PointerEvent) => {
    if (drag) return;
    const to = e.relatedTarget as Element | null;
    if (to?.closest?.(".preview-edit-bar, .preview-edit-pop")) return;
    scheduleHideHover();
  };

  const sections = visibleOrder(resume);
  const sectionIdx = glow ? sections.indexOf(glow.section) : -1;
  const entryList =
    glow?.kind === "entry" && isListKey(glow.section) ? ((resume[glow.section] as { id: ID }[]) ?? []) : [];
  const entryIdx = glow?.entryId ? entryList.findIndex((i) => i.id === glow.entryId) : -1;

  return (
    <div className={`preview-interact no-print${drag ? " is-dragging" : ""}${flipping ? " is-flipping" : ""}`} onPointerLeave={leaveOverlay}>
      {glow && !flipping ? (
        <div
          className={`preview-glow${drag ? " is-drag" : glow.kind === "entry" ? " is-entry" : ""}`}
          style={{ left: glow.left, top: glow.top, width: glow.width, height: glow.height }}
        />
      ) : null}

      {movables.map((hit) => {
        const box = gripBox(hit);
        return (
        <button
          key={`g-${hit.id}`}
          type="button"
          className={`preview-grip${gripOn(hit) ? " is-on" : ""}${hit.kind === "entry" ? " is-entry" : ""}`}
          style={box}
          title={`Move ${blockLabel(hit, resume)}`}
          aria-label={`Move ${blockLabel(hit, resume)}`}
          onPointerEnter={() => keepHover(hit.id)}
          onPointerDown={(e) => startDrag(e, hit)}
        >
          <GripVertical size={13} strokeWidth={2.2} />
        </button>
        );
      })}

      {fields.map((hit) => {
        const inset = hit.section === "contact" ? 0 : 16;
        return (
          <button
            key={hit.id}
            type="button"
            className={`preview-field${hover === hit.id || edit?.hit.id === hit.id ? " is-on" : ""}`}
            style={{
              left: hit.left + inset,
              top: hit.top,
              width: Math.max(24, hit.width - inset),
              height: Math.max(hit.height, 18),
            }}
            title={`Edit ${FIELD_LABEL[hit.field ?? ""] ?? "text"}`}
            aria-label={`Edit ${FIELD_LABEL[hit.field ?? ""] ?? "text"}`}
            onPointerEnter={() => keepHover(hit.id)}
            onClick={() => openField(hit)}
          />
        );
      })}

      {drop ? (
        <div className="preview-drop" style={{ left: drop.left, top: drop.top, width: drop.width }}>
          <span>Move here</span>
        </div>
      ) : null}

      {drag && dragged.current ? (
        <div
          className="preview-ghost"
          style={{
            width: drag.width,
            height: Math.min(drag.height, 96),
            transform: `translate3d(${drag.left}px, ${Math.max(0, drag.y - drag.grab)}px, 0)`,
          }}
        >
          <span>{drag.kind === "entry" ? entryTitle(resume, drag.section, drag.entryId) : SECTION_LABEL[drag.section] ?? "Section"}</span>
        </div>
      ) : null}

      {barStyle && glow && typeof document !== "undefined"
        ? createPortal(
            <div
              className="preview-edit-bar no-print"
              style={barStyle}
              onPointerEnter={() => {
                window.clearTimeout(hideTimer.current);
                setPinBar(true);
              }}
              onPointerLeave={() => {
                setPinBar(false);
                scheduleHideHover();
              }}
            >
              <span className="preview-edit-name">{blockLabel(glow, resume)}</span>
              {glow.kind === "section" ? (
                <>
                  <button type="button" className="preview-edit-nudge" title="Move up" disabled={sectionIdx <= 0} onClick={() => nudgeSection(glow.section, -1)}>
                    <ArrowUp size={14} strokeWidth={2.4} />
                  </button>
                  <button type="button" className="preview-edit-nudge" title="Move down" disabled={sectionIdx < 0 || sectionIdx >= sections.length - 1} onClick={() => nudgeSection(glow.section, 1)}>
                    <ArrowDown size={14} strokeWidth={2.4} />
                  </button>
                </>
              ) : glow.entryId ? (
                <>
                  <button type="button" className="preview-edit-nudge" title="Move up" disabled={entryIdx <= 0} onClick={() => nudgeEntry(glow.section, glow.entryId!, -1)}>
                    <ArrowUp size={14} strokeWidth={2.4} />
                  </button>
                  <button type="button" className="preview-edit-nudge" title="Move down" disabled={entryIdx < 0 || entryIdx >= entryList.length - 1} onClick={() => nudgeEntry(glow.section, glow.entryId!, 1)}>
                    <ArrowDown size={14} strokeWidth={2.4} />
                  </button>
                </>
              ) : null}
              <span className="preview-edit-rule" />
              <button type="button" className="preview-edit-go" onClick={() => focusContentsSection(glow.section)}>
                <Pencil size={12} />
                Edit in Contents
              </button>
            </div>,
            document.body,
          )
        : null}

      {popStyle && edit && typeof document !== "undefined"
        ? createPortal(
            <div className="preview-edit-pop no-print" style={popStyle} onPointerDown={(e) => e.stopPropagation()}>
              <p className="preview-edit-kicker">{FIELD_LABEL[edit.field]}</p>
              {edit.field === "summary" || edit.field === "objective" ? (
                <textarea rows={4} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
              ) : (
                <input
                  className={edit.field === "fullName" ? "is-name" : undefined}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEdit();
                    }
                  }}
                />
              )}
              <div className="preview-edit-actions">
                <button type="button" className="preview-edit-done" onClick={commitEdit}>
                  Done
                </button>
                <button type="button" className="preview-edit-cancel" onClick={() => setEdit(null)}>
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
