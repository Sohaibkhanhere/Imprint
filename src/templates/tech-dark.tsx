import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, safeContact, effectiveSections } from "./shared";
import { SectionBlock } from "./Sections";
import { t } from "../lib/safe";

const CARD_KEYS: SectionKey[] = ["education", "skills"];

export function TechDarkTemplate({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  const c = safeContact(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const cards = all.filter((k) => CARD_KEYS.includes(k));
  const rest = all.filter((k) => !CARD_KEYS.includes(k));
  const summary = resume.useObjective ? resume.objective : resume.summary;
  return (
    <Sheet resume={resume} className="tpl-tech-dark" style={{ padding: 0 }}>
      <div className="td-wrap">
        {parts.length ? (
          <div className="td-top">
            {parts.map((p, i) => (
              <span key={i} className="td-top-item">{p}</span>
            ))}
          </div>
        ) : null}
        <div className="td-headline">
          {c.fullName ? <h1 className="td-name">{c.fullName}</h1> : null}
          {t(summary) ? <p className="td-summary">{summary}</p> : null}
        </div>
        {cards.length ? (
          <div className="td-cards">
            {cards.map((k) => (
              <div key={k} className="td-card">
                <SectionBlock resume={resume} section={k} chips />
              </div>
            ))}
          </div>
        ) : null}
        {rest.length ? (
          <div className="td-rest">
            {rest.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips />
            ))}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
