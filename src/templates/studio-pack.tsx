import type { Resume, SectionKey } from "../lib/types";
import { Sheet, Bullets, Dates, contactParts, effectiveSections, safeContact } from "./shared";
import { SectionBlock } from "./Sections";
import { Portrait } from "./graphical";
import { t } from "../lib/safe";

const SIDE = ["skills", "languages", "certifications", "education"] as SectionKey[];

function zones(resume: Resume) {
  const all = effectiveSections(resume) as SectionKey[];
  return {
    side: all.filter((k) => SIDE.includes(k)),
    main: all.filter((k) => !SIDE.includes(k)),
  };
}

function Meta({ resume }: { resume: Resume }) {
  const parts = contactParts(resume);
  if (!parts.length) return null;
  return (
    <ul className="st-meta">
      {parts.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

function Jobs({ resume }: { resume: Resume }) {
  const jobs = (resume.experience ?? []).filter((j) => t(j.role) || t(j.company));
  if (!jobs.length) return null;
  return (
    <section className="t-section">
      <h2 className="t-head">Work</h2>
      {jobs.map((j) => (
        <div key={j.id} className="st-job">
          <div className="st-job-top">
            <span className="st-job-role">{j.role || j.company}</span>
            <span className="st-job-dates">
              <Dates start={j.startDate} end={j.endDate} present={j.present} />
            </span>
          </div>
          <div className="st-job-org">
            {j.company}
            {j.location ? <span> · {j.location}</span> : null}
          </div>
          {j.descriptor ? <p className="t-desc">{j.descriptor}</p> : null}
          <Bullets items={j.bullets} />
        </div>
      ))}
    </section>
  );
}

/** Letterhead: compact name, accent rule, two columns. Long names stay on one or two lines. */
export function PlinthTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume);
  const rest = main.filter((k) => k !== "experience");
  return (
    <Sheet resume={resume} className="tpl-plinth st-sheet">
      <header className="pl-head">
        <div>
          <h1>{c.fullName || "Your Name"}</h1>
          {c.title ? <p className="pl-title">{c.title}</p> : null}
        </div>
        <Meta resume={resume} />
      </header>
      <div className="pl-rule" />
      <div className={side.length ? "pl-grid" : "pl-grid solo"}>
        <div>
          <Jobs resume={resume} />
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
        {side.length ? (
          <aside>
            {side.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips />
            ))}
          </aside>
        ) : null}
      </div>
    </Sheet>
  );
}

/** Inset white panel on a full-bleed ink page. Studio cover. */
export function InkwellTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume);
  const rest = main.filter((k) => k !== "experience");
  return (
    <Sheet resume={resume} className="tpl-inkwell st-sheet" style={{ padding: 0 }}>
      <div className="iw-bleed">
        <div className="iw-panel">
          <header className="iw-head">
            <Portrait name={c.fullName} src={c.photoUrl} className="iw-photo" />
            <div>
              <h1>{c.fullName || "Your Name"}</h1>
              {c.title ? <p>{c.title}</p> : null}
              <Meta resume={resume} />
            </div>
          </header>
          <div className={side.length ? "iw-grid" : "iw-grid solo"}>
            <div>
              <Jobs resume={resume} />
              {rest.map((k) => (
                <SectionBlock key={k} resume={resume} section={k} chips={false} />
              ))}
            </div>
            {side.length ? (
              <aside>
                {side.map((k) => (
                  <SectionBlock key={k} resume={resume} section={k} chips />
                ))}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
