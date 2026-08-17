import { useResume } from "../../store/resumeStore";
import { DEFAULT_PORTRAIT } from "../../templates/graphical";
import { sanitizePhotoUrl } from "../../lib/sanitize";
import { Field, Input } from "../ui";

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
      <Field label="Phone">
        <Input value={c.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555-014-2233" />
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
    </div>
  );
}
