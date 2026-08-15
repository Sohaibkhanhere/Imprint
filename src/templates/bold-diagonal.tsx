import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact, effectiveSections } from "./shared";
import { Portrait } from "./graphical";
import { SectionBlock } from "./Sections";

const SIDEBAR_KEYS: SectionKey[] = ["education", "skills", "certifications", "languages"];

export function BoldDiagonalTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const parts = contactParts(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !SIDEBAR_KEYS.includes(k));
  return (
    <Sheet resume={resume} className="tpl-bold-diagonal" style={{ padding: 0 }}>
      <div className="bd-layout">
        <main className="bd-main">
          <h1 className="bd-name">{c.fullName}</h1>
          {c.title ? <div className="bd-tagline">{c.title}</div> : null}
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
        <aside className="bd-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="bd-avatar" />
          <div className="bd-sidebody">
            {all.filter((k) => SIDEBAR_KEYS.includes(k)).map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
            {parts.length ? (
              <>
                <h3 className="bd-h">Contact</h3>
                {parts.map((p, i) => (
                  <div key={i} className="bd-item">{p}</div>
                ))}
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </Sheet>
  );
}
