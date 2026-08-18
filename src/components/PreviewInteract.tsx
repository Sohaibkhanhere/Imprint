import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, GripVertical, Pencil } from "lucide-react";
import { useResume } from "../store/resumeStore";
import type { ID, ListSectionKey, SectionKey } from "../lib/types";

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

const GRIP = 20;
const DRAG_THRESHOLD = 5;

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

function blockLabel(hit: Hit) {
  if (hit.kind === "entry") return ENTRY_LABEL[hit.section] ?? "Entry";
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
  const dragOrigin = useRef<{ x: number; y: number; hit: Hit } | null>(null);
  const dragged = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const hitsRef = useRef(hits);
  const editRef = useRef(edit);
  const draftRef = useRef(draft);
  const resumeRef = useRef(resume);
  const listeners = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);
  dragRef.current = drag;
  hitsRef.current = hits;
  editRef.current = edit;
  draftRef.current = draft;
  resumeRef.current = resume;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let timer = 0;
    let raf = 0;
    const measure = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
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
    if (state.kind === "section") {
      dispatch({ type: "SET_ORDER", order: moveKey(live.sectionOrder, state.section, state.before as SectionKey | null) });
      return;
    }
    if (!state.entryId || !isListKey(state.section)) return;
    const key = state.section;
    const list = (live[key] as { id: ID }[]) ?? [];
    dispatch({ type: "SET_SECTION", key: key as Exclude<ListSectionKey, "skills">, items: moveItem(list, state.entryId, state.before) });
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
    if (hit.kind === "entry" && hit.entryId) {
      setDrag({
        kind: "entry",
        section: hit.section,
        entryId: hit.entryId,
        before: insertBeforeEntry(list, hit.section, hit.entryId, y),
      });
      return;
    }
    setDrag({ kind: "section", section: hit.section, before: insertBeforeSection(list, hit.section, y) });
  };

  const startDrag = (e: React.PointerEvent, hit: Hit) => {
    if (e.button !== 0 || !canDrag(hit)) return;
    e.preventDefault();
    e.stopPropagation();
    stopDragListeners();
    dragOrigin.current = { x: e.clientX, y: e.clientY, hit };
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
    const order = resume.sectionOrder.filter((k): k is Exclude<SectionKey, "contact"> => k !== "contact");
    const idx = order.indexOf(section);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= order.length) return;
    const next = [...resume.sectionOrder];
    const from = next.indexOf(section);
    const swap = next.indexOf(order[to]);
    if (from < 0 || swap < 0) return;
    [next[from], next[swap]] = [next[swap], next[from]];
    dispatch({ type: "SET_ORDER", order: next });
  };

  const nudgeEntry = (section: SectionKey, id: ID, dir: -1 | 1) => {
    if (!isListKey(section)) return;
    const list = [...((resume[section] as { id: ID }[]) ?? [])];
    const idx = list.findIndex((i) => i.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= list.length) return;
    [list[idx], list[to]] = [list[to], list[idx]];
    dispatch({ type: "SET_SECTION", key: section as Exclude<ListSectionKey, "skills">, items: list });
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
    if (!edit) return;
    const onDown = (e: PointerEvent) => {
      const node = e.target as Element | null;
      if (node?.closest?.(".preview-edit-pop")) return;
      commitEdit();
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [edit]);

  useEffect(() => () => stopDragListeners(), []);

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
  const showToolbar = Boolean((hover || selected || pinBar) && glow && canDrag(glow) && !edit && !drag);
  const barStyle: CSSProperties | undefined =
    showToolbar && glow && barHost
      ? { left: barHost.left + glow.left * sx, top: Math.max(8, barHost.top + glow.top * sy - 42) }
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
    setHover(null);
  };

  return (
    <div className={`preview-interact no-print${drag ? " is-dragging" : ""}`} onPointerLeave={leaveOverlay}>
      {glow ? (
        <div
          className={`preview-glow${drag ? " is-drag" : glow.kind === "entry" ? " is-entry" : ""}`}
          style={{ left: glow.left, top: glow.top, width: glow.width, height: glow.height }}
        />
      ) : null}

      {movables.map((hit) => (
        <button
          key={`g-${hit.id}`}
          type="button"
          className={`preview-grip${gripOn(hit) ? " is-on" : ""}${hit.kind === "entry" ? " is-entry" : ""}`}
          style={{
            left: Math.max(0, hit.left - (hit.kind === "entry" ? 2 : 8)),
            top: hit.top,
            width: GRIP,
            height: Math.max(hit.height, 28),
          }}
          title={`Move ${blockLabel(hit)}`}
          aria-label={`Move ${blockLabel(hit)}`}
          onPointerEnter={() => setHover(hit.id)}
          onPointerDown={(e) => startDrag(e, hit)}
        >
          <GripVertical size={13} strokeWidth={2.2} />
        </button>
      ))}

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
            onPointerEnter={() => setHover(hit.id)}
            onClick={() => openField(hit)}
          />
        );
      })}

      {drop ? (
        <div className="preview-drop" style={{ left: drop.left, top: drop.top, width: drop.width }}>
          <span>Move here</span>
        </div>
      ) : null}

      {barStyle && glow && typeof document !== "undefined"
        ? createPortal(
            <div
              className="preview-edit-bar no-print"
              style={barStyle}
              onPointerEnter={() => setPinBar(true)}
              onPointerLeave={() => {
                setPinBar(false);
                setHover(null);
              }}
            >
              <span className="preview-edit-name">{blockLabel(glow)}</span>
              {glow.kind === "section" ? (
                <>
                  <button type="button" title="Move up" onClick={() => nudgeSection(glow.section, -1)}>
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" title="Move down" onClick={() => nudgeSection(glow.section, 1)}>
                    <ChevronDown size={14} />
                  </button>
                </>
              ) : glow.entryId ? (
                <>
                  <button type="button" title="Move up" onClick={() => nudgeEntry(glow.section, glow.entryId!, -1)}>
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" title="Move down" onClick={() => nudgeEntry(glow.section, glow.entryId!, 1)}>
                    <ChevronDown size={14} />
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
