import type { Resume } from "../lib/types";
import { Sheet, ContactLine, safeContact } from "./shared";
import { Sections } from "./Sections";

export function EntryLevelTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <Sheet resume={resume} className="tpl-entry-level">
      <header className="tpl-header el-header">
        {c.fullName ? <h1 className="sheet-name el-name">{c.fullName}</h1> : null}
        {c.title ? <p className="el-title">{c.title}</p> : null}
        <ContactLine resume={resume} className="el-contact" sep="  ·  " />
      </header>
      <Sections resume={resume} chips />
    </Sheet>
  );
}
