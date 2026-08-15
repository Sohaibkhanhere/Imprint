import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ExecutiveTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-executive">
      <header className="tpl-header ex-header">
        {c.fullName ? <h1 className="sheet-name ex-name">{c.fullName}</h1> : null}
        {c.title ? <p className="ex-title">{c.title}</p> : null}
        {parts.length ? <p className="ex-contact">{parts.join("   ·   ")}</p> : null}
        <hr className="ex-rule" />
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
