import type { ReactNode } from "react";
import type { Resume, SectionKey } from "../lib/types";
import { Sheet, Bullets, Dates, contactParts, effectiveSections, safeContact, SheetHref } from "./shared";
import { SectionBlock } from "./Sections";
import { Portrait } from "./graphical";
import { t } from "../lib/safe";
import { cleanUrl } from "../lib/date";

function splitName(name: string) {
  const parts = t(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "Your", last: "Name" };
  if (parts.length === 1) return { first: "", last: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function loc(resume: Resume) {
  const c = safeContact(resume);
  return [c.city, c.country].filter(Boolean).join(", ");
}

function blurb(resume: Resume) {
  return t(resume.useObjective ? resume.objective : resume.summary);
}

function jobsOf(resume: Resume) {
  return (resume.experience ?? []).filter((j) => t(j.role) || t(j.company));
}

function skillFlat(resume: Resume) {
  return (resume.skills ?? []).flatMap((g) => (g.skills ?? []).map((s) => t(s)).filter(Boolean));
}

function restOf(resume: Resume, exclude: SectionKey[]) {
  return (effectiveSections(resume) as SectionKey[]).filter((k) => !exclude.includes(k));
}

function studioMark(...parts: (string | undefined)[]) {
  const source = parts.map((p) => t(p)).find(Boolean) || "JOB";
  const words = source
    .replace(/[&/+,|]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(and|of|the|for|a|an)$/i.test(w));
  if (!words.length) return "JOB";
  if (words.length === 1) {
    const w = words[0];
    return (w.length <= 5 ? w : w.slice(0, 3)).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function TagHead({ children }: { children: ReactNode }) {
  return (
    <div className="hp-tag">
      <span className="hp-dot" />
      <span>{children}</span>
    </div>
  );
}

/** Black sidebar, gold rings, timeline main. */
export function GiltTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { first, last } = splitName(c.fullName);
  const jobs = jobsOf(resume);
  const langs = resume.languages ?? [];
  const skills = skillFlat(resume);
  const edu = resume.education ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages"]);
  return (
    <Sheet resume={resume} className="tpl-gilt hp-sheet" style={{ padding: 0 }}>
      <svg className="hp-gilt-deco" viewBox="0 0 220 220" aria-hidden>
        <circle cx="150" cy="60" r="70" fill="none" stroke="#EDE3D3" strokeWidth="26" />
        <circle cx="150" cy="60" r="70" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="60 400" />
      </svg>
      <aside className="hp-gilt-side">
        <div className="hp-gilt-ring">
          <Portrait name={c.fullName} src={c.photoUrl} className="hp-gilt-photo" />
        </div>
        {contactParts(resume).length ? (
          <div className="hp-gilt-block">
            <p className="hp-gilt-sh">Contact</p>
            {contactParts(resume).map((p) => (
              <p key={p} className="hp-gilt-line">
                {p}
              </p>
            ))}
          </div>
        ) : null}
        {langs.length ? (
          <div className="hp-gilt-block">
            <p className="hp-gilt-sh">Languages</p>
            {langs.map((l) => (
              <p key={l.id} className="hp-gilt-lang">
                <b>{l.name}</b> {l.level ? <span>({l.level})</span> : null}
              </p>
            ))}
          </div>
        ) : null}
      </aside>
      <main className="hp-gilt-main">
        <h1>
          {first ? <>{first.toUpperCase()} </> : null}
          <span>{last.toUpperCase()}</span>
        </h1>
        {c.title ? <p className="hp-gilt-role">{c.title}</p> : null}
        {blurb(resume) ? (
          <>
            <TagHead>About Me</TagHead>
            <p className="hp-about">{blurb(resume)}</p>
          </>
        ) : null}
        {jobs.length ? (
          <>
            <TagHead>Experience</TagHead>
            <div className="hp-tl">
              {jobs.map((j) => (
                <div key={j.id} className="hp-tl-item">
                  <p className="hp-tl-title">
                    {j.role || j.company}{" "}
                    <span>
                      — <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </p>
                  <p className="hp-tl-sub">
                    {j.company}
                    {j.location ? `, ${j.location}` : ""}
                  </p>
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </div>
          </>
        ) : null}
        {edu.length ? (
          <>
            <TagHead>Education</TagHead>
            <div className="hp-tl">
              {edu.map((e) => (
                <div key={e.id} className="hp-tl-item">
                  <p className="hp-tl-title">
                    {[e.degree, e.field].filter(Boolean).join(" ") || e.institution}{" "}
                    {e.endDate ? <span>— {e.endDate}</span> : null}
                  </p>
                  <p className="hp-tl-sub">{e.institution}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {skills.length ? (
          <>
            <TagHead>Skills</TagHead>
            <div className="hp-rings">
              {skills.map((s) => (
                <div key={s} className="hp-ring">
                  <div>{s}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {rest.map((k) => (
          <SectionBlock key={k} resume={resume} section={k} chips />
        ))}
      </main>
    </Sheet>
  );
}

/** Angled grey panel, pink photo ring. */
export function BevelTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const skills = skillFlat(resume);
  const langs = resume.languages ?? [];
  const edu = resume.education ?? [];
  const certs = resume.certifications ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages", "certifications"]);
  return (
    <Sheet resume={resume} className="tpl-bevel hp-sheet" style={{ padding: 0 }}>
      <div className="hp-bevel-panel" />
      <div className="hp-bevel-grid">
        <aside>
          <div className="hp-bevel-ring">
            <Portrait name={c.fullName} src={c.photoUrl} className="hp-bevel-photo" />
          </div>
          {contactParts(resume).length ? (
            <div className="hp-bevel-block">
              <p className="hp-bevel-sh">Contact</p>
              {contactParts(resume).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : null}
          {blurb(resume) ? (
            <div className="hp-bevel-block">
              <p className="hp-bevel-sh">Profile</p>
              <p className="hp-bevel-profile">{blurb(resume)}</p>
            </div>
          ) : null}
          {skills.length ? (
            <div className="hp-bevel-block">
              <p className="hp-bevel-sh">Skills</p>
              <ul>
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {langs.length ? (
            <div className="hp-bevel-block">
              <p className="hp-bevel-sh">Languages</p>
              <ul>
                {langs.map((l) => (
                  <li key={l.id}>
                    {l.name}
                    {l.level ? <span> {l.level}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
        <main>
          <h1>{(c.fullName || "Your Name").toUpperCase()}</h1>
          {c.title ? <p className="hp-bevel-title">{c.title}</p> : null}
          <hr />
          {jobs.length ? (
            <>
              <h2>Professional Experience</h2>
              {jobs.map((j) => (
                <div key={j.id} className="hp-bevel-job">
                  <p className="hp-bevel-job-t">{j.role || j.company}</p>
                  <p className="hp-bevel-job-m">
                    {[j.company, j.location].filter(Boolean).join(" — ")}
                    {j.startDate || j.present ? (
                      <>
                        {" | "}
                        <Dates start={j.startDate} end={j.endDate} present={j.present} />
                      </>
                    ) : null}
                  </p>
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </>
          ) : null}
          {edu.length ? (
            <>
              <h2>Education</h2>
              {edu.map((e) => (
                <div key={e.id} className="hp-bevel-job">
                  <p className="hp-bevel-job-t">{[e.degree, e.field].filter(Boolean).join(" ") || e.institution}</p>
                  <p className="hp-bevel-job-m">
                    {e.institution}
                    {e.endDate ? ` | ${e.endDate}` : ""}
                  </p>
                </div>
              ))}
            </>
          ) : null}
          {certs.length ? (
            <>
              <h2>Certifications</h2>
              {certs.map((x) => (
                <div key={x.id} className="hp-bevel-job">
                  <p className="hp-bevel-job-t">{x.name}</p>
                  <p className="hp-bevel-job-m">{[x.issuer, x.year].filter(Boolean).join(" | ")}</p>
                </div>
              ))}
            </>
          ) : null}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}

/** Huge stacked surname on grey paper. */
export function MastTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { first, last } = splitName(c.fullName);
  const jobs = jobsOf(resume);
  const skills = skillFlat(resume);
  const langs = resume.languages ?? [];
  const edu = resume.education ?? [];
  const certs = resume.certifications ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages", "certifications", "portfolio"]);
  const pf = t(c.portfolioUrl || c.website);
  return (
    <Sheet resume={resume} className="tpl-mast hp-sheet">
      <div className="hp-mast-top">
        <div>
          {first ? <p className="hp-mast-first">{first.toUpperCase()}</p> : null}
          <p className="hp-mast-last">{last.toUpperCase()}</p>
        </div>
        <ul className="hp-mast-contact">
          {contactParts(resume).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      {c.title ? <p className="hp-mast-role">{c.title.toUpperCase()}</p> : null}
      {blurb(resume) ? <p className="hp-mast-sum">{blurb(resume)}</p> : null}
      <div className="hp-mast-grid">
        <div>
          {jobs.length ? (
            <section>
              <h2>
                Experience<span>+</span>
              </h2>
              {jobs.map((j) => (
                <div key={j.id} className="hp-mast-job">
                  <p className="hp-mast-jt">{j.role || j.company}</p>
                  <p className="hp-mast-jm">
                    <span>{j.company}</span>
                    <span>
                      <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </p>
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </section>
          ) : null}
          {edu.length ? (
            <section>
              <h2>
                Education<span>+</span>
              </h2>
              {edu.map((e) => (
                <div key={e.id} className="hp-mast-job">
                  <p className="hp-mast-jt">{[e.degree, e.field].filter(Boolean).join(" ")}</p>
                  <p className="hp-mast-jm">{e.institution}</p>
                </div>
              ))}
            </section>
          ) : null}
          {certs.length ? (
            <section>
              <h2>
                Certifications<span>+</span>
              </h2>
              {certs.map((x) => (
                <div key={x.id} className="hp-mast-job">
                  <p className="hp-mast-jt">{x.name}</p>
                  <p className="hp-mast-jm">{[x.issuer, x.year].filter(Boolean).join(", ")}</p>
                </div>
              ))}
            </section>
          ) : null}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
        <aside>
          <Portrait name={c.fullName} src={c.photoUrl} className="hp-mast-photo" />
          {skills.length ? (
            <section>
              <h2>Skills</h2>
              <ul>
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {pf ? (
            <section>
              <h2>Portfolio</h2>
              <p className="hp-mast-pf">{cleanUrl(pf)}</p>
            </section>
          ) : null}
          {langs.length ? (
            <section>
              <h2>Languages</h2>
              <ul>
                {langs.map((l) => (
                  <li key={l.id}>
                    {l.name}
                    {l.level ? ` (${l.level})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </Sheet>
  );
}

/** Circle photo, red name, contact column. */
export function CarmineTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const rest = restOf(resume, ["summary", "objective", "experience"]);
  return (
    <Sheet resume={resume} className="tpl-carmine hp-sheet">
      <header className="hp-car-head">
        <Portrait name={c.fullName} src={c.photoUrl} className="hp-car-photo" />
        <div>
          <h1>{c.fullName || "Your Name"}</h1>
          {c.title ? <p className="hp-car-role">{c.title}</p> : null}
          {blurb(resume) ? <p className="hp-car-tag">{blurb(resume)}</p> : null}
        </div>
      </header>
      <hr />
      <div className="hp-car-grid">
        <aside>
          <h2>Hit me up</h2>
          {c.phone ? (
            <div className="hp-car-item">
              <p>Mobile</p>
              <span>
                <SheetHref href={c.phone}>{c.phone}</SheetHref>
              </span>
            </div>
          ) : null}
          {c.email ? (
            <div className="hp-car-item">
              <p>Email</p>
              <span>
                <SheetHref href={c.email}>{c.email}</SheetHref>
              </span>
            </div>
          ) : null}
          {c.linkedin ? (
            <div className="hp-car-item">
              <p>LinkedIn</p>
              <span>
                <SheetHref href={c.linkedin}>{cleanUrl(c.linkedin)}</SheetHref>
              </span>
            </div>
          ) : null}
          {c.github ? (
            <div className="hp-car-item">
              <p>GitHub</p>
              <span>
                <SheetHref href={c.github}>{cleanUrl(c.github)}</SheetHref>
              </span>
            </div>
          ) : null}
          {c.website || c.portfolioUrl ? (
            <div className="hp-car-item">
              <p>Website</p>
              <span>
                <SheetHref href={c.website || c.portfolioUrl}>{cleanUrl(c.website || c.portfolioUrl)}</SheetHref>
              </span>
            </div>
          ) : null}
          {loc(resume) ? (
            <div className="hp-car-item">
              <p>Address</p>
              <span>{loc(resume)}</span>
            </div>
          ) : null}
        </aside>
        <div>
          {jobs.length ? <h2>Work Experience</h2> : null}
          {jobs.map((j) => (
            <div key={j.id} className="hp-car-job">
              <p className="hp-car-jt">{j.role || j.company}</p>
              <p className="hp-car-jm">
                {[j.company, j.location].filter(Boolean).join(", ")}
                {j.startDate || j.present ? (
                  <>
                    {" | "}
                    <Dates start={j.startDate} end={j.endDate} present={j.present} />
                  </>
                ) : null}
              </p>
              <Bullets items={j.bullets} />
            </div>
          ))}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Blush paper, circled photo, orange type. */
export function BlushTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { first, last } = splitName(c.fullName);
  const jobs = jobsOf(resume);
  const edu = resume.education ?? [];
  const skills = skillFlat(resume);
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills"]);
  return (
    <Sheet resume={resume} className="tpl-blush hp-sheet" style={{ padding: 0 }}>
      <div className="hp-blush-page">
        <div className="hp-blush-v" />
        <aside>
          <div className="hp-blush-wrap">
            <Portrait name={c.fullName} src={c.photoUrl} className="hp-blush-photo" />
          </div>
          <div className="hp-blush-h">
            <span />
            <h2>Contact</h2>
          </div>
          {contactParts(resume).map((p) => (
            <p key={p} className="hp-blush-c">
              {p}
            </p>
          ))}
          {edu.length ? (
            <>
              <div className="hp-blush-h">
                <span />
                <h2>Education</h2>
              </div>
              {edu.map((e) => (
                <div key={e.id} className="hp-blush-edu">
                  <p>{[e.degree, e.field].filter(Boolean).join(" ")}</p>
                  <p>
                    {e.startDate} {e.endDate ? `– ${e.endDate}` : ""}
                  </p>
                  <p>{e.institution}</p>
                </div>
              ))}
            </>
          ) : null}
          {skills.length ? (
            <>
              <div className="hp-blush-h">
                <span />
                <h2>Skills</h2>
              </div>
              {skills.map((s, i) => (
                <div key={s} className="hp-blush-sk">
                  <p>{s}</p>
                  <div>
                    <i style={{ left: `${Math.max(22, 88 - i * 8)}%` }} />
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </aside>
        <main>
          <h1>
            {first}
            <span>{last}</span>
          </h1>
          {c.title ? <p className="hp-blush-pos">{c.title}</p> : null}
          <hr />
          {blurb(resume) ? (
            <>
              <div className="hp-blush-h">
                <span />
                <h2>Summary</h2>
              </div>
              <p className="hp-about">{blurb(resume)}</p>
            </>
          ) : null}
          {jobs.length ? (
            <>
              <div className="hp-blush-h">
                <span />
                <h2>Job Experience</h2>
              </div>
              {jobs.map((j) => (
                <div key={j.id} className="hp-blush-job">
                  <div className="hp-blush-jt">
                    <div>
                      <p>{j.role || j.company}</p>
                      <p>
                        {j.company}
                        {j.location ? ` / ${j.location}` : ""}
                      </p>
                    </div>
                    <span>
                      <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </div>
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </>
          ) : null}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}

/** Dark cinematic hero + numbered jobs. */
export function ReelTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const edu = resume.education ?? [];
  const vol = resume.volunteer ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "volunteer"]);
  return (
    <Sheet resume={resume} className="tpl-reel hp-sheet" style={{ padding: 0 }}>
      <div className="hp-reel-page">
        <header className="hp-reel-hero">
          <div className="hp-reel-top">
            <div>
              <h1>{c.fullName || "Your Name"}</h1>
              <div className="hp-reel-rule" />
              {c.title ? <p className="hp-reel-role">{c.title}</p> : null}
            </div>
            <Portrait name={c.fullName} src={c.photoUrl} className="hp-reel-ava" />
          </div>
          {blurb(resume) ? <p className="hp-reel-quote">{blurb(resume)}</p> : null}
          {contactParts(resume).length ? (
            <div className="hp-reel-contact">
              {contactParts(resume).map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          ) : null}
          {edu.length ? (
            <div className="hp-reel-edu">
              {edu.map((e) => (
                <div key={e.id}>
                  <p>{e.institution}</p>
                  <p>{[e.degree, e.field].filter(Boolean).join(" ")}</p>
                </div>
              ))}
            </div>
          ) : null}
        </header>
        {jobs.length ? <h2>Work Experience</h2> : null}
        {jobs.map((j, i) => (
          <div key={j.id} className="hp-reel-job">
            <span>{i + 1}</span>
            <div className="hp-reel-logo">{studioMark(j.company, j.role)}</div>
            <div>
              <p>
                {j.company ? <b>{j.company}</b> : <b>{j.role}</b>}
                {j.company && j.role && j.role.toLowerCase() !== j.company.toLowerCase() ? <span> | {j.role}</span> : null}
              </p>
              <Bullets items={j.bullets} />
            </div>
            <p className="hp-reel-date">
              <Dates start={j.startDate} end={j.endDate} present={j.present} />
            </p>
          </div>
        ))}
        {vol.length ? (
          <>
            <h2>Other Activities</h2>
            <div className="hp-reel-acts">
              {vol.map((v) => (
                <div key={v.id} className="hp-reel-act">
                  <div>{studioMark(v.org, v.title)}</div>
                  <p>{v.title}</p>
                  <p>{v.org}</p>
                  <Bullets items={v.bullets} />
                </div>
              ))}
            </div>
          </>
        ) : null}
        {rest.map((k) => (
          <SectionBlock key={k} resume={resume} section={k} chips />
        ))}
      </div>
    </Sheet>
  );
}

/** Teal header, objective band, two-column body. */
export function LagoonTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const edu = resume.education ?? [];
  const skills = resume.skills ?? [];
  const langs = resume.languages ?? [];
  const awards = resume.awards ?? [];
  const certs = resume.certifications ?? [];
  const vol = resume.volunteer ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages", "awards", "certifications", "volunteer"]);
  return (
    <Sheet resume={resume} className="tpl-lagoon hp-sheet" style={{ padding: 0 }}>
      <header className="hp-lag-head">
        <div>
          <h1>{c.fullName || "Your Name"}</h1>
          {c.title ? <p>{c.title}</p> : null}
        </div>
        <div className="hp-lag-photo-wrap">
          <i />
          <Portrait name={c.fullName} src={c.photoUrl} className="hp-lag-photo" />
        </div>
      </header>
      <div className="hp-lag-band">
        <h2>{resume.useObjective ? "Objective" : "Profile"}</h2>
        {blurb(resume) ? <p>{blurb(resume)}</p> : null}
        <div className="hp-lag-info">
          {contactParts(resume).map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </div>
      <div className="hp-lag-grid">
        <div>
          {edu.length ? (
            <section>
              <h3>Education</h3>
              {edu.map((e) => (
                <div key={e.id} className="hp-lag-item">
                  <p>
                    {e.institution} <span>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
                  </p>
                  <p>{[e.degree, e.field, e.gpa ? `GPA ${e.gpa}` : ""].filter(Boolean).join(" · ")}</p>
                </div>
              ))}
            </section>
          ) : null}
          {jobs.length ? (
            <section>
              <h3>Work Experience</h3>
              {jobs.map((j) => (
                <div key={j.id} className="hp-lag-item">
                  <p>
                    {j.company}{" "}
                    <span>
                      <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </p>
                  <p>{j.role}</p>
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </section>
          ) : null}
          {vol.length ? (
            <section>
              <h3>Volunteer</h3>
              {vol.map((v) => (
                <div key={v.id} className="hp-lag-item">
                  <p>{v.org}</p>
                  <p>{v.title}</p>
                  <Bullets items={v.bullets} />
                </div>
              ))}
            </section>
          ) : null}
        </div>
        <div>
          {skills.length ? (
            <section>
              <h3>Skills</h3>
              {skills.map((g) => (
                <div key={g.id} className="hp-lag-item">
                  <p>{g.name || "Skills"}</p>
                  <p>{(g.skills ?? []).filter((s) => t(s)).join(", ")}</p>
                </div>
              ))}
            </section>
          ) : null}
          {langs.length ? (
            <section>
              <h3>Languages</h3>
              <p>{langs.map((l) => [l.name, l.level].filter(Boolean).join(" ")).join(", ")}</p>
            </section>
          ) : null}
          {awards.length ? (
            <section>
              <h3>Awards</h3>
              {awards.map((a) => (
                <div key={a.id} className="hp-lag-item">
                  <p>{a.year}</p>
                  <p>{[a.title, a.org].filter(Boolean).join(" — ")}</p>
                </div>
              ))}
            </section>
          ) : null}
          {certs.length ? (
            <section>
              <h3>Certifications</h3>
              {certs.map((x) => (
                <div key={x.id} className="hp-lag-item">
                  <p>{x.year}</p>
                  <p>{[x.name, x.issuer].filter(Boolean).join(" — ")}</p>
                </div>
              ))}
            </section>
          ) : null}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Dark streaming-profile layout. */
export function StreamTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const edu = resume.education ?? [];
  const skills = resume.skills ?? [];
  const projects = resume.projects ?? [];
  const awards = resume.awards ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "projects", "awards"]);
  return (
    <Sheet resume={resume} className="tpl-stream hp-sheet" style={{ padding: 0 }}>
      <div className="hp-str-page">
        <div className="hp-str-bar">
          <span>Profile</span>
          <div>
            {contactParts(resume).map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
        <div className="hp-str-hero">
          <Portrait name={c.fullName} src={c.photoUrl} className="hp-str-poster" />
          <div>
            <h1>{(c.fullName || "Your Name").toUpperCase()}</h1>
            {c.title ? <p className="hp-str-role">{c.title}</p> : null}
            {blurb(resume) ? <p className="hp-str-sum">{blurb(resume)}</p> : null}
          </div>
        </div>
        <div className="hp-str-2">
          <div>
            {edu.length ? <h2>Education</h2> : null}
            {edu.map((e) => (
              <div key={e.id} className="hp-str-tile">
                <p>{[e.degree, e.field].filter(Boolean).join(" ") || e.institution}</p>
                <p>{e.institution}</p>
                {e.location ? <p>{e.location}</p> : null}
                {e.endDate ? <span>{e.endDate}</span> : null}
              </div>
            ))}
          </div>
          <div>
            {skills.length ? <h2>Skills</h2> : null}
            {skills.map((g) => (
              <div key={g.id} className="hp-str-tile">
                <p>{g.name || "Skills"}</p>
                <ul>
                  {(g.skills ?? []).filter((s) => t(s)).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {jobs.length ? <h2>Experience</h2> : null}
        {jobs.map((j) => (
          <div key={j.id} className="hp-str-job">
            <div>
              <b>{(j.company || j.role).toUpperCase()}</b>
              <span>
                <Dates start={j.startDate} end={j.endDate} present={j.present} />
              </span>
            </div>
            <p>
              {j.role && j.company && j.role.toLowerCase() !== j.company.toLowerCase() ? j.role : ""}
              {j.location ? ` · ${j.location}` : ""}
            </p>
            <Bullets items={j.bullets} />
          </div>
        ))}
        {projects.length ? (
          <div className="hp-str-projects">
            <h2>Projects</h2>
            {projects.map((p) => (
              <div key={p.id} className="hp-str-project">
                <b>{p.name || "Project"}</b>
                {p.description ? <p>{p.description}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {awards.length ? (
          <div className="hp-str-tile">
            <p>Achievements</p>
            <ul>
              {awards.map((a) => (
                <li key={a.id}>{[a.title, a.org, a.year].filter(Boolean).join(" · ")}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {rest.map((k) => (
          <SectionBlock key={k} resume={resume} section={k} chips />
        ))}
      </div>
    </Sheet>
  );
}

/** Forest clipped header, amber dots. */
export function GroveTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const skills = skillFlat(resume);
  const edu = resume.education ?? [];
  const langs = resume.languages ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages"]);
  return (
    <Sheet resume={resume} className="tpl-grove hp-sheet" style={{ padding: 0 }}>
      <header className="hp-grove-head">
        <h1>{c.fullName || "Your Name"}</h1>
        {c.title ? <p>{c.title}</p> : null}
        <div className="hp-grove-strip">
          {contactParts(resume).map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </header>
      <div className="hp-grove-grid">
        <main>
          {blurb(resume) ? (
            <section>
              <h2>
                <i />
                Profile
              </h2>
              <p>{blurb(resume)}</p>
            </section>
          ) : null}
          {jobs.length ? (
            <section>
              <h2>
                <i />
                Experience
              </h2>
              {jobs.map((j) => (
                <div key={j.id} className="hp-grove-job">
                  <div>
                    <b>{j.role || j.company}</b>
                    <span>
                      <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </div>
                  {j.role && j.company ? (
                    <p>
                      {j.company}
                      {j.location ? ` — ${j.location}` : ""}
                    </p>
                  ) : j.location ? (
                    <p>{j.location}</p>
                  ) : null}
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </section>
          ) : null}
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
        <aside>
          {skills.length ? (
            <section>
              <h3>Skills</h3>
              {skills.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </section>
          ) : null}
          {edu.length ? (
            <section>
              <h3>Education</h3>
              {edu.map((e) => (
                <div key={e.id}>
                  <p>{[e.degree, e.field].filter(Boolean).join(" ")}</p>
                  <p>{e.institution}</p>
                </div>
              ))}
            </section>
          ) : null}
          {langs.length ? (
            <section>
              <h3>Languages</h3>
              {langs.map((l) => (
                <p key={l.id}>
                  {l.name} <span>{l.level}</span>
                </p>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </Sheet>
  );
}

/** Navy gold executive sidebar. */
export function BoardroomTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const jobs = jobsOf(resume);
  const skills = skillFlat(resume);
  const langs = resume.languages ?? [];
  const edu = resume.education ?? [];
  const rest = restOf(resume, ["summary", "objective", "experience", "education", "skills", "languages"]);
  return (
    <Sheet resume={resume} className="tpl-boardroom hp-sheet" style={{ padding: 0 }}>
      <aside className="hp-br-side">
        <Portrait name={c.fullName} src={c.photoUrl} className="hp-br-ava" />
        <h1>{c.fullName || "Your Name"}</h1>
        {c.title ? <p className="hp-br-role">{c.title}</p> : null}
        <div className="hp-br-rule" />
        {contactParts(resume).length ? (
          <div>
            <p className="hp-br-sh">Contact</p>
            {contactParts(resume).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ) : null}
        {skills.length ? (
          <div>
            <p className="hp-br-sh">Core Skills</p>
            {skills.map((s, i) => (
              <div key={s} className="hp-br-sk">
                <span>{s}</span>
                <div>
                  <i style={{ width: `${Math.max(28, 92 - i * 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {langs.length ? (
          <div>
            <p className="hp-br-sh">Languages</p>
            {langs.map((l) => (
              <p key={l.id} className="hp-br-lang">
                <span>{l.name}</span>
                <span>{l.level}</span>
              </p>
            ))}
          </div>
        ) : null}
      </aside>
      <main className="hp-br-main">
        {blurb(resume) ? (
          <section>
            <h2>Profile</h2>
            <p>{blurb(resume)}</p>
          </section>
        ) : null}
        {jobs.length ? (
          <section>
            <h2>Experience</h2>
            <div className="hp-br-tl">
              {jobs.map((j) => (
                <div key={j.id}>
                  <div>
                    <b>
                      {j.role}
                      {j.company ? ` — ${j.company}` : ""}
                    </b>
                    <span>
                      <Dates start={j.startDate} end={j.endDate} present={j.present} />
                    </span>
                  </div>
                  {j.location ? <p>{j.location}</p> : null}
                  <Bullets items={j.bullets} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {edu.length ? (
          <section>
            <h2>Education</h2>
            {edu.map((e) => (
              <div key={e.id}>
                <b>{[e.degree, e.field].filter(Boolean).join(" ")}</b>
                <p>{e.institution}</p>
              </div>
            ))}
          </section>
        ) : null}
        {rest.map((k) => (
          <SectionBlock key={k} resume={resume} section={k} chips={false} />
        ))}
      </main>
    </Sheet>
  );
}
