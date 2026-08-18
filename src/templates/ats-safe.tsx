import type { Resume, SectionKey } from "../lib/types";
import { Sheet, ContactLine, safeContact, effectiveSections } from "./shared";
import { SectionBlock } from "./Sections";

export function AtsSafeTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const sections = effectiveSections(resume) as SectionKey[];

  return (
    <Sheet resume={resume} className="tpl-ats-safe">
      <header className="ats-hero" data-rs-section="contact">
        <h1 className="ats-name" data-rs-field="fullName">{c.fullName || "Your Name"}</h1>
        {c.title ? <p className="ats-title" data-rs-field="title">{c.title}</p> : null}
        <ContactLine resume={resume} className="ats-contact" sep=" | " />
      </header>
      {sections.map((section) => (
        <SectionBlock key={section} resume={resume} section={section} chips={false} />
      ))}
    </Sheet>
  );
}
