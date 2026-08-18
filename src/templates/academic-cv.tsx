import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function AcademicCvTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-academic-cv">
      <header className="tpl-header ac-header">
        {c.fullName ? <h1 className="sheet-name ac-name">{c.fullName}</h1> : null}
        {c.title ? <p className="ac-title">{c.title}</p> : null}
        <ContactLine resume={resume} className="ac-contact" sep="  ·  " />
      </header>
      <Sections resume={resume} sidebarKeys={[]} />
    </Sheet>
  );
}
