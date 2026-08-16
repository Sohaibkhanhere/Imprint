import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode, type Dispatch } from "react";
import type { Contact, ListSectionKey, Resume, ResumeTypeKey, SectionKey, ThemeConfig, ID, VisibilityKey } from "../lib/types";
import { defaultSectionOrder, defaultVisibility, INDUSTRY_SECTIONS, type IndustryKey } from "../lib/resumeTypes";
import { saveResume, loadResume, hydrateResume } from "../lib/storage";
import { createBlankResume } from "../lib/sampleData";
import { uid } from "../lib/date";

type Patch = Partial<Resume>;

export type StoreAction =
  | { type: "PATCH"; patch: Patch }
  | { type: "SET_CONTACT"; contact: Contact }
  | { type: "SET_SECTION"; key: Exclude<ListSectionKey, "skills">; items: unknown[] }
  | { type: "ADD_ITEM"; key: ListSectionKey; item?: unknown }
  | { type: "UPDATE_ITEM"; key: ListSectionKey; id: ID; patch: Record<string, unknown> }
  | { type: "REMOVE_ITEM"; key: ListSectionKey; id: ID }
  | { type: "MOVE_ITEM"; key: ListSectionKey; id: ID; dir: -1 | 1 }
  | { type: "SET_SKILLS"; groups: Resume["skills"] }
  | { type: "SET_VISIBILITY"; key: VisibilityKey; visible: boolean }
  | { type: "SET_ORDER"; order: SectionKey[] }
  | { type: "SET_THEME"; theme: Partial<ThemeConfig> }
  | { type: "SET_TYPE"; value: ResumeTypeKey }
  | { type: "APPLY_INDUSTRY"; value: IndustryKey }
  | { type: "LOAD"; resume: Resume }
  | { type: "RESET_BLANK" };

function newListEntry(key: ListSectionKey): unknown {
  const id = uid();
  switch (key) {
    case "experience":
      return { id, company: "", role: "", location: "", startDate: "", endDate: "", present: false, descriptor: "", bullets: [""] };
    case "education":
      return { id, institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "", honors: "", coursework: "", thesis: "" };
    case "projects":
      return { id, name: "", description: "", tech: "", link: "" };
    case "certifications":
      return { id, name: "", issuer: "", year: "", expires: "" };
    case "languages":
      return { id, name: "", level: "Native" };
    case "volunteer":
      return { id, title: "", org: "", location: "", startDate: "", endDate: "", present: false, bullets: [""] };
    case "publications":
      return { id, title: "", venue: "", year: "", authors: "", url: "" };
    case "awards":
      return { id, title: "", org: "", year: "" };
    case "teaching":
      return { id, role: "", institution: "", course: "", location: "", startDate: "", endDate: "", bullets: [""] };
    case "grants":
      return { id, name: "", funder: "", amount: "", year: "", description: "" };
    case "presentations":
      return { id, title: "", event: "", year: "", location: "" };
    case "affiliations":
      return { id, name: "", role: "", years: "" };
    case "references":
      return { id, name: "", title: "", org: "", email: "", phone: "" };
    case "extras":
      return { id, label: "", value: "" };
    default:
      return { id };
  }
}

function applyType(state: Resume, type: ResumeTypeKey): Resume {
  return {
    ...state,
    meta: { ...state.meta, type },
    sectionOrder: defaultSectionOrder(type),
    visibility: defaultVisibility(type),
  };
}

function reducer(state: Resume, action: StoreAction): Resume {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.patch };
    case "SET_CONTACT":
      return { ...state, contact: action.contact };
    case "SET_SECTION":
      return { ...state, [action.key]: action.items } as Resume;
    case "SET_SKILLS":
      return { ...state, skills: action.groups };
    case "SET_VISIBILITY":
      return { ...state, visibility: { ...state.visibility, [action.key]: action.visible } };
    case "SET_ORDER":
      return { ...state, sectionOrder: action.order };
    case "SET_THEME":
      return { ...state, theme: { ...state.theme, ...action.theme } };
    case "SET_TYPE":
      return applyType(state, action.value);
    case "APPLY_INDUSTRY": {
      const keys = INDUSTRY_SECTIONS[action.value];
      return {
        ...state,
        meta: { ...state.meta, industry: action.value },
        visibility: keys.reduce<Resume["visibility"]>(
          (acc, k) => ({ ...acc, [k]: true }),
          state.visibility
        ),
      };
    }
    case "ADD_ITEM":
      return {
        ...state,
        [action.key]: [...(state[action.key] as unknown[]), action.item ?? newListEntry(action.key)],
      } as Resume;
    case "UPDATE_ITEM": {
      const list = state[action.key] as { id: ID }[];
      return {
        ...state,
        [action.key]: list.map((it) => (it.id === action.id ? { ...it, ...action.patch } : it)),
      } as Resume;
    }
    case "REMOVE_ITEM": {
      const list = state[action.key] as { id: ID }[];
      return { ...state, [action.key]: list.filter((it) => it.id !== action.id) } as Resume;
    }
    case "MOVE_ITEM": {
      const list = [...(state[action.key] as { id: ID }[])];
      const idx = list.findIndex((it) => it.id === action.id);
      const to = idx + action.dir;
      if (idx < 0 || to < 0 || to >= list.length) return state;
      const [it] = list.splice(idx, 1);
      list.splice(to, 0, it);
      return { ...state, [action.key]: list } as Resume;
    }
    case "LOAD":
      return hydrateResume(action.resume);
    case "RESET_BLANK":
      return createBlankResume();
    default:
      return state;
  }
}

interface StoreShape {
  resume: Resume;
  dispatch: Dispatch<StoreAction>;
}

const StoreContext = createContext<StoreShape | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resume, dispatch] = useReducer(reducer, undefined, () => {
    return loadResume() ?? createBlankResume();
  });

  useEffect(() => {
    const t = setTimeout(() => saveResume(resume), 400);
    return () => clearTimeout(t);
  }, [resume]);

  const value = useMemo(() => ({ resume, dispatch }), [resume]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useResume(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
}
