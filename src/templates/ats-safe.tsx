import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact, effectiveSections } from "./shared";
import { SectionBlock } from "./Sections";

export function AtsSafeTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const parts = contactParts(resume);
  const sections = effectiveSections(resume) as SectionKey[];

  return (
    <Sheet resume={resume} className="tpl-ats-safe">
      <header className="ats-hero">
        <h1 className="ats-name">{c.fullName || "Your Name"}</h1>
        {c.title ? <p className="ats-title">{c.title}</p> : null}
        {parts.length ? <p className="ats-contact">{parts.join(" | ")}</p> : null}
      </header>
      {sections.map((section) => (
        <SectionBlock key={section} resume={resume} section={section} chips={false} />
      ))}
    </Sheet>
  );
}
