import { SHAPE_IDS } from "../shapes.ts";
import { SHAPE_MOTION, type CategoryId, type Project, type ShapeId } from "./projects.ts";

/** The fields of a GitHub repo this site uses. */
export interface GhRepo {
  name: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  private?: boolean;
  archived?: boolean;
  pushed_at: string;
}

export interface FeedOptions {
  /** Repo names to leave out (compared ignoring case). */
  excluded: string[];
  /** ISO date; repos not pushed since then are hidden. */
  minPushedAt: string;
  /** Repos to put first, in this order (this is the scroll tour). */
  featured: string[];
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Public, original, active, recent, and not on the exclude list. */
export function isVisible(repo: GhRepo, opts: Pick<FeedOptions, "excluded" | "minPushedAt">): boolean {
  if (repo.fork || repo.private || repo.archived) return false;
  if (opts.excluded.some((n) => same(n, repo.name))) return false;
  return repo.pushed_at >= opts.minPushedAt;
}

const ACRONYMS = new Set(["api", "cli", "qc", "ui", "ai", "llm", "dlq", "sdk", "ml", "tts", "sql", "css", "html"]);

/** "my-new_repo" -> "My New Repo"; known acronyms stay upper case. */
export function humanize(name: string): string {
  return name
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");
}

/** A guess at the theme from a repo's topics, name and description. Hand-written entries never use this. */
export function inferCategory(repo: GhRepo): CategoryId {
  const text = [repo.name, repo.description ?? "", ...(repo.topics ?? [])].join(" ").toLowerCase();
  if (/akamai|edgeworker|edge-computing|\bcdn\b/.test(text)) return "edge";
  if (/elevenlabs|text-to-speech|speech|whisper|voice|audio|podcast|transcri|video|ffmpeg|dubbing/.test(text)) return "voice";
  if (/discord|\bcli\b|self-hosted|game|exporter|\bbot\b/.test(text)) return "tools";
  return "reliability";
}

/** A stable number from a string, so a generated project always gets the same shape. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const prettyTopic = (t: string) => (ACRONYMS.has(t.toLowerCase()) ? t.toUpperCase() : humanize(t));

function trimBlurb(text: string | null): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "A project on GitHub.";
  if (t.length <= 190) return t;
  const cut = t.slice(0, 187);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-\s]+$/, "") + "…";
}

/** Text and a shape generated from GitHub data, for a repo with no hand-written entry. */
export function autoProject(repo: GhRepo): Project {
  const shape: ShapeId = SHAPE_IDS[hash(repo.name) % SHAPE_IDS.length]!;
  const tags = [...(repo.topics ?? []).slice(0, 3).map(prettyTopic)];
  if (repo.language && tags.length < 4) tags.push(repo.language);
  const live = repo.homepage && /^https:\/\//.test(repo.homepage) ? repo.homepage : undefined;
  return {
    repo: repo.name,
    title: humanize(repo.name),
    category: inferCategory(repo),
    blurb: trimBlurb(repo.description),
    tags: tags.length ? tags.slice(0, 4) : ["GitHub"],
    shape,
    motion: SHAPE_MOTION[shape],
    ...(live ? { live } : {}),
    caption: "",
  };
}

/**
 * The project list the site shows:
 *  1. featured repos first, in the given order (the scroll tour),
 *  2. then the other hand-written entries, in their written order,
 *  3. then any other visible repo, newest push first, with generated text.
 * A hand-written entry whose repo is hidden or missing on GitHub is dropped. If nothing at all comes back
 * (for example GitHub returned an error page), the hand-written list is used unchanged.
 */
export function buildProjects(repos: GhRepo[], curated: Project[], opts: FeedOptions): Project[] {
  const visible = repos.filter((r) => isVisible(r, opts));
  if (visible.length === 0) return curated;

  const byName = new Map(visible.map((r) => [r.name.toLowerCase(), r]));
  const curatedFor = (name: string) => curated.find((c) => same(c.repo, name));
  const withLive = (c: Project, r: GhRepo): Project => {
    if (c.live || !r.homepage || !/^https:\/\//.test(r.homepage)) return c;
    return { ...c, live: r.homepage };
  };

  const out: Project[] = [];
  const seen = new Set<string>();
  const push = (name: string) => {
    const r = byName.get(name.toLowerCase());
    if (!r || seen.has(r.name.toLowerCase())) return;
    seen.add(r.name.toLowerCase());
    const c = curatedFor(r.name);
    out.push(c ? withLive(c, r) : autoProject(r));
  };

  for (const name of opts.featured) push(name);
  for (const c of curated) push(c.repo);
  [...visible]
    .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1))
    .forEach((r) => push(r.name));
  return out;
}
