import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function PortfolioTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-portfolio">
      <header className="pf-band">
        <div className="pf-band-inner">
          {c.fullName ? <h1 className="sheet-name pf-name">{c.fullName}</h1> : null}
          {c.title ? <p className="pf-title">{c.title}</p> : null}
        </div>
        {parts.length ? <p className="pf-contact">{parts.join("   ·   ")}</p> : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
