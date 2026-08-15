import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";
import { t } from "../lib/safe";

export function CreativeTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  const initial = t(c.fullName).charAt(0);
  return (
    <Sheet resume={resume} className="tpl-creative">
      <header className="cr-band">
        <div className="cr-band-inner">
          {initial ? <span className="cr-initial">{initial}</span> : null}
          <div className="cr-heading">
            {c.fullName ? <h1 className="sheet-name cr-name">{c.fullName}</h1> : null}
            {c.title ? <p className="cr-title">{c.title}</p> : null}
          </div>
        </div>
        {parts.length ? <p className="cr-contact">{parts.join("   ·   ")}</p> : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
