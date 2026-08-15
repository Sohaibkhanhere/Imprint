import type { Resume, SectionKey } from "../lib/types";
import { Sheet, contactParts, effectiveSections, safeContact } from "./shared";
import { SectionBlock } from "./Sections";
import { Portrait } from "./graphical";
import { t } from "../lib/safe";

const SIDE_A: SectionKey[] = ["skills", "languages", "certifications", "references"];
const SIDE_B: SectionKey[] = ["skills", "education", "languages"];
const SIDE_C: SectionKey[] = ["education", "skills", "languages", "certifications"];

function zones(resume: Resume, side: SectionKey[]) {
  const all = effectiveSections(resume) as SectionKey[];
  return {
    side: all.filter((k) => side.includes(k)),
    main: all.filter((k) => !side.includes(k)),
  };
}

function Lines({ resume }: { resume: Resume }) {
  return (
    <>
      {contactParts(resume).map((p) => (
        <div key={p} className="g-line">
          {p}
        </div>
      ))}
    </>
  );
}

export function RibbonNavyTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume, SIDE_A);
  return (
    <Sheet resume={resume} className="tpl-ribbon-navy g-sheet" style={{ padding: 0 }}>
      <div className="rn-layout">
        <aside className="rn-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="rn-photo" />
          <h3 className="rn-pill">Contact</h3>
          <Lines resume={resume} />
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </aside>
        <main className="rn-main">
          <header className="rn-head">
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
          </header>
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}

export function SageOverlapTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const blurb = resume.useObjective ? resume.objective : resume.summary;
  const { side, main } = zones(resume, SIDE_B);
  const rest = main.filter((k) => k !== "summary" && k !== "objective");
  return (
    <Sheet resume={resume} className="tpl-sage-overlap g-sheet" style={{ padding: 0 }}>
      <div className="so-layout">
        <header className="so-nameblock">
          <h1>{c.fullName || "Your Name"}</h1>
          {c.title ? <p>{c.title}</p> : null}
        </header>
        <div className="so-photorow">
          <Portrait name={c.fullName} src={c.photoUrl} className="so-photo" />
        </div>
        {t(blurb) ? (
          <div className="so-about">
            <span>About Me</span>
            <p>{blurb}</p>
          </div>
        ) : null}
        <div className="so-left">
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
          <div className="so-contact">
            <Lines resume={resume} />
          </div>
        </div>
        <div className="so-right">
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function CircuitDarkTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const blurb = resume.useObjective ? resume.objective : resume.summary;
  const all = effectiveSections(resume) as SectionKey[];
  const rest = all.filter((k) => k !== "summary" && k !== "objective" && k !== "skills");
  const showSkills = all.includes("skills");
  return (
    <Sheet resume={resume} className="tpl-circuit-dark g-sheet" style={{ padding: 0 }}>
      <div className="cd-wrap">
        <div className="cd-circuit" />
        <header className="cd-head">
          <Portrait name={c.fullName} src={c.photoUrl} className="cd-photo" />
          <div>
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p className="cd-title">{c.title}</p> : null}
            {t(blurb) ? <p className="cd-blurb">{blurb}</p> : null}
          </div>
        </header>
        {contactParts(resume).length ? (
          <div className="cd-bar">
            {contactParts(resume).map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        ) : null}
        <div className="cd-grid">
          {rest.map((k) => (
            <div key={k} className="cd-card">
              <SectionBlock resume={resume} section={k} chips={false} />
            </div>
          ))}
          {showSkills ? (
            <div className="cd-card cd-skills">
              <SectionBlock resume={resume} section="skills" chips />
            </div>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}

export function TerraWaveTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume, SIDE_C);
  return (
    <Sheet resume={resume} className="tpl-terra-wave g-sheet" style={{ padding: 0 }}>
      <div className="tw-layout">
        <svg className="tw-wave tw-wave-tr" viewBox="0 0 220 160" aria-hidden>
          <path d="M40 0h180v160C140 120 90 40 0 20V0h40z" fill="currentColor" />
        </svg>
        <svg className="tw-wave tw-wave-bl" viewBox="0 0 180 140" aria-hidden>
          <path d="M0 140h180C80 110 40 50 0 0v140z" fill="currentColor" />
        </svg>
        <div className="tw-main">
          <header className="tw-head">
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
          </header>
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </div>
        <aside className="tw-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="tw-photo" />
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
          <div className="tw-contact">
            <h3>Contact</h3>
            <Lines resume={resume} />
          </div>
        </aside>
      </div>
    </Sheet>
  );
}

export function StadiumBannerTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const blurb = resume.useObjective ? resume.objective : resume.summary;
  const { side, main } = zones(resume, ["skills", "languages", "certifications"]);
  const rest = main.filter((k) => k !== "summary" && k !== "objective");
  return (
    <Sheet resume={resume} className="tpl-stadium-banner g-sheet" style={{ padding: 0 }}>
      <div className="sb-layout">
        <header className="sb-banner">
          <div>
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
            {t(blurb) ? <p className="sb-blurb">{blurb}</p> : null}
          </div>
          <Portrait name={c.fullName} src={c.photoUrl} className="sb-photo" />
        </header>
        <aside className="sb-left">
          <h3>Contact</h3>
          <Lines resume={resume} />
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </aside>
        <main className="sb-right">
          {rest.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}

export function PolaroidBurstTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const blurb = resume.useObjective ? resume.objective : resume.summary;
  const { side, main } = zones(resume, ["education", "languages", "skills"]);
  const rest = main.filter((k) => k !== "summary" && k !== "objective");
  return (
    <Sheet resume={resume} className="tpl-polaroid-burst g-sheet" style={{ padding: 0 }}>
      <div className="pb-layout">
        <div className="pb-sun" />
        <header className="pb-head">
          <div className="pb-polaroid">
            <Portrait name={c.fullName} src={c.photoUrl} className="pb-photo" />
          </div>
          <div>
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
            <Lines resume={resume} />
          </div>
        </header>
        {t(blurb) ? (
          <div className="pb-about">
            <h3>About Me</h3>
            <p>{blurb}</p>
          </div>
        ) : null}
        <div className="pb-cols">
          <aside>
            {side.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </aside>
          <main>
            {rest.map((k) => (
              <SectionBlock key={k} resume={resume} section={k} chips={false} />
            ))}
          </main>
        </div>
      </div>
    </Sheet>
  );
}

export function ForestGeoTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume, ["skills", "education", "languages", "certifications"]);
  return (
    <Sheet resume={resume} className="tpl-forest-geo g-sheet" style={{ padding: 0 }}>
      <div className="fg-layout">
        <div className="fg-geo" />
        <header className="fg-head">
          <div>
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
          </div>
          <Portrait name={c.fullName} src={c.photoUrl} className="fg-photo" />
        </header>
        <aside className="fg-side">
          <h3>Contact</h3>
          <Lines resume={resume} />
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </aside>
        <main className="fg-main">
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
        <div className="fg-foot" />
      </div>
    </Sheet>
  );
}

export function GoldCutTemplate({ resume }: { resume: Resume }) {
  const c = safeContact(resume);
  const { side, main } = zones(resume, SIDE_A);
  return (
    <Sheet resume={resume} className="tpl-gold-cut g-sheet" style={{ padding: 0 }}>
      <div className="gc-layout">
        <div className="gc-geo" />
        <aside className="gc-side">
          <Portrait name={c.fullName} src={c.photoUrl} className="gc-photo" />
          <h3>Contact</h3>
          <Lines resume={resume} />
          {side.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </aside>
        <main className="gc-main">
          <header>
            <h1>{c.fullName || "Your Name"}</h1>
            {c.title ? <p>{c.title}</p> : null}
          </header>
          {main.map((k) => (
            <SectionBlock key={k} resume={resume} section={k} chips={false} />
          ))}
        </main>
      </div>
    </Sheet>
  );
}
