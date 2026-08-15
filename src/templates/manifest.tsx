import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function ManifestTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-manifest">
      <header className="mn-header">
        {c.title ? <p className="mn-kicker">{c.title}</p> : null}
        {c.fullName ? <h1 className="mn-name">{c.fullName}</h1> : null}
        {parts.length ? <p className="mn-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} />
    </Sheet>
  );
}
