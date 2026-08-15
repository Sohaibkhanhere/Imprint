import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function SkillsBasedTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-skills-based">
      <header className="tpl-header sb-header">
        {c.fullName ? <h1 className="sheet-name sb-name">{c.fullName}</h1> : null}
        {c.title ? <p className="sb-title">{c.title}</p> : null}
        {parts.length ? <p className="sb-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
