import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ModernMinimalTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-modern-minimal">
      <header className="tpl-header mm-header">
        {c.fullName ? <h1 className="sheet-name mm-name">{c.fullName}</h1> : null}
        {c.title ? <p className="mm-title">{c.title}</p> : null}
        {parts.length ? <p className="mm-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} />
    </Sheet>
  );
}
