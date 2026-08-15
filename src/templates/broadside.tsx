import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

const SIDEBAR: SectionKey[] = ["skills", "certifications", "languages", "awards", "affiliations", "portfolio"];

export function BroadsideTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-broadside">
      <header className="bd-header">
        <p className="bd-kicker">The resume · vol. 01{c.title ? " — " + c.title : ""}</p>
        {c.fullName ? <h1 className="bd-name">{c.fullName}</h1> : null}
        {parts.length ? <p className="bd-contact">{parts.join("   ·   ")}</p> : null}
      </header>
      <Sections resume={resume} sidebarKeys={SIDEBAR} chips />
    </Sheet>
  );
}
