export const DEFAULT_PORTRAIT = "/portrait.jpg";

export function Portrait({ name, src, className }: { name?: string; src?: string; className?: string }) {
  const url = (src || "").trim() || DEFAULT_PORTRAIT;
  return <img className={["rs-portrait", className].filter(Boolean).join(" ")} src={url} alt={name || ""} />;
}
