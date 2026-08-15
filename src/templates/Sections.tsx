import type { ReactNode } from "react";
import type { Resume, SectionKey } from "../lib/types";
import { Bullets, Dates, headingFor, shouldRender, citePublication, effectiveSections } from "./shared";
import { cleanUrl } from "../lib/date";

function SectionHead({ label }: { label: string }) {
  return <h2 className="t-head">{label}</h2>;
}

function SkillGroups({ resume, chips }: { resume: Resume; chips?: boolean }) {
  const groups = (resume.skills ?? []).filter((g) => Array.isArray(g?.skills) && g.skills.some((s) => (s || "").trim()));
  if (!groups.length) return null;
  return (
    <>
      {groups.map((g) => (
        <div key={g.id} className="t-skillgroup">
          {g.name && !/^skills?$/i.test(g.name) ? <span className="t-role t-skillgroup-name">{g.name}</span> : null}
          {chips ? (
            <span className="t-chips">
              {g.skills.filter((s) => (s || "").trim()).map((s, i) => (
                <span key={i} className="t-chip">{(s || "").trim()}</span>
              ))}
            </span>
          ) : (
            <span className="t-skills">{g.skills.filter((s) => (s || "").trim()).join(", ")}</span>
          )}
        </div>
      ))}
    </>
  );
}

function renderEntry(key: SectionKey, resume: Resume, chips: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  switch (key) {
    case "summary":
      out.push(<p key="s" className="t-summary">{resume.summary}</p>);
      break;
    case "objective":
      out.push(<p key="s" className="t-summary">{resume.objective}</p>);
      break;
    case "experience":
      (resume.experience ?? []).forEach((j) =>
        out.push(
          <div key={j.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{j.role || j.company}</span>
              <span className="t-dates"><Dates start={j.startDate} end={j.endDate} present={j.present} /></span>
            </div>
            <div className="t-org">
              {j.company}
              {j.location ? <span className="t-loc">{j.location}</span> : null}
            </div>
            {j.descriptor ? <p className="t-desc">{j.descriptor}</p> : null}
            <Bullets items={j.bullets} />
          </div>,
        ),
      );
      break;
    case "education":
      (resume.education ?? []).forEach((e) =>
        out.push(
          <div key={e.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{e.degree ? [e.degree, e.field].filter(Boolean).join(", ") : e.institution}</span>
              <span className="t-dates"><Dates start={e.startDate} end={e.endDate} present={false} /></span>
            </div>
            <div className="t-org">
              {e.institution}
              {e.location ? <span className="t-loc">{e.location}</span> : null}
            </div>
            {[e.gpa ? "GPA " + e.gpa : "", e.honors, e.thesis ? "Thesis: " + e.thesis : ""].filter(Boolean).length ? (
              <p className="t-meta">{([e.gpa ? "GPA " + e.gpa : "", e.honors].filter(Boolean).join(" · "))}{e.thesis ? (e.gpa || e.honors ? " · " : "") + "Thesis: " + e.thesis : ""}</p>
            ) : null}
          </div>,
        ),
      );
      break;
    case "skills":
      out.push(<SkillGroups key="g" resume={resume} chips={chips} />);
      break;
    case "projects":
      (resume.projects ?? []).forEach((p) =>
        out.push(
          <div key={p.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{p.name}</span>
              {p.link ? <span className="t-dates">{cleanUrl(p.link)}</span> : null}
            </div>
            {p.tech ? <div className="t-meta">{p.tech}</div> : null}
            {p.description ? <p className="t-desc">{p.description}</p> : null}
          </div>,
        ),
      );
      break;
    case "certifications":
      (resume.certifications ?? []).forEach((c) =>
        out.push(
          <div key={c.id} className="t-cert">
            <span className="t-role">{c.name}</span>
            <span className="t-meta">{[c.issuer, c.year].filter(Boolean).join(" · ")}</span>
          </div>,
        ),
      );
      break;
    case "languages":
      out.push(
        <div key="lang" className="t-langs">
          {(resume.languages ?? []).map((l) => (
            <span key={l.id} className="t-lang">
              {l.name}
              {l.level ? <span className="t-lang-level">— {l.level}</span> : null}
            </span>
          ))}
        </div>,
      );
      break;
    case "volunteer":
      (resume.volunteer ?? []).forEach((v) =>
        out.push(
          <div key={v.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{v.title || v.org}</span>
              <span className="t-dates"><Dates start={v.startDate} end={v.endDate} present={v.present} /></span>
            </div>
            <div className="t-org">
              {v.org}
              {v.location ? <span className="t-loc">{v.location}</span> : null}
            </div>
            <Bullets items={v.bullets} />
          </div>,
        ),
      );
      break;
    case "publications":
      (resume.publications ?? []).forEach((p) =>
        out.push(
          <div key={p.id} className="t-entry t-pub">
            <p className="t-pub-cite">{citePublication(p, resume.theme?.citationFormat ?? "apa")}</p>
            {p.url ? <p className="t-meta">{cleanUrl(p.url)}</p> : null}
          </div>,
        ),
      );
      break;
    case "awards":
      (resume.awards ?? []).forEach((a) =>
        out.push(
          <div key={a.id} className="t-entry t-award">
            <span className="t-role">{a.title}</span>
            <span className="t-meta">{[a.org, a.year].filter(Boolean).join(" · ")}</span>
          </div>,
        ),
      );
      break;
    case "teaching":
      (resume.teaching ?? []).forEach((t) =>
        out.push(
          <div key={t.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{t.role || t.course}</span>
              <span className="t-dates"><Dates start={t.startDate} end={t.endDate} present={false} /></span>
            </div>
            <div className="t-org">
              {t.institution}
              {t.location ? <span className="t-loc">{t.location}</span> : null}
            </div>
            <Bullets items={t.bullets} />
          </div>,
        ),
      );
      break;
    case "grants":
      (resume.grants ?? []).forEach((g) =>
        out.push(
          <div key={g.id} className="t-entry">
            <div className="t-entry-head">
              <span className="t-role">{g.name}</span>
              <span className="t-dates">{g.amount ? (g.amount.match(/^\d/) ? "$" + g.amount : g.amount) : ""}</span>
            </div>
            <div className="t-meta">{[g.funder, g.year].filter(Boolean).join(" · ")}</div>
            {g.description ? <p className="t-desc">{g.description}</p> : null}
          </div>,
        ),
      );
      break;
    case "presentations":
      (resume.presentations ?? []).forEach((p) =>
        out.push(
          <div key={p.id} className="t-entry t-pres">
            <span className="t-role">{p.title}</span>
            <span className="t-meta">{[p.event, p.year, p.location].filter(Boolean).join(" · ")}</span>
          </div>,
        ),
      );
      break;
    case "affiliations":
      (resume.affiliations ?? []).forEach((a) =>
        out.push(
          <div key={a.id} className="t-entry">
            <span className="t-role">{a.name}</span>
            <span className="t-meta">{[a.role, a.years].filter(Boolean).join(" · ")}</span>
          </div>,
        ),
      );
      break;
    case "references":
      (resume.references ?? []).forEach((r) =>
        out.push(
          <div key={r.id} className="t-entry t-ref">
            <span className="t-role">{r.name}</span>
            <span className="t-meta">{[r.title, r.org, r.email, r.phone].filter(Boolean).join(" · ")}</span>
          </div>,
        ),
      );
      break;
    case "portfolio":
      out.push(
        <div key="pf" className="t-entry">
          <span className="t-role">Portfolio</span>
          <div className="t-meta">{cleanUrl(resume.contact?.portfolioUrl)}</div>
        </div>,
      );
      break;
    default:
      break;
  }
  return out;
}

export function SectionBlock({ resume, section, chips }: { resume: Resume; section: SectionKey; chips: boolean }) {
  if (!shouldRender(section, resume)) return null;
  const label = headingFor(section, resume);
  if (section === "summary" && resume.useObjective) return null;
  if (section === "objective" && !resume.useObjective) return null;
  return (
    <section className="t-section">
      <SectionHead label={label} />
      <div className="t-body">{renderEntry(section, resume, chips)}</div>
    </section>
  );
}

export function Sections({ resume, sidebarKeys = [], chips = false }: { resume: Resume; sidebarKeys?: SectionKey[]; chips?: boolean }) {
  const all = effectiveSections(resume) as SectionKey[];
  const main = all.filter((k) => !sidebarKeys.includes(k));
  const side = all.filter((k) => sidebarKeys.includes(k));
  const showSide = side.some((k) => shouldRender(k, resume));
  const renderMain = (
    <div className="t-main" data-zone="main">
      {main.map((k) => (
        <SectionBlock key={k} resume={resume} section={k} chips={chips} />
      ))}
    </div>
  );
  const renderSide = showSide ? (
    <div className="t-side" data-zone="sidebar">
      {side.map((k) => (
        <SectionBlock key={k} resume={resume} section={k} chips={chips} />
      ))}
    </div>
  ) : null;
  if (sidebarKeys.length) {
    return (
      <div className={showSide ? "t-layout" : "t-layout solo"}>
        {renderMain}
        {renderSide}
      </div>
    );
  }
  return renderMain;
}
