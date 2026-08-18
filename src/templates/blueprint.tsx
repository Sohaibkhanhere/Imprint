import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function BlueprintTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-blueprint">
      <span className="bp-corner bp-tl" aria-hidden="true" />
      <span className="bp-corner bp-tr" aria-hidden="true" />
      <span className="bp-corner bp-bl" aria-hidden="true" />
      <span className="bp-corner bp-br" aria-hidden="true" />
      <header className="bp-header">
        {c.title ? <p className="bp-kicker">// {c.title}</p> : null}
        {c.fullName ? <h1 className="bp-name">{c.fullName}</h1> : null}
        <ContactLine resume={resume} className="bp-contact" sep="  ·  " />
      </header>
      <Sections resume={resume} />
    </Sheet>
  );
}
