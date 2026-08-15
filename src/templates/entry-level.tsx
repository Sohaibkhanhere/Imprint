import type { Resume } from "../lib/types";
import { Sheet, contactParts, safeContact } from "./shared";
import { Sections } from "./Sections";

export function EntryLevelTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-entry-level">
      <header className="tpl-header el-header">
        {c.fullName ? <h1 className="sheet-name el-name">{c.fullName}</h1> : null}
        {c.title ? <p className="el-title">{c.title}</p> : null}
        {parts.length ? <p className="el-contact">{parts.join("  ·  ")}</p> : null}
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
