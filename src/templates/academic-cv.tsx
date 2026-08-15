import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function AcademicCvTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-academic-cv">
      <header className="tpl-header ac-header">
        {c.fullName ? <h1 className="sheet-name ac-name">{c.fullName}</h1> : null}
        {c.title ? <p className="ac-title">{c.title}</p> : null}
        {parts.length ? <p className="ac-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} sidebarKeys={[]} />
    </Sheet>
  );
}
