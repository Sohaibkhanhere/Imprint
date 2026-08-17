import { useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const styles: Record<string, string> = {
    primary: "bg-amber-500 text-stone-100 hover:bg-amber-400 px-3.5 py-2",
    ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-2",
    outline: "border border-stone-300 text-stone-700 hover:bg-stone-100 bg-stone-50 px-3.5 py-2",
    danger: "text-amber-700 hover:bg-amber-50 px-2.5 py-2",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

const inputBase =
  "w-full min-w-0 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600/55 focus:ring-2 focus:ring-amber-500/25 transition-[border-color,box-shadow] duration-150 ease";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-medium tracking-wide text-stone-600">
      {children}
    </label>
  );
}

export function Field({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return (
    <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-[11px] leading-snug text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = "", value, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${className}`} value={value ?? ""} {...props} />;
}

export function Textarea({ className = "", value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputBase} resize-y leading-relaxed ${className}`} value={value ?? ""} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} appearance-none pr-8 bg-no-repeat bg-[right_0.6rem_center] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239aa0b8%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-stone-200 bg-stone-50 shadow-sm ${className}`}>{children}</div>;
}

export function IconBtn({ children, title, onClick, danger }: { children: ReactNode; title: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 ${
        danger ? "text-stone-400 hover:bg-amber-50 hover:text-amber-700" : "text-stone-400 hover:bg-stone-100 hover:text-stone-800"
      }`}
    >
      {children}
    </button>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 shadow-[inset_0_0_0_1px_transparent] transition-[border-color,background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-stone-900 hover:text-stone-900 hover:bg-stone-100 active:scale-[0.99]"
    >
      <Plus size={15} /> {label}
    </button>
  );
}

export function PresentToggle({ on, onChange, hint }: { on: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`desk-switch${on ? " is-on" : ""}`} title="Currently in this role">
        <span className="desk-switch-knob" />
      </button>
      <span className="text-xs font-medium text-stone-700">Present</span>
      {hint ? <span className="hidden text-[11px] leading-snug text-stone-500 sm:inline">{hint}</span> : null}
    </div>
  );
}

export function Collapse({ title, subtitle, count, defaultOpen = true, children }: { title: string; subtitle?: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="desk-card bg-stone-50">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="text-sm font-semibold text-stone-900">{title}</span>
          {typeof count === "number" && count > 0 ? (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">{count}</span>
          ) : null}
          {subtitle ? <span className="hidden truncate text-xs text-stone-500 sm:inline">· {subtitle}</span> : null}
        </span>
        <ChevronDown size={16} className={`desk-chevron${open ? " is-open" : ""}`} />
      </button>
      <div className={`desk-fold${open ? " is-open" : ""}`}>
        <div className="desk-fold-inner">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function EntryCard({ title, subtitle, onRemove, onMoveUp, onMoveDown, children }: { title: string; subtitle?: string; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const label = [title, subtitle].filter(Boolean).join(" · ");
  return (
    <div className="desk-card desk-enter">
      <div className="flex items-center gap-1 border-b border-stone-200/80 px-2.5 py-1.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left" title={open ? "Collapse entry" : "Expand entry"}>
          <GripVertical size={14} className="shrink-0 text-stone-300" />
          <span className="min-w-0 truncate text-[13px] font-medium text-stone-800">
            {title || <span className="font-normal text-stone-400">Untitled entry</span>}
          </span>
          {subtitle ? <span className="hidden min-w-0 truncate text-xs text-stone-500 sm:inline">· {subtitle}</span> : null}
          <ChevronDown size={15} className={`ml-auto desk-chevron${open ? " is-open" : ""}`} />
        </button>
        <span className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
          {onMoveUp ? <IconBtn title="Move up" onClick={onMoveUp}><ChevronUp size={15} /></IconBtn> : null}
          {onMoveDown ? <IconBtn title="Move down" onClick={onMoveDown}><ChevronDown size={15} /></IconBtn> : null}
          {onRemove ? <IconBtn title="Remove" danger onClick={onRemove}><Trash2 size={15} /></IconBtn> : null}
        </span>
      </div>
      <div className={`desk-fold${open ? " is-open" : ""}`}>
        <div className="desk-fold-inner">
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2" aria-label={label || "Entry"}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
