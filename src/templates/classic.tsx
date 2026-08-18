import type { Resume } from "../lib/types";
import { Sheet, SectionHead, Bullets, Dates, ExtraDetails, ContactLine, SheetHref, safeContact, headingFor, effectiveSections, citePublication } from "./shared";
import { cleanUrl } from "../lib/date";

function Header({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  return (
    <header className="c-header" data-rs-section="contact">
      <h1 className="sheet-name c-name" data-rs-field="fullName">{c.fullName || "Your Name"}</h1>
      {c.title ? <p className="c-title" data-rs-field="title">{c.title}</p> : null}
      <ContactLine resume={resume} className="c-contact" spanParts />
      <hr className="sheet-rule c-rule" />
    </header>
  );
}

export function ClassicTemplate({ resume }: { resume: Resume }) {
  const sections = effectiveSections(resume);
  const r = resume;

  return (
    <Sheet resume={resume} className="tpl-classic">
      <Header resume={resume} />

      {sections.map((s) => {
        switch (s) {
          case "summary":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("summary", resume)} />
                <p className="c-summary" data-rs-field="summary">{r.summary}</p>
              </section>
            );
          case "objective":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Objective" />
                <p className="c-summary" data-rs-field="objective">{r.objective}</p>
              </section>
            );
          case "experience":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("experience", resume)} />
                <div className="space-y" style={{ display: "grid", gap: "var(--s3, 16px)" }}>
                  {r.experience.map((e) => (
                    <div key={e.id} className="sheet-entry" data-rs-entry={e.id}>
                      <div className="c-entry-head">
                        <span className="c-role">{e.role || e.company || "Role"}</span>
                        <span className="c-dates">
                          <Dates start={e.startDate} end={e.endDate} present={e.present} />
                        </span>
                      </div>
                      <div className="c-org">
                        <strong>{e.company}</strong>
                        {e.descriptor ? <span className="c-loc">{`(${e.descriptor})`}</span> : null}
                        {e.location ? <span className="c-loc">{e.location}</span> : null}
                      </div>
                      <Bullets items={e.bullets} />
                    </div>
                  ))}
                </div>
              </section>
            );
          case "education":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("education", resume)} />
                <div style={{ display: "grid", gap: "var(--s2, 11px)" }}>
                  {r.education.map((e) => (
                    <div key={e.id} className="sheet-entry" data-rs-entry={e.id}>
                      <div className="c-entry-head">
                        <span className="c-role">
                          {[e.degree, e.field].filter(Boolean).join(", ") || e.institution}
                        </span>
                        <span className="c-dates">
                          <Dates start={e.startDate} end={e.endDate} present={false} />
                        </span>
                      </div>
                      <div className="c-org">
                        <strong>{e.institution}</strong>
                        {e.location ? <span className="c-loc">{e.location}</span> : null}
                      </div>
                      {[e.gpa, e.honors].filter(Boolean).length > 0 ? (
                        <p className="c-org" style={{ marginTop: 2 }}>
                          {[e.gpa ? `GPA ${e.gpa}` : "", e.honors].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {e.coursework ? <p className="c-org" style={{ marginTop: 2 }}>Coursework: {e.coursework}</p> : null}
                      {e.thesis ? <p className="c-org" style={{ marginTop: 2 }}>Thesis: {e.thesis}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          case "skills":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("skills", resume)} />
                <div style={{ display: "grid", gap: "var(--s1, 7px)" }}>
                  {r.skills
                    .filter((g) => g.skills.length > 0)
                    .map((g) => (
                      <div key={g.id} className="c-org" style={{ display: "flex", gap: 8 }}>
                        <strong style={{ flexShrink: 0, color: "#3a362f" }}>{g.name}:</strong>
                        <span style={{ color: "#33312b" }}>{g.skills.join(", ")}</span>
                      </div>
                    ))}
                </div>
              </section>
            );
          case "projects":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Projects" />
                <div style={{ display: "grid", gap: "var(--s2, 11px)" }}>
                  {r.projects.map((p) => (
                    <div key={p.id} className="sheet-entry" data-rs-entry={p.id}>
                      <div className="c-entry-head">
                        <span className="c-role">{p.name}</span>
                        {p.link ? (
                          <span className="c-dates" style={{ color: "var(--accent)" }}>
                            <SheetHref href={p.link}>{cleanUrl(p.link)}</SheetHref>
                          </span>
                        ) : null}
                      </div>
                      {p.tech ? <div className="c-org"><strong>{p.tech}</strong></div> : null}
                      {p.description ? <p className="c-summary" style={{ marginTop: 3 }}>{p.description}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          case "certifications":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Certifications" />
                {r.certifications.map((c) => (
                  <p key={c.id} className="c-cert">
                    <strong>{c.name}</strong>
                    {c.issuer ? ` — ${c.issuer}` : ""}
                    {c.year ? ` (${c.year})` : ""}
                  </p>
                ))}
              </section>
            );
          case "languages":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Languages" />
                <div className="c-inline-list">
                  {r.languages.map((l) => (
                    <span key={l.id} className="c-lang">
                      <strong style={{ color: "#3a362f" }}>{l.name}</strong>
                      <span className="c-lang-level">{l.level}</span>
                    </span>
                  ))}
                </div>
              </section>
            );
          case "volunteer":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("volunteer", resume)} />
                <div style={{ display: "grid", gap: "var(--s2, 11px)" }}>
                  {r.volunteer.map((v) => (
                    <div key={v.id} className="sheet-entry" data-rs-entry={v.id}>
                      <div className="c-entry-head">
                        <span className="c-role">{v.title || v.org}</span>
                        <span className="c-dates">
                          <Dates start={v.startDate} end={v.endDate} present={v.present} />
                        </span>
                      </div>
                      <div className="c-org">
                        <strong>{v.org}</strong>
                        {v.location ? <span className="c-loc">{v.location}</span> : null}
                      </div>
                      <Bullets items={v.bullets} />
                    </div>
                  ))}
                </div>
              </section>
            );
          case "publications":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Publications" />
                <ul className="sheet-bullets">
                  {r.publications.map((p) => (
                    <li key={p.id} style={{ paddingLeft: 0 }}>
                      {citePublication(p, r.theme?.citationFormat ?? "apa")}
                      {p.url ? (
                        <span style={{ color: "var(--accent)" }}>
                          {" "}
                          <SheetHref href={p.url}>{cleanUrl(p.url)}</SheetHref>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          case "awards":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Awards & Honors" />
                {r.awards.map((a) => (
                  <p key={a.id} className="c-cert">
                    <strong>{a.title}</strong>
                    {a.org ? ` — ${a.org}` : ""}
                    {a.year ? ` (${a.year})` : ""}
                  </p>
                ))}
              </section>
            );
          case "teaching":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Teaching Experience" />
                <div style={{ display: "grid", gap: "var(--s2, 11px)" }}>
                  {r.teaching.map((t) => (
                    <div key={t.id} className="sheet-entry" data-rs-entry={t.id}>
                      <div className="c-entry-head">
                        <span className="c-role">{t.role}</span>
                        <span className="c-dates">
                          <Dates start={t.startDate} end={t.endDate} present={false} />
                        </span>
                      </div>
                      <div className="c-org">
                        <strong>{t.institution}</strong>
                        {t.course ? <span className="c-loc">{t.course}</span> : null}
                        {t.location ? <span className="c-loc">{t.location}</span> : null}
                      </div>
                      <Bullets items={t.bullets} />
                    </div>
                  ))}
                </div>
              </section>
            );
          case "grants":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Grants & Fellowships" />
                {r.grants.map((g) => (
                  <div key={g.id} className="sheet-entry" data-rs-entry={g.id} style={{ marginBottom: "var(--s1, 7px)" }}>
                    <div className="c-entry-head">
                      <span className="c-role">{g.name}</span>
                      <span className="c-dates">{g.year}</span>
                    </div>
                    <div className="c-org">
                      <strong>{g.funder}</strong>
                      {g.amount ? <span className="c-loc">{g.amount}</span> : null}
                    </div>
                    {g.description ? <p className="c-summary" style={{ marginTop: 3 }}>{g.description}</p> : null}
                  </div>
                ))}
              </section>
            );
          case "presentations":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Conference Presentations" />
                {r.presentations.map((p) => (
                  <p key={p.id} className="c-cert">
                    <strong>{p.title}</strong>
                    {p.event ? ` — ${p.event}` : ""}
                    {[p.year, p.location].filter(Boolean).join(", ") ? ` (${[p.year, p.location].filter(Boolean).join(", ")})` : ""}
                  </p>
                ))}
              </section>
            );
          case "affiliations":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Professional Affiliations" />
                {r.affiliations.map((a) => (
                  <p key={a.id} className="c-cert">
                    <strong>{a.name}</strong>
                    {a.role ? ` — ${a.role}` : ""}
                    {a.years ? ` (${a.years})` : ""}
                  </p>
                ))}
              </section>
            );
          case "references":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="References" />
                {r.references.map((ref) => (
                  <div key={ref.id} className="c-ref">
                    <strong>{ref.name}</strong>
                    {ref.title ? ` — ${ref.title}` : ""}
                    {ref.org ? ` at ${ref.org}` : ""}
                    <span style={{ color: "#8a8476" }}>
                      {ref.email ? ` · ${ref.email}` : ""}
                      {ref.phone ? ` · ${ref.phone}` : ""}
                    </span>
                  </div>
                ))}
              </section>
            );
          case "portfolio":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label="Portfolio" />
                <p className="c-summary">
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                    <SheetHref href={r.contact.portfolioUrl}>{cleanUrl(r.contact.portfolioUrl)}</SheetHref>
                  </span>
                </p>
              </section>
            );
          case "extras":
            return (
              <section key={s} className="sheet-section" data-rs-section={s}>
                <SectionHead label={headingFor("extras", resume)} />
                <ExtraDetails resume={resume} />
              </section>
            );
          default:
            return null;
        }
      })}
    </Sheet>
  );
}
