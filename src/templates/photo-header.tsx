import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact, effectiveSections } from "./shared";
import { Portrait } from "./graphical";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["skills", "certifications", "languages"];

export function PhotoHeaderTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const parts = contactParts(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-photo-header" style={{ padding: 0 }}>
      <header className="ph-band">
        <Portrait name={c.fullName} src={c.photoUrl} className="ph-avatar" />
        <div className="ph-headtext">
          <h1 className="ph-name">{c.fullName}</h1>
          {c.title ? <div className="ph-title">{c.title}</div> : null}
          {parts.length ? <div className="ph-contact">{parts.join("   ·   ")}</div> : null}
        </div>
      </header>
      <div className="ph-layout">
        <main className="ph-main">
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
        <aside className="ph-side">
          {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={true} />
          ))}
        </aside>
      </div>
    </Sheet>
  );
}
