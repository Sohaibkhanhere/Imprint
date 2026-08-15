import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function TechTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-tech">
      <header className="tpl-header tk-header">
        {c.fullName ? <h1 className="sheet-name tk-name">{c.fullName}</h1> : null}
        {c.title ? <p className="tk-title">{c.title}</p> : null}
        {parts.length ? <p className="tk-contact">{parts.join("   ·   ")}</p> : null}
        {c.github ? <p className="tk-github">{c.github.replace(/^https?:\/\/(www\.)?/, "")}</p> : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
