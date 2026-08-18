import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function PortfolioTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-portfolio">
      <header className="pf-band">
        <div className="pf-band-inner">
          {c.fullName ? <h1 className="sheet-name pf-name">{c.fullName}</h1> : null}
          {c.title ? <p className="pf-title">{c.title}</p> : null}
        </div>
        <ContactLine resume={resume} className="pf-contact" sep="   ·   " />
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
