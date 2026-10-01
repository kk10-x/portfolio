import snapshot from "./snapshot.json";
import { feedConfig } from "./feed-config.ts";
import { buildProjects, type GhRepo } from "./feed.ts";
import { TOUR_SIZE, curated, setProjects } from "./projects.ts";

export type Source = "live" | "cache" | "snapshot";

const CACHE_KEY = "portfolio-gh-repos-v1";
/** A visitor asks GitHub at most once an hour (the API allows 60 requests an hour per IP). */
const FRESH_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 2500;

interface CacheEntry {
  t: number;
  repos: GhRepo[];
}

/** Everything the choice depends on, so it can be tested without a network or a browser. */
export interface Deps {
  readCache: () => CacheEntry | null;
  writeCache: (entry: CacheEntry) => void;
  fetchRepos: () => Promise<GhRepo[]>;
  snapshot: GhRepo[];
  now: () => number;
}

/**
 * Which list of repos to use, best first: a fresh cached copy, then a live fetch, then a stale cached copy,
 * then the snapshot baked into the build. GitHub being slow, down or rate-limited never breaks the site.
 */
export async function chooseRepos(d: Deps): Promise<{ repos: GhRepo[]; source: Source }> {
  const cached = d.readCache();
  if (cached && d.now() - cached.t < FRESH_MS) return { repos: cached.repos, source: "cache" };
  try {
    const repos = await d.fetchRepos();
    d.writeCache({ t: d.now(), repos });
    return { repos, source: "live" };
  } catch {
    if (cached) return { repos: cached.repos, source: "cache" };
    return { repos: d.snapshot, source: "snapshot" };
  }
}

function pick(r: GhRepo & Record<string, unknown>): GhRepo {
  return {
    name: r.name,
    description: r.description,
    homepage: r.homepage,
    language: r.language,
    topics: r.topics ?? [],
    fork: r.fork,
    private: r.private,
    archived: r.archived,
    pushed_at: r.pushed_at,
  };
}

async function fetchFromGitHub(): Promise<GhRepo[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.github.com/users/${feedConfig.user}/repos?per_page=100&sort=pushed`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("unexpected response");
    return data.map((r) => pick(r as GhRepo & Record<string, unknown>));
  } finally {
    clearTimeout(timer);
  }
}

const browserDeps: Deps = {
  readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as CacheEntry) : null;
    } catch {
      return null; // private mode, blocked storage, or corrupt JSON
    }
  },
  writeCache(entry) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      /* the cache is only an optimisation */
    }
  },
  fetchRepos: fetchFromGitHub,
  snapshot: snapshot as GhRepo[],
  now: () => Date.now(),
};

/**
 * Replaces the site's project list with the live one from GitHub. Call it once, before anything reads the
 * list. It never throws: on any failure the site keeps the list it already has.
 */
export async function loadLiveProjects(): Promise<Source> {
  try {
    const { repos, source } = await chooseRepos(browserDeps);
    const featured = curated.slice(0, TOUR_SIZE).map((p) => p.repo);
    setProjects(buildProjects(repos, curated, { excluded: feedConfig.excludedRepos, minPushedAt: feedConfig.minPushedAt, featured }));
    return source;
  } catch {
    return "snapshot";
  }
}
