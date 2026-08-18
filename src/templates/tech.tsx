import type { Resume } from "../lib/types";
import { Sheet, ContactLine, SheetHref, safeContact } from "./shared";
import { Sections } from "./Sections";

export function TechTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-tech">
      <header className="tpl-header tk-header">
        {c.fullName ? <h1 className="sheet-name tk-name">{c.fullName}</h1> : null}
        {c.title ? <p className="tk-title">{c.title}</p> : null}
        <ContactLine resume={resume} className="tk-contact" sep="   ·   " />
        {c.github ? (
          <p className="tk-github">
            <SheetHref href={c.github}>{c.github.replace(/^https?:\/\/(www\.)?/, "")}</SheetHref>
          </p>
        ) : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
