import type { Resume, SectionKey } from "../lib/types";
import { Sheet, ContactList, safeContact, effectiveSections } from "./shared";
import { Portrait } from "./graphical";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["skills", "certifications", "languages"];

export function DarkModernTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-dark-modern" style={{ padding: 0 }}>
      <header className="dm-header">
        <Portrait name={c.fullName} src={c.photoUrl} className="dm-avatar" />
        <div>
          <p className="dm-hello">
            Hello, I&apos;m<b className="dm-name">{c.fullName}</b>
          </p>
          {c.title ? <span className="dm-tag">{c.title}</span> : null}
        </div>
      </header>
      <div className="dm-grid">
        <aside className="dm-side">
          <h3 className="dm-h">Contact</h3>
          <ContactList resume={resume} itemClass="dm-item" />
          <div className="dm-sections">
            {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </div>
        </aside>
        <main className="dm-main">
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}
