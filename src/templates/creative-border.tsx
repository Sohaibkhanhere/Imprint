import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact, initialsOf, effectiveSections } from "./shared";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["skills", "certifications", "languages"];

export function CreativeBorderTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const parts = contactParts(resume);
  const initials = initialsOf(c.fullName);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-creative-border" style={{ padding: 10 }}>
      <div className="cb-frame">
        <div className="cb-corner cb-corner-tl" />
        <div className="cb-corner cb-corner-tr" />
        <div className="cb-corner cb-corner-bl" />
        <div className="cb-corner cb-corner-br" />
        <div className="cb-header">
          <div className="cb-monogram">{initials}</div>
          <div className="cb-headtext">
            <h1 className="cb-name">{c.fullName}</h1>
            {c.title ? <div className="cb-title">{c.title}</div> : null}
            {parts.length ? <div className="cb-contact">{parts.join("   ·   ")}</div> : null}
          </div>
        </div>
        <div className="cb-layout">
          <main className="cb-main">
            {main.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </main>
          <aside className="cb-side">
            {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={true} />
            ))}
          </aside>
        </div>
      </div>
    </Sheet>
  );
}
