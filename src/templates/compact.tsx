import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function CompactTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-compact">
      <header className="ct-header">
        {c.fullName ? <h1 className="ct-name">{c.fullName}</h1> : null}
        {c.title ? <span className="ct-title">{c.title}</span> : null}
        <ContactLine resume={resume} className="ct-contact" sep="  ·  " />
      </header>
      <Sections resume={resume} chips={false} />
    </Sheet>
  );
}
