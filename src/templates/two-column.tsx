import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function TwoColumnTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  const sidebar: SectionKey[] = ["skills", "certifications", "languages", "awards", "affiliations", "portfolio"];
  return (
    <Sheet resume={resume} className="tpl-two-column">
      <header className="tpl-header tc-header">
        {c.fullName ? <h1 className="sheet-name tc-name">{c.fullName}</h1> : null}
        {c.title ? <p className="tc-title">{c.title}</p> : null}
        {parts.length ? <p className="tc-contact">{parts.join("   ·   ")}</p> : null}
      </header>
      <Sections resume={resume} sidebarKeys={sidebar} chips />
    </Sheet>
  );
}
