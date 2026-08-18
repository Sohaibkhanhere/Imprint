import type { Resume, SectionKey } from "../lib/types";
import { Sheet, ContactList, safeContact, effectiveSections } from "./shared";
import { Portrait } from "./graphical";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["skills", "certifications", "languages"];

export function PhotoSidebarTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-photo-sidebar" style={{ padding: 0 }}>
      <div className="ps-layout">
        <aside className="ps-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="ps-avatar" />
          <h3 className="ps-h">Contact</h3>
          <ContactList resume={resume} itemClass="ps-item" />
          <div className="ps-sections">
            {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </div>
        </aside>
        <main className="ps-main">
          <div className="ps-corner" />
          <h1 className="ps-name">{c.fullName}</h1>
          {c.title ? <span className="ps-tagline">{c.title}</span> : null}
          <div className="ps-body">
            {main.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </div>
        </main>
      </div>
    </Sheet>
  );
}
