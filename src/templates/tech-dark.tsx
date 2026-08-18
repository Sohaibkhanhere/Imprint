import type { Resume, SectionKey } from "../lib/types";
import { Sheet, ContactList, safeContact, effectiveSections } from "./shared";
import { SectionBlock } from "./Sections";
import { t } from "../lib/safe";

const CARD_KEYS: SectionKey[] = ["education", "skills"];

export function TechDarkTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const all = effectiveSections(resume) as SectionKey[];
  const cards = all.filter((k) => CARD_KEYS.includes(k));
  const rest = all.filter((k) => !CARD_KEYS.includes(k));
  const summary = resume.useObjective ? resume.objective : resume.summary;
  return (
    <Sheet resume={resume} className="tpl-tech-dark" style={{ padding: 0 }}>
      <div className="td-wrap">
        <div className="td-top">
          <ContactList resume={resume} itemClass="td-top-item" as="span" />
        </div>
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
