import { useRef } from "react";
import { useResume } from "../../store/resumeStore";
import { Field, Textarea, Input } from "../ui";

export function SummaryForm() {
  const { resume, dispatch } = useResume();
  const useObj = resume.useObjective;

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-stone-600">Heading type:</span>
        <button
          type="button"
          onClick={() => dispatch({ type: "PATCH", patch: { useObjective: false } })}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${!useObj ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "PATCH", patch: { useObjective: true } })}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${useObj ? "bg-stone-900 text-stone-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
        >
          Objective
        </button>
      </div>
      <Field
        label={useObj ? "Objective (1–2 sentences)" : "Professional summary (2–4 sentences)"}
        hint={
          useObj
            ? "Framed around value to the employer — what role you seek and what you bring."
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

export function SkillsForm() {
  const { resume, dispatch } = useResume();
  const set = (groups: typeof resume.skills) => dispatch({ type: "SET_SKILLS", groups });
  const draftRef = useRef({ id: "draft-skill-group", name: "", skills: [] as string[] });
  const isEmpty = (resume.skills ?? []).length === 0;
  const groups = isEmpty ? [draftRef.current] : resume.skills;
  const updateGroup = (id: string, patch: Partial<(typeof resume.skills)[number]>) =>
    set(groups.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="grid grid-cols-1 gap-4">
      {groups.map((g) => (
        <div key={g.id} className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Group name">
              <Input value={g.name} onChange={(e) => updateGroup(g.id, { name: e.target.value })} placeholder="Technical Skills" />
            </Field>
            <div className="flex items-end gap-1">
              {!isEmpty ? (
                <button type="button" onClick={() => set(groups.filter((x) => x.id !== g.id))} className="mb-0.5 rounded-md p-2 text-stone-400 transition hover:bg-amber-50 hover:text-amber-700" title="Remove group">
                  ✕
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-1.5">
            <Label>Skills (comma-separated)</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-amber-400/50">
              {(g.skills ?? []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                  {s}
                  <button
                    type="button"
                    onClick={() => updateGroup(g.id, { skills: (g.skills ?? []).filter((_, j) => j !== i) })}
                    className="text-stone-400 hover:text-amber-700"
                    aria-label="Remove skill"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-stone-500"
                placeholder={(g.skills ?? []).length ? "Add skill…" : "Type a skill and press Enter"}
                onKeyDown={(e) => {
                  const el = e.currentTarget;
                  if (e.key === "Enter" && el.value.trim()) {
                    e.preventDefault();
                    updateGroup(g.id, { skills: [...(g.skills ?? []), el.value.trim()] });
                    el.value = "";
                  }
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set([...groups, { id: `g${Date.now()}`, name: "", skills: [] }])}
          className="rounded-sm border border-dashed border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
        >
          + Add group
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-stone-600">{children}</span>;
}
