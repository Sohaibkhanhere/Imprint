import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function BlueprintTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
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
        {parts.length ? <p className="bp-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} />
    </Sheet>
  );
}
