import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ModernMinimalTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-modern-minimal">
      <header className="tpl-header mm-header" data-rs-section="contact">
        {c.fullName ? <h1 className="sheet-name mm-name" data-rs-field="fullName">{c.fullName}</h1> : null}
        {c.title ? <p className="mm-title" data-rs-field="title">{c.title}</p> : null}
        <ContactLine resume={resume} className="mm-contact" sep="  ·  " />
      </header>
      <Sections resume={resume} />
    </Sheet>
  );
}
