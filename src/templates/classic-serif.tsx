import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ClassicSerifTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-classic-serif">
      <header className="tpl-header cs-header">
        {c.fullName ? <h1 className="sheet-name cs-name">{c.fullName}</h1> : null}
        {c.title ? <p className="cs-title">{c.title}</p> : null}
        {parts.length ? <p className="cs-contact">{parts.join("   ·   ")}</p> : null}
      </header>
      <Sections resume={resume} chips={false} />
    </Sheet>
  );
}
