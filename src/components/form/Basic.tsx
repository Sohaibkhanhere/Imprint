import { useRef } from "react";
import { useResume } from "../../store/resumeStore";
import { Field, Textarea, Input } from "../ui";
import { uid } from "../../lib/date";
import { flattenSkillLabels, groupsLookLikeItemList } from "../../lib/skillsDisplay";
import type { SkillGroup } from "../../lib/types";

export function SummaryForm() {
  const { resume, dispatch } = useResume();
  const useObj = resume.useObjective;

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="inline-flex rounded-md border border-stone-200 bg-stone-100 p-0.5">
        <button
          type="button"
          onClick={() => dispatch({ type: "PATCH", patch: { useObjective: false } })}
          className={`rounded-[5px] px-3 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${!useObj ? "bg-amber-500 text-stone-100 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "PATCH", patch: { useObjective: true } })}
          className={`rounded-[5px] px-3 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${useObj ? "bg-amber-500 text-stone-100 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
        >
          Objective
        </button>
      </div>
      <Field
        label={useObj ? "Objective (1–2 sentences)" : "Professional summary (2–4 sentences)"}
        hint={
          useObj
            ? "Framed around value to the employer: what role you seek and what you bring."
            : "Who you are professionally, years of experience, top 2–3 strengths, one standout result."
        }
      >
        <Textarea
          rows={3}
          value={useObj ? resume.objective : resume.summary}
          onChange={(e) => dispatch({ type: "PATCH", patch: useObj ? { objective: e.target.value } : { summary: e.target.value } })}
          placeholder={useObj ? "Seeking a Product Marketing role where I can apply…" : "Marketing manager with 8+ years of experience…"}
        />
      </Field>
    </div>
  );
}

export function PortfolioForm() {
  const { resume, dispatch } = useResume();
  return (
    <div className="grid grid-cols-1 gap-3">
      <Field label="Primary portfolio URL" hint="Shown prominently near the top in creative templates">
        <Input value={resume.contact.portfolioUrl} onChange={(e) => dispatch({ type: "SET_CONTACT", contact: { ...resume.contact, portfolioUrl: e.target.value } })} placeholder="behance.net/you or yoursite.com/work" />
      </Field>
    </div>
  );
}

function splitSkillTokens(raw: string): string[] {
  return raw
    .split(/[,;\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeSkills(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((s) => s.toLowerCase()));
  const next = [...existing];
  for (const s of incoming) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(s);
  }
  return next;
}

function SkillChipInput({
  skills,
  onChange,
  placeholder,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder: string;
}) {
  const add = (raw: string) => {
    const tokens = splitSkillTokens(raw);
    if (!tokens.length) return false;
    onChange(mergeSkills(skills, tokens));
    return true;
  };

  return (
    <div className="skill-chip-box">
      {skills.map((s, i) => (
        <span key={`${s}-${i}`} className="skill-chip">
          {s}
          <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(skills.filter((_, j) => j !== i))}>
            ✕
          </button>
        </span>
      ))}
      <input
        className="skill-chip-input"
        placeholder={skills.length ? "Add another" : placeholder}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if ((e.key === "Enter" || e.key === ",") && el.value.trim()) {
            e.preventDefault();
            if (add(el.value)) el.value = "";
          } else if (e.key === "Backspace" && !el.value && skills.length) {
            onChange(skills.slice(0, -1));
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (/[,;\n|]/.test(text)) {
            e.preventDefault();
            add(text);
          }
        }}
        onBlur={(e) => {
          if (e.currentTarget.value.trim() && add(e.currentTarget.value)) e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function SkillsForm() {
  const { resume, dispatch } = useResume();
  const set = (groups: SkillGroup[]) => dispatch({ type: "SET_SKILLS", groups });
  const stored = resume.skills ?? [];
  const flatList = groupsLookLikeItemList(stored);
  const draftRef = useRef<SkillGroup>({ id: "draft-skill-group", name: "", skills: [] });
  const groups: SkillGroup[] = stored.length === 0
    ? [draftRef.current]
    : flatList
      ? [{ id: stored[0]?.id || "skills", name: "", skills: flattenSkillLabels(stored) }]
      : stored;

  const commit = (next: SkillGroup[]) => {
    set(next.filter((g) => (g.name || "").trim() || (g.skills ?? []).some((s) => (s || "").trim())));
  };

  const updateGroup = (id: string, patch: Partial<SkillGroup>) =>
    commit(groups.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const grouped = groups.length > 1 || groups.some((g) => (g.name || "").trim() && !/^skills?$/i.test(g.name));

  return (
    <div className="grid grid-cols-1 gap-3">
      <p className="contents-hint" style={{ marginBottom: 0 }}>
        Add skill names only, like attachments. Type a name and press Enter or comma. No Expert or Strong.
      </p>
      {groups.map((g) => (
        <div key={g.id} className={grouped ? "desk-card desk-enter contents-skills" : "desk-card desk-enter p-2.5"}>
          {grouped ? (
            <Input
              value={g.name}
              onChange={(e) => updateGroup(g.id, { name: e.target.value })}
              placeholder="Category, optional"
              aria-label="Skill category"
            />
          ) : null}
          <SkillChipInput
            skills={g.skills ?? []}
            onChange={(skills) => updateGroup(g.id, { skills })}
            placeholder="Project Management, Excel, Power BI"
          />
          {grouped && stored.length > 0 ? (
            <button
              type="button"
              onClick={() => commit(groups.filter((x) => x.id !== g.id))}
              className="rounded-md p-2 text-stone-400 transition hover:bg-amber-50 hover:text-amber-700"
              title="Remove category"
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => commit([...groups, { id: uid(), name: grouped ? "" : "Tools", skills: [] }])}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 transition-[border-color,color,transform] duration-150 hover:border-stone-900 hover:text-stone-900 active:scale-[0.99]"
        >
          {grouped ? "+ Add category" : "+ Group into categories"}
        </button>
      </div>
    </div>
  );
}
