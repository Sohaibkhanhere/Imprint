import { initialsOf } from "./shared";
import { sanitizePhotoUrl } from "../lib/sanitize";

export const DEFAULT_PORTRAIT = "/portrait.jpg";

export function Portrait({ name, src, className }: { name?: string; src?: string; className?: string }) {
  const url = sanitizePhotoUrl(src);
  if (url) {
    return <img className={["rs-portrait", className].filter(Boolean).join(" ")} src={url} alt={name || ""} />;
  }
  const initials = initialsOf(name);
  return (
    <div className={["rs-portrait", "rs-portrait-fallback", className].filter(Boolean).join(" ")} aria-hidden="true">
      {initials || ""}
    </div>
  );
}
