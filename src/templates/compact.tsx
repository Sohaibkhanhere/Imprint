import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function CompactTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-compact">
      <header className="ct-header">
        {c.fullName ? <h1 className="ct-name">{c.fullName}</h1> : null}
        {c.title ? <span className="ct-title">{c.title}</span> : null}
        {parts.length ? <p className="ct-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} chips={false} />
    </Sheet>
  );
}
