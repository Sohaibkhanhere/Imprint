import type { SkillGroup } from "./types";

const LEVEL_RE =
  /^(expert|advanced|strong|proficient|intermediate|beginner|native|fluent|professional|conversational|practical\s*\/?\s*strong|practical|basic|novice|skilled|master)$/i;

export type DisplaySkillGroup = { id: string; name: string; items: string[] };

export function skillTags(group: SkillGroup | undefined): string[] {
  return (group?.skills ?? []).map((s) => (s || "").trim()).filter(Boolean);
}

export function isLevelTag(value: string): boolean {
  return LEVEL_RE.test(value.trim());
}

function filledGroups(groups: SkillGroup[] | undefined): SkillGroup[] {
  return (groups ?? []).filter((g) => (g.name || "").trim() || skillTags(g).length > 0);
}

function genericName(name: string): boolean {
  return !name || /^skills?$/i.test(name);
}

/** One skill label for a group that is really a single skill, not a category. */
function singletonLabel(group: SkillGroup): string | null {
  const all = skillTags(group);
  const tags = all.filter((s) => !isLevelTag(s));
  const name = (group.name || "").trim();
  if (genericName(name)) return tags.length === 1 ? tags[0] : null;
  if (tags.length > 1) return null;
  if (!tags.length) return name;
  if (tags[0].toLowerCase() === name.toLowerCase()) return name;
  if (all.length === 1 && isLevelTag(all[0])) return name;
  return null;
}

function uniqueLabels(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** True when each "group" is really one skill name with an Expert/Strong-style tag. */
export function groupsLookLikeLeveledSkills(groups: SkillGroup[] | undefined): boolean {
  const filled = filledGroups(groups);
  if (!filled.length) return false;
  return filled.every((g) => {
    const tags = skillTags(g);
    const name = (g.name || "").trim();
    return Boolean(name) && tags.length <= 1 && (tags.length === 0 || isLevelTag(tags[0]));
  });
}

/** True when skills should print as a flat name list (tags), not category rows. */
export function groupsLookLikeItemList(groups: SkillGroup[] | undefined): boolean {
  const filled = filledGroups(groups);
  if (!filled.length) return false;
  if (groupsLookLikeLeveledSkills(filled)) return true;
  if (filled.length === 1) {
    return singletonLabel(filled[0]) !== null || genericName((filled[0].name || "").trim());
  }
  return filled.every((g) => singletonLabel(g) !== null);
}

export function flattenSkillLabels(groups: SkillGroup[] | undefined): string[] {
  return displaySkillGroups(groups).flatMap((g) => g.items);
}

export function displaySkillGroups(groups: SkillGroup[] | undefined): DisplaySkillGroup[] {
  const filled = filledGroups(groups);
  if (!filled.length) return [];

  if (groupsLookLikeItemList(filled)) {
    const items = uniqueLabels(
      filled.flatMap((g) => {
        const label = singletonLabel(g);
        if (label) return [label];
        return skillTags(g).filter((s) => !isLevelTag(s));
      }),
    );
    return items.length ? [{ id: filled[0].id || "skills", name: "", items }] : [];
  }

  return filled
    .map((g) => {
      const name = genericName((g.name || "").trim()) ? "" : (g.name || "").trim();
      const tags = skillTags(g);
      const real = tags.filter((s) => !isLevelTag(s));
      return { id: g.id, name, items: uniqueLabels(real.length ? real : tags) };
    })
    .filter((g) => g.items.length > 0);
}

export function hasRenderableSkills(groups: SkillGroup[] | undefined): boolean {
  return displaySkillGroups(groups).some((g) => g.items.length > 0);
}
