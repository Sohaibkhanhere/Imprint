import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Field, Input, EntryCard, AddButton, PresentToggle } from "../ui";
import { ImproveBulletDialog } from "./ImproveBullet";
import { useEntryList } from "./useEntryList";
import { uid } from "../../lib/date";
import type { ExperienceEntry, VolunteerEntry, TeachingEntry } from "../../lib/types";

function BulletList({
  bullets,
  present,
  onSet,
}: {
  bullets: string[];
  present: boolean;
  onSet: (b: string[]) => void;
}) {
  const items = bullets ?? [];
  const [improving, setImproving] = useState<number | null>(null);

  return (
    <div className="sm:col-span-2">
      <span className="mb-1.5 block text-xs font-medium text-stone-600">Achievements (3–5 recommended)</span>
      <div className="space-y-2">
        {items.map((b, i) => (
          <div key={i} className="group flex items-start gap-1">
            <textarea
              value={b ?? ""}
              onChange={(e) => onSet(items.map((x, j) => (j === i ? e.target.value : x)))}
              rows={Math.max(2, Math.min(4, (b || "").split("\n").length))}
              placeholder="Redesigned the onboarding flow, lifting 30-day retention by 22%…"
              className="min-w-0 flex-1 resize-y rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm leading-relaxed text-stone-950 placeholder:text-stone-500 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-amber-600/55 focus:ring-2 focus:ring-amber-500/25"
            />
            <div className="flex shrink-0 flex-col pt-0.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => setImproving(i)}
                title="Improve this bullet"
                className="rounded-md p-1.5 text-stone-400 transition-[color,background-color,transform] duration-150 hover:bg-stone-100 hover:text-stone-900 active:scale-95"
              >
                <Sparkles size={15} />
              </button>
              <button
                type="button"
                onClick={() => onSet(items.filter((_, j) => j !== i))}
                title="Remove bullet"
                className="rounded-md p-1.5 text-stone-400 transition-[color,background-color,transform] duration-150 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddButton label="Add bullet" onClick={() => onSet([...items, ""])} />
      {improving !== null ? (
        <ImproveBulletDialog
          bullet={items[improving] ?? ""}
          present={present}
          onApply={(text) => {
            onSet(items.map((x, j) => (j === improving ? text : x)));
            setImproving(null);
          }}
          onClose={() => setImproving(null)}
        />
      ) : null}
    </div>
  );
}

const emptyExperience = (): ExperienceEntry => ({ id: uid(), company: "", role: "", location: "", startDate: "", endDate: "", present: false, descriptor: "", bullets: [""] });
const emptyVolunteer = (): VolunteerEntry => ({ id: uid(), title: "", org: "", location: "", startDate: "", endDate: "", present: false, bullets: [""] });
const emptyTeaching = (): TeachingEntry => ({ id: uid(), role: "", institution: "", course: "", location: "", startDate: "", endDate: "", bullets: [""] });

export function ExperienceForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<ExperienceEntry>("experience", emptyExperience);

  return (
    <div className="space-y-3">
      {rendered.map((e) => (
        <EntryCard
          key={e.id}
          title={e.role || e.company}
          subtitle={e.company ? (e.company + (e.location ? " · " + e.location : "")) : undefined}
          onRemove={isEmpty ? undefined : () => remove(e.id)}
          onMoveUp={isEmpty ? undefined : () => move(e.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(e.id, 1)}
        >
          <Field wide label="Job title">
            <Input value={e.role} onChange={(ev) => update(e.id, { role: ev.target.value })} placeholder="Senior Marketing Manager" />
          </Field>
          <Field label="Company">
            <Input value={e.company} onChange={(ev) => update(e.id, { company: ev.target.value })} placeholder="Lumenly" />
          </Field>
          <Field label="Location">
            <Input value={e.location} onChange={(ev) => update(e.id, { location: ev.target.value })} placeholder="San Francisco, CA" />
          </Field>
          <Field label="Start date">
            <Input value={e.startDate} onChange={(ev) => update(e.id, { startDate: ev.target.value })} placeholder="2021" />
          </Field>
          <Field label="End date">
            <Input value={e.endDate} onChange={(ev) => update(e.id, { endDate: ev.target.value })} placeholder="2023" disabled={e.present} />
          </Field>
          <div className="sm:col-span-2">
            <PresentToggle on={e.present} onChange={(present) => update(e.id, { present })} hint="Use present tense for the current role." />
          </div>
          <Field wide label="Company descriptor (optional)" hint="Only if the company isn't well known, e.g. mid-size DTC apparel brand">
            <Input value={e.descriptor} onChange={(ev) => update(e.id, { descriptor: ev.target.value })} placeholder="B2B SaaS analytics platform" />
          </Field>
          <BulletList bullets={e.bullets ?? []} present={e.present} onSet={(bullets) => update(e.id, { bullets })} />
        </EntryCard>
      ))}
      <AddButton label="Add another role" onClick={add} />
    </div>
  );
}

export function VolunteerForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<VolunteerEntry>("volunteer", emptyVolunteer);

  return (
    <div className="space-y-3">
      {rendered.map((e) => (
        <EntryCard
          key={e.id}
          title={e.title || e.org}
          onRemove={isEmpty ? undefined : () => remove(e.id)}
          onMoveUp={isEmpty ? undefined : () => move(e.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(e.id, 1)}
        >
          <Field label="Role">
            <Input value={e.title} onChange={(ev) => update(e.id, { title: ev.target.value })} placeholder="Marketing Mentor" />
          </Field>
          <Field label="Organization">
            <Input value={e.org} onChange={(ev) => update(e.id, { org: ev.target.value })} placeholder="Women in Tech SF" />
          </Field>
          <Field label="Location">
            <Input value={e.location} onChange={(ev) => update(e.id, { location: ev.target.value })} placeholder="San Francisco, CA" />
          </Field>
          <Field label="Start">
            <Input value={e.startDate} onChange={(ev) => update(e.id, { startDate: ev.target.value })} placeholder="2022" />
          </Field>
          <Field label="End">
            <Input value={e.endDate} onChange={(ev) => update(e.id, { endDate: ev.target.value })} placeholder="2023" disabled={e.present} />
          </Field>
          <div className="sm:col-span-2">
            <PresentToggle on={e.present} onChange={(present) => update(e.id, { present })} />
          </div>
          <BulletList bullets={e.bullets ?? []} present={e.present} onSet={(bullets) => update(e.id, { bullets })} />
        </EntryCard>
      ))}
      <AddButton label="Add another volunteer role" onClick={add} />
    </div>
  );
}

export function TeachingForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<TeachingEntry>("teaching", emptyTeaching);

  return (
    <div className="space-y-3">
      {rendered.map((e) => (
        <EntryCard
          key={e.id}
          title={e.role || e.course}
          subtitle={e.institution}
          onRemove={isEmpty ? undefined : () => remove(e.id)}
          onMoveUp={isEmpty ? undefined : () => move(e.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(e.id, 1)}
        >
          <Field label="Role">
            <Input value={e.role} onChange={(ev) => update(e.id, { role: ev.target.value })} placeholder="Teaching Assistant" />
          </Field>
          <Field label="Institution">
            <Input value={e.institution} onChange={(ev) => update(e.id, { institution: ev.target.value })} placeholder="Stanford University" />
          </Field>
          <Field label="Course">
            <Input value={e.course} onChange={(ev) => update(e.id, { course: ev.target.value })} placeholder="CS106A: Programming Methodology" />
          </Field>
          <Field label="Location">
            <Input value={e.location} onChange={(ev) => update(e.id, { location: ev.target.value })} placeholder="Stanford, CA" />
          </Field>
          <Field label="Start">
            <Input value={e.startDate} onChange={(ev) => update(e.id, { startDate: ev.target.value })} placeholder="2019" />
          </Field>
          <Field label="End">
            <Input value={e.endDate} onChange={(ev) => update(e.id, { endDate: ev.target.value })} placeholder="2021" />
          </Field>
          <BulletList bullets={e.bullets ?? []} present={false} onSet={(bullets) => update(e.id, { bullets })} />
        </EntryCard>
      ))}
      <AddButton label="Add teaching experience" onClick={add} />
    </div>
  );
}
