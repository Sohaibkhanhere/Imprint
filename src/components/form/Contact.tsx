import { useResume } from "../../store/resumeStore";
import { DEFAULT_PORTRAIT } from "../../templates/graphical";
import { sanitizePhotoUrl } from "../../lib/sanitize";
import { Field, Input, AddButton } from "../ui";
import { uid } from "../../lib/date";
import type { SocialLink } from "../../lib/types";
import { Plus, Trash2 } from "lucide-react";

const SOCIAL_PRESETS: { label: string; placeholder: string }[] = [
  { label: "Instagram", placeholder: "instagram.com/name" },
  { label: "X", placeholder: "x.com/name" },
  { label: "Facebook", placeholder: "facebook.com/name" },
  { label: "YouTube", placeholder: "youtube.com/@name" },
  { label: "Behance", placeholder: "behance.net/name" },
  { label: "Dribbble", placeholder: "dribbble.com/name" },
  { label: "TikTok", placeholder: "tiktok.com/@name" },
  { label: "Medium", placeholder: "medium.com/@name" },
];

function emptySocial(label = "", url = ""): SocialLink {
  return { id: uid(), label, url };
}

function readPhoto(file: File, onDone: (url: string) => void) {
  const img = new Image();
  const blobUrl = URL.createObjectURL(file);
  img.onload = () => {
    const max = 320;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    onDone(canvas.toDataURL("image/jpeg", 0.72));
    URL.revokeObjectURL(blobUrl);
  };
  img.src = blobUrl;
}

export function ContactForm() {
  const { resume, dispatch } = useResume();
  const c = resume.contact;
  const set = (patch: Partial<typeof c>) => dispatch({ type: "SET_CONTACT", contact: { ...c, ...patch } });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50/80 p-2.5">
        <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-full border border-stone-300 bg-stone-100">
          <img src={sanitizePhotoUrl(c.photoUrl) || DEFAULT_PORTRAIT} alt="" className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-800">Portrait</p>
          <p className="mt-0.5 text-[11px] leading-snug text-stone-500">Shows on photo layouts. Sample stays until you upload yours.</p>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="cursor-pointer text-xs font-semibold text-amber-700 transition-colors duration-150 hover:text-amber-800">
              Upload
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readPhoto(file, (photoUrl) => set({ photoUrl }));
                  e.target.value = "";
                }}
              />
            </label>
            {c.photoUrl ? (
              <button type="button" className="text-xs text-stone-500 transition-colors duration-150 hover:text-stone-800" onClick={() => set({ photoUrl: "" })}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <Field wide label="Full name">
        <Input value={c.fullName ?? ""} onChange={(e) => set({ fullName: e.target.value })} placeholder="Full name" />
      </Field>
      <Field wide label="Target job title / tagline">
        <Input value={c.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Senior Marketing Manager" />
      </Field>
      <Field label="Phone" hint="Opens WhatsApp. Include country code, like +92 300 1234567.">
        <Input value={c.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+92 300 1234567" />
      </Field>
      <Field label="Email">
        <Input type="email" value={c.email} onChange={(e) => set({ email: e.target.value })} placeholder="ayesha@example.com" />
      </Field>
      <Field label="City">
        <Input value={c.city} onChange={(e) => set({ city: e.target.value })} placeholder="San Francisco" />
      </Field>
      <Field label="Country">
        <Input value={c.country} onChange={(e) => set({ country: e.target.value })} placeholder="USA" />
      </Field>
      <Field wide label="LinkedIn" hint="Clean URL, no tracking parameters">
        <Input value={c.linkedin} onChange={(e) => set({ linkedin: e.target.value })} placeholder="linkedin.com/in/name" />
      </Field>
      <Field label="Website / Portfolio">
        <Input value={c.website} onChange={(e) => set({ website: e.target.value })} placeholder="yoursite.com" />
      </Field>
      <Field label="GitHub (optional)">
        <Input value={c.github} onChange={(e) => set({ github: e.target.value })} placeholder="github.com/name" />
      </Field>
      <SocialLinksField socials={c.socials ?? []} onChange={(socials) => set({ socials })} />
    </div>
  );
}

function SocialLinksField({
  socials,
  onChange,
}: {
  socials: SocialLink[];
  onChange: (socials: SocialLink[]) => void;
}) {
  const used = new Set(socials.map((s) => s.label.trim().toLowerCase()).filter(Boolean));
  const add = (item: SocialLink) => onChange([...socials, item]);
  const update = (id: string, patch: Partial<SocialLink>) =>
    onChange(socials.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => onChange(socials.filter((s) => s.id !== id));

  return (
    <div className="sm:col-span-2 space-y-3 border-t border-stone-200 pt-3">
      <div>
        <p className="text-xs font-medium text-stone-800">More links</p>
        <p className="mt-0.5 text-[11px] leading-snug text-stone-500">Optional. Add Instagram, Behance, or any profile you want on the sheet.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SOCIAL_PRESETS.map((p) => {
          const taken = used.has(p.label.toLowerCase());
          return (
            <button
              key={p.label}
              type="button"
              disabled={taken}
              onClick={() => add(emptySocial(p.label, ""))}
              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-stone-900 hover:text-stone-900 disabled:cursor-default disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-1">
                <Plus size={11} /> {p.label}
              </span>
            </button>
          );
        })}
      </div>
      {socials.map((s) => {
        const preset = SOCIAL_PRESETS.find((p) => p.label.toLowerCase() === s.label.trim().toLowerCase());
        return (
          <div key={s.id} className="grid grid-cols-1 gap-2 rounded-md border border-stone-200 bg-stone-50/70 p-2.5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:items-end">
            <Field label="Label">
              <Input value={s.label} onChange={(e) => update(s.id, { label: e.target.value })} placeholder="Instagram" />
            </Field>
            <Field label="URL">
              <Input value={s.url} onChange={(e) => update(s.id, { url: e.target.value })} placeholder={preset?.placeholder || "profile.site/name"} />
            </Field>
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-800"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      <AddButton label="Add a link" onClick={() => add(emptySocial())} />
    </div>
  );
}
