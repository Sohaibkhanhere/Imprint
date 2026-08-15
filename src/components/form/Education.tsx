import { Field, Input, EntryCard, AddButton } from "../ui";
import { useEntryList } from "./useEntryList";
import { uid } from "../../lib/date";
import type { EducationEntry, ProjectEntry, CertificationEntry, LanguageEntry, PublicationEntry, AwardEntry, GrantEntry, PresentationEntry, AffiliationEntry, ReferenceEntry, FluencyLevel } from "../../lib/types";

const FLUENCY_LEVELS: FluencyLevel[] = ["Native", "Fluent", "Professional", "Conversational"];

const emptyEducation = (): EducationEntry => ({ id: uid(), institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "", honors: "", coursework: "", thesis: "" });
const emptyProject = (): ProjectEntry => ({ id: uid(), name: "", description: "", tech: "", link: "" });
const emptyCertification = (): CertificationEntry => ({ id: uid(), name: "", issuer: "", year: "", expires: "" });
const emptyLanguage = (): LanguageEntry => ({ id: uid(), name: "", level: "Native" });
const emptyPublication = (): PublicationEntry => ({ id: uid(), title: "", venue: "", year: "", authors: "", url: "" });
const emptyAward = (): AwardEntry => ({ id: uid(), title: "", org: "", year: "" });
const emptyGrant = (): GrantEntry => ({ id: uid(), name: "", funder: "", amount: "", year: "", description: "" });
const emptyPresentation = (): PresentationEntry => ({ id: uid(), title: "", event: "", year: "", location: "" });
const emptyAffiliation = (): AffiliationEntry => ({ id: uid(), name: "", role: "", years: "" });
const emptyReference = (): ReferenceEntry => ({ id: uid(), name: "", title: "", org: "", email: "", phone: "" });

export function EducationForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<EducationEntry>("education", emptyEducation);

  return (
    <div className="space-y-3">
      {rendered.map((e) => (
        <EntryCard
          key={e.id}
          title={e.degree ? (e.field ? `${e.degree}, ${e.field}` : e.degree) : e.institution}
          subtitle={e.institution}
          onRemove={isEmpty ? undefined : () => remove(e.id)}
          onMoveUp={isEmpty ? undefined : () => move(e.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(e.id, 1)}
        >
          <Field label="Degree">
            <Input value={e.degree} onChange={(ev) => update(e.id, { degree: ev.target.value })} placeholder="B.A." />
          </Field>
          <Field label="Field of study">
            <Input value={e.field} onChange={(ev) => update(e.id, { field: ev.target.value })} placeholder="Marketing" />
          </Field>
          <Field label="Institution">
            <Input value={e.institution} onChange={(ev) => update(e.id, { institution: ev.target.value })} placeholder="Northwestern University" />
          </Field>
          <Field label="Location">
            <Input value={e.location} onChange={(ev) => update(e.id, { location: ev.target.value })} placeholder="Evanston, IL" />
          </Field>
          <Field label="Start year">
            <Input value={e.startDate} onChange={(ev) => update(e.id, { startDate: ev.target.value })} placeholder="2012" />
          </Field>
          <Field label="End year">
            <Input value={e.endDate} onChange={(ev) => update(e.id, { endDate: ev.target.value })} placeholder="2016" />
          </Field>
          <Field label="GPA (optional)" hint="Only if 3.5+ or you're a student/recent grad">
            <Input value={e.gpa} onChange={(ev) => update(e.id, { gpa: ev.target.value })} placeholder="3.7" />
          </Field>
          <Field label="Honors">
            <Input value={e.honors} onChange={(ev) => update(e.id, { honors: ev.target.value })} placeholder="Magna cum laude" />
          </Field>
          <Field label="Thesis / dissertation title" hint="Used by the Academic CV template">
            <Input value={e.thesis} onChange={(ev) => update(e.id, { thesis: ev.target.value })} placeholder="Title of thesis" />
          </Field>
          <Field label="Relevant coursework" hint="Mostly for entry-level / recent grads">
            <Input value={e.coursework} onChange={(ev) => update(e.id, { coursework: ev.target.value })} placeholder="Consumer Behavior, Brand Strategy, Data Analytics" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add education" onClick={add} />
    </div>
  );
}

export function ProjectsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<ProjectEntry>("projects", emptyProject);

  return (
    <div className="space-y-3">
      {rendered.map((p) => (
        <EntryCard
          key={p.id}
          title={p.name}
          onRemove={isEmpty ? undefined : () => remove(p.id)}
          onMoveUp={isEmpty ? undefined : () => move(p.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(p.id, 1)}
        >
          <Field label="Project name">
            <Input value={p.name} onChange={(ev) => update(p.id, { name: ev.target.value })} placeholder="Growth Playbook for B2B SaaS" />
          </Field>
          <Field label="Link">
            <Input value={p.link} onChange={(ev) => update(p.id, { link: ev.target.value })} placeholder="github.com/you/project" />
          </Field>
          <Field label="Tech / tools used">
            <Input value={p.tech} onChange={(ev) => update(p.id, { tech: ev.target.value })} placeholder="Notion, GA4, Figma" />
          </Field>
          <Field label="Description (1–2 lines, quantified)">
            <Input value={p.description} onChange={(ev) => update(p.id, { description: ev.target.value })} placeholder="Drew 12K organic visits and 400 signups in the first quarter." />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add project" onClick={add} />
    </div>
  );
}

export function CertificationsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<CertificationEntry>("certifications", emptyCertification);

  return (
    <div className="space-y-3">
      {rendered.map((c) => (
        <EntryCard
          key={c.id}
          title={c.name}
          subtitle={c.issuer}
          onRemove={isEmpty ? undefined : () => remove(c.id)}
          onMoveUp={isEmpty ? undefined : () => move(c.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(c.id, 1)}
        >
          <Field label="Name">
            <Input value={c.name} onChange={(ev) => update(c.id, { name: ev.target.value })} placeholder="Google Analytics 4 Certified" />
          </Field>
          <Field label="Issuer">
            <Input value={c.issuer} onChange={(ev) => update(c.id, { issuer: ev.target.value })} placeholder="Google" />
          </Field>
          <Field label="Year">
            <Input value={c.year} onChange={(ev) => update(c.id, { year: ev.target.value })} placeholder="2023" />
          </Field>
          <Field label="Expires (optional)" hint="Flagged in health checks if set">
            <Input value={c.expires} onChange={(ev) => update(c.id, { expires: ev.target.value })} placeholder="2025" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add certification" onClick={add} />
    </div>
  );
}

export function LanguagesForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<LanguageEntry>("languages", emptyLanguage);

  return (
    <div className="space-y-3">
      {rendered.map((l) => (
        <EntryCard
          key={l.id}
          title={l.name}
          subtitle={l.level}
          onRemove={isEmpty ? undefined : () => remove(l.id)}
          onMoveUp={isEmpty ? undefined : () => move(l.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(l.id, 1)}
        >
          <Field label="Language">
            <Input value={l.name} onChange={(ev) => update(l.id, { name: ev.target.value })} placeholder="Spanish" />
          </Field>
          <Field label="Proficiency">
            <select
              value={l.level}
              onChange={(ev) => update(l.id, { level: ev.target.value })}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {FLUENCY_LEVELS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add language" onClick={add} />
    </div>
  );
}

export function PublicationsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<PublicationEntry>("publications", emptyPublication);

  return (
    <div className="space-y-3">
      {rendered.map((p) => (
        <EntryCard
          key={p.id}
          title={p.title}
          subtitle={p.venue}
          onRemove={isEmpty ? undefined : () => remove(p.id)}
          onMoveUp={isEmpty ? undefined : () => move(p.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(p.id, 1)}
        >
          <Field label="Title">
            <Input value={p.title} onChange={(ev) => update(p.id, { title: ev.target.value })} placeholder="Title of the work" />
          </Field>
          <Field label="Venue / Journal">
            <Input value={p.venue} onChange={(ev) => update(p.id, { venue: ev.target.value })} placeholder="Journal of X, Vol. 12" />
          </Field>
          <Field label="Authors">
            <Input value={p.authors} onChange={(ev) => update(p.id, { authors: ev.target.value })} placeholder="Khan, A., Smith, J." />
          </Field>
          <Field label="Year">
            <Input value={p.year} onChange={(ev) => update(p.id, { year: ev.target.value })} placeholder="2022" />
          </Field>
          <Field label="URL / DOI">
            <Input value={p.url} onChange={(ev) => update(p.id, { url: ev.target.value })} placeholder="https://doi.org/…" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add publication" onClick={add} />
    </div>
  );
}

export function AwardsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<AwardEntry>("awards", emptyAward);

  return (
    <div className="space-y-3">
      {rendered.map((a) => (
        <EntryCard
          key={a.id}
          title={a.title}
          subtitle={a.org}
          onRemove={isEmpty ? undefined : () => remove(a.id)}
          onMoveUp={isEmpty ? undefined : () => move(a.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(a.id, 1)}
        >
          <Field label="Award">
            <Input value={a.title} onChange={(ev) => update(a.id, { title: ev.target.value })} placeholder="Marketing Team of the Year" />
          </Field>
          <Field label="Organization">
            <Input value={a.org} onChange={(ev) => update(a.id, { org: ev.target.value })} placeholder="Lumenly" />
          </Field>
          <Field label="Year">
            <Input value={a.year} onChange={(ev) => update(a.id, { year: ev.target.value })} placeholder="2023" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add award" onClick={add} />
    </div>
  );
}

export function GrantsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<GrantEntry>("grants", emptyGrant);

  return (
    <div className="space-y-3">
      {rendered.map((g) => (
        <EntryCard
          key={g.id}
          title={g.name}
          subtitle={g.funder}
          onRemove={isEmpty ? undefined : () => remove(g.id)}
          onMoveUp={isEmpty ? undefined : () => move(g.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(g.id, 1)}
        >
          <Field label="Grant / award name">
            <Input value={g.name} onChange={(ev) => update(g.id, { name: ev.target.value })} placeholder="NSF Graduate Research Fellowship" />
          </Field>
          <Field label="Funder">
            <Input value={g.funder} onChange={(ev) => update(g.id, { funder: ev.target.value })} placeholder="National Science Foundation" />
          </Field>
          <Field label="Amount">
            <Input value={g.amount} onChange={(ev) => update(g.id, { amount: ev.target.value })} placeholder="$138,000" />
          </Field>
          <Field label="Year">
            <Input value={g.year} onChange={(ev) => update(g.id, { year: ev.target.value })} placeholder="2021" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Input value={g.description} onChange={(ev) => update(g.id, { description: ev.target.value })} placeholder="Funding for research into…" />
            </Field>
          </div>
        </EntryCard>
      ))}
      <AddButton label="Add grant" onClick={add} />
    </div>
  );
}

export function PresentationsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<PresentationEntry>("presentations", emptyPresentation);

  return (
    <div className="space-y-3">
      {rendered.map((p) => (
        <EntryCard
          key={p.id}
          title={p.title}
          subtitle={p.event}
          onRemove={isEmpty ? undefined : () => remove(p.id)}
          onMoveUp={isEmpty ? undefined : () => move(p.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(p.id, 1)}
        >
          <Field label="Title">
            <Input value={p.title} onChange={(ev) => update(p.id, { title: ev.target.value })} placeholder="Talk title" />
          </Field>
          <Field label="Event / venue">
            <Input value={p.event} onChange={(ev) => update(p.id, { event: ev.target.value })} placeholder="ACM CHI 2023" />
          </Field>
          <Field label="Location">
            <Input value={p.location} onChange={(ev) => update(p.id, { location: ev.target.value })} placeholder="Hamburg, Germany" />
          </Field>
          <Field label="Year">
            <Input value={p.year} onChange={(ev) => update(p.id, { year: ev.target.value })} placeholder="2023" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add presentation" onClick={add} />
    </div>
  );
}

export function AffiliationsForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<AffiliationEntry>("affiliations", emptyAffiliation);

  return (
    <div className="space-y-3">
      {rendered.map((a) => (
        <EntryCard
          key={a.id}
          title={a.name}
          subtitle={a.role}
          onRemove={isEmpty ? undefined : () => remove(a.id)}
          onMoveUp={isEmpty ? undefined : () => move(a.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(a.id, 1)}
        >
          <Field label="Organization">
            <Input value={a.name} onChange={(ev) => update(a.id, { name: ev.target.value })} placeholder="American Marketing Association" />
          </Field>
          <Field label="Role">
            <Input value={a.role} onChange={(ev) => update(a.id, { role: ev.target.value })} placeholder="Member" />
          </Field>
          <Field label="Years">
            <Input value={a.years} onChange={(ev) => update(a.id, { years: ev.target.value })} placeholder="2019 – Present" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add affiliation" onClick={add} />
    </div>
  );
}

export function ReferencesForm() {
  const { rendered, isEmpty, update, add, remove, move } = useEntryList<ReferenceEntry>("references", emptyReference);

  return (
    <div className="space-y-3">
      {rendered.map((r) => (
        <EntryCard
          key={r.id}
          title={r.name}
          subtitle={r.org}
          onRemove={isEmpty ? undefined : () => remove(r.id)}
          onMoveUp={isEmpty ? undefined : () => move(r.id, -1)}
          onMoveDown={isEmpty ? undefined : () => move(r.id, 1)}
        >
          <Field label="Full name">
            <Input value={r.name} onChange={(ev) => update(r.id, { name: ev.target.value })} placeholder="Dr. Sarah Lin" />
          </Field>
          <Field label="Title">
            <Input value={r.title} onChange={(ev) => update(r.id, { title: ev.target.value })} placeholder="Professor of Marketing" />
          </Field>
          <Field label="Organization">
            <Input value={r.org} onChange={(ev) => update(r.id, { org: ev.target.value })} placeholder="Northwestern University" />
          </Field>
          <Field label="Email">
            <Input value={r.email} onChange={(ev) => update(r.id, { email: ev.target.value })} placeholder="s.lin@example.edu" />
          </Field>
          <Field label="Phone">
            <Input value={r.phone} onChange={(ev) => update(r.id, { phone: ev.target.value })} placeholder="+1 555-010-0000" />
          </Field>
        </EntryCard>
      ))}
      <AddButton label="Add reference" onClick={add} />
    </div>
  );
}
