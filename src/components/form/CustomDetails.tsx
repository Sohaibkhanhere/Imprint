import { Plus, Trash2 } from "lucide-react";
import { Field, Input, AddButton } from "../ui";
import { useResume } from "../../store/resumeStore";
import { uid } from "../../lib/date";
import type { CustomDetail } from "../../lib/types";

const PRESETS: { label: string; placeholder: string }[] = [
  { label: "Date of Birth", placeholder: "17-04-1987" },
  { label: "Father Name", placeholder: "Full name" },
  { label: "CNIC / ID card", placeholder: "42201-1332337-9" },
  { label: "Marital Status", placeholder: "Married" },
  { label: "Nationality", placeholder: "Pakistani" },
  { label: "Religion", placeholder: "Islam" },
  { label: "Gender", placeholder: "Male" },
  { label: "Passport", placeholder: "Number" },
  { label: "Domicile", placeholder: "Karachi" },
];

function emptyDetail(label = "", value = ""): CustomDetail {
  return { id: uid(), label, value };
}

export function CustomDetailsForm() {
  const { resume, dispatch } = useResume();
  const items = resume.extras ?? [];

  const add = (item?: CustomDetail) => dispatch({ type: "ADD_ITEM", key: "extras", item: item ?? emptyDetail() });
  const update = (id: string, patch: Partial<CustomDetail>) => dispatch({ type: "UPDATE_ITEM", key: "extras", id, patch });
  const remove = (id: string) => dispatch({ type: "REMOVE_ITEM", key: "extras", id });

  const used = new Set(items.map((d) => d.label.trim().toLowerCase()).filter(Boolean));

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-stone-500">
        Optional fields for this resume. They print under Personal details after you turn the section on.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const taken = used.has(p.label.toLowerCase());
          return (
            <button
              key={p.label}
              type="button"
              disabled={taken}
              onClick={() => add(emptyDetail(p.label, ""))}
              className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900 disabled:cursor-default disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-1">
                <Plus size={11} /> {p.label}
              </span>
            </button>
          );
        })}
      </div>

      {items.map((d) => {
        const preset = PRESETS.find((p) => p.label.toLowerCase() === d.label.trim().toLowerCase());
        return (
          <div key={d.id} className="grid grid-cols-1 gap-2 rounded-md border border-stone-200 bg-stone-50/70 p-2.5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] sm:items-end">
            <Field label="Label">
              <Input value={d.label} onChange={(e) => update(d.id, { label: e.target.value })} placeholder="Blood group" />
            </Field>
            <Field label="Value">
              <Input value={d.value} onChange={(e) => update(d.id, { value: e.target.value })} placeholder={preset?.placeholder || "Your detail"} />
            </Field>
            <button
              type="button"
              onClick={() => remove(d.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-800"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      <AddButton label="Add a custom field" onClick={() => add()} />
    </div>
  );
}
