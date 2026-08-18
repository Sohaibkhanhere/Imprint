import type { Resume, SectionKey } from "../lib/types";
import { Sheet, ContactList, safeContact, effectiveSections } from "./shared";
import { Portrait } from "./graphical";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["skills", "certifications", "languages"];

export function ColoredSidebarTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-colored-sidebar" style={{ padding: 0 }}>
      <div className="cl-layout">
        <aside className="cl-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="cl-avatar" />
          <div className="cl-name">{c.fullName}</div>
          {c.title ? <div className="cl-title">{c.title}</div> : null}
          <div className="cl-rule" />
          <h3 className="cl-h">Contact</h3>
          <ContactList resume={resume} itemClass="cl-item" />
          <div className="cl-sections">
            {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={true} />
            ))}
          </div>
        </aside>
        <main className="cl-main">
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}
