import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ClassicSerifTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-classic-serif">
      <header className="tpl-header cs-header">
        {c.fullName ? <h1 className="sheet-name cs-name">{c.fullName}</h1> : null}
        {c.title ? <p className="cs-title">{c.title}</p> : null}
        <ContactLine resume={resume} className="cs-contact" sep="   ·   " />
      </header>
      <Sections resume={resume} chips={false} />
    </Sheet>
  );
}
