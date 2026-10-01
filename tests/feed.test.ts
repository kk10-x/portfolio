import assert from "node:assert/strict";
import { test } from "node:test";
import snapshot from "../src/data/snapshot.json" with { type: "json" };
import { feedConfig } from "../src/data/feed-config.ts";
import { autoProject, buildProjects, humanize, inferCategory, isVisible, type FeedOptions, type GhRepo } from "../src/data/feed.ts";
import { chooseRepos, type Deps } from "../src/data/live.ts";
import { TOUR_SIZE, curated, type Project } from "../src/data/projects.ts";
import { SHAPE_IDS } from "../src/shapes.ts";

const repo = (name: string, over: Partial<GhRepo> = {}): GhRepo => ({
  name,
  description: `${name} description`,
  homepage: null,
  language: "TypeScript",
  topics: [],
  fork: false,
  private: false,
  archived: false,
  pushed_at: "2026-06-01T00:00:00Z",
  ...over,
});

const opts: FeedOptions = {
  excluded: ["secret-tool", "Portfolio"],
  minPushedAt: "2025-01-01",
  featured: curated.slice(0, TOUR_SIZE).map((p) => p.repo),
};

// ---- who is visible
test("forks, private, archived, excluded and old repos are hidden; the exclude list ignores case", () => {
  assert.equal(isVisible(repo("ok"), opts), true);
  assert.equal(isVisible(repo("a", { fork: true }), opts), false);
  assert.equal(isVisible(repo("b", { private: true }), opts), false);
  assert.equal(isVisible(repo("c", { archived: true }), opts), false);
  assert.equal(isVisible(repo("secret-tool"), opts), false);
  assert.equal(isVisible(repo("portfolio"), opts), false, "excluded as Portfolio, matched case-insensitively");
  assert.equal(isVisible(repo("old", { pushed_at: "2021-06-15T00:00:00Z" }), opts), false);
});

// ---- order and copy
test("featured repos come first in the given order, then the other hand-written ones, then new repos by recency", () => {
  const names = [...curated.map((c) => c.repo), "brand-new", "newer-still"];
  const repos = names.map((n) => repo(n, { pushed_at: n === "newer-still" ? "2026-09-30T00:00:00Z" : n === "brand-new" ? "2026-08-01T00:00:00Z" : "2026-05-01T00:00:00Z" }));
  const out = buildProjects(repos.reverse(), curated, opts);
  assert.deepEqual(out.slice(0, TOUR_SIZE).map((p) => p.repo), opts.featured);
  assert.deepEqual(out.slice(TOUR_SIZE, curated.length).map((p) => p.repo), curated.slice(TOUR_SIZE).map((p) => p.repo));
  assert.deepEqual(out.slice(curated.length).map((p) => p.repo), ["newer-still", "brand-new"], "newest push first");
});

test("a repo with a hand-written entry keeps that copy; a new repo gets generated copy", () => {
  const out = buildProjects([repo("vortex", { description: "GitHub's own words" }), repo("fresh-idea", { description: "Does a thing", topics: ["kafka", "dlq"] })], curated, opts);
  const vortex = out.find((p) => p.repo === "vortex")!;
  assert.equal(vortex.blurb, curated.find((c) => c.repo === "vortex")!.blurb, "hand-written blurb wins over the GitHub description");
  const fresh = out.find((p) => p.repo === "fresh-idea")!;
  assert.equal(fresh.title, "Fresh Idea");
  assert.equal(fresh.blurb, "Does a thing");
  assert.deepEqual(fresh.tags, ["Kafka", "DLQ", "TypeScript"]);
  assert.equal(fresh.caption, "");
});

test("hand-written entries for repos that are hidden or gone are dropped, and a new repo can enter the list", () => {
  const out = buildProjects([repo("vortex"), repo("payments-flow"), repo("fresh-idea"), repo("secret-tool")], curated, opts);
  assert.deepEqual(out.map((p) => p.repo), ["vortex", "payments-flow", "fresh-idea"]);
});

test("a hand-written entry without a live link picks up the repo's homepage", () => {
  const noLive = curated.find((c) => !c.live)!;
  const out = buildProjects([repo(noLive.repo, { homepage: "https://example.com/demo" })], curated, opts);
  assert.equal(out[0]!.live, "https://example.com/demo");
});

test("if GitHub returns nothing usable, the hand-written list is used unchanged", () => {
  assert.equal(buildProjects([], curated, opts), curated);
  assert.equal(buildProjects([repo("only-a-fork", { fork: true })], curated, opts), curated);
});

test("no project appears twice, even when a name differs in case", () => {
  const out = buildProjects([repo("Vortex"), repo("vortex")], curated, opts);
  assert.equal(new Set(out.map((p) => p.repo.toLowerCase())).size, out.length);
});

// ---- generated copy
test("generated entries are well formed: stable shape, sensible category, short blurb, https links only", () => {
  const long = repo("x".repeat(5), { description: "word ".repeat(80) });
  const a = autoProject(long);
  assert.ok(a.blurb.length <= 190 && a.blurb.endsWith("…"));
  assert.equal(autoProject(long).shape, a.shape, "deterministic");
  assert.ok(SHAPE_IDS.includes(a.shape));
  assert.equal(autoProject(repo("t", { description: null })).blurb, "A project on GitHub.");
  assert.equal(autoProject(repo("t", { homepage: "http://insecure.example" })).live, undefined);
  assert.equal(autoProject(repo("t", { homepage: "https://ok.example" })).live, "https://ok.example");
  assert.deepEqual(autoProject(repo("t", { language: null })).tags, ["GitHub"]);
  assert.equal(humanize("my-new_repo.cli"), "My New Repo CLI");
});

test("category guesses follow topics", () => {
  assert.equal(inferCategory(repo("a", { topics: ["akamai", "edgeworkers"] })), "edge");
  assert.equal(inferCategory(repo("a", { topics: ["elevenlabs"] })), "voice");
  assert.equal(inferCategory(repo("a", { description: "A Discord bot" })), "tools");
  assert.equal(inferCategory(repo("a", { topics: ["kafka"] })), "reliability");
});

// ---- the snapshot and the real config
test("the saved snapshot, run through the real exclude list, yields exactly the 16 curated projects", () => {
  const out = buildProjects(snapshot as GhRepo[], curated, { ...feedConfig, excluded: feedConfig.excludedRepos, featured: opts.featured });
  assert.deepEqual(new Set(out.map((p) => p.repo)), new Set(curated.map((c) => c.repo)), "no extras and none missing");
  assert.deepEqual(out.slice(0, TOUR_SIZE).map((p) => p.repo), opts.featured);
});

test("this site, scratch and ElevenLabs are on the real exclude list", () => {
  for (const hidden of ["portfolio", "temp", "ElevenLabs"]) {
    assert.ok(feedConfig.excludedRepos.some((n) => n.toLowerCase() === hidden.toLowerCase()), hidden);
  }
});

// ---- choosing where the repos come from
function deps(over: Partial<Deps> & { cache?: { t: number; repos: GhRepo[] } | null; calls?: { fetch: number; write: number } } = {}): Deps {
  const calls = over.calls ?? { fetch: 0, write: 0 };
  return {
    readCache: () => over.cache ?? null,
    writeCache: () => void calls.write++,
    fetchRepos: over.fetchRepos ?? (async () => (calls.fetch++, [repo("from-github")])),
    snapshot: [repo("from-snapshot")],
    now: () => 10_000_000,
    ...over,
  };
}

test("a fresh cache is used and GitHub is not asked", async () => {
  const calls = { fetch: 0, write: 0 };
  const r = await chooseRepos(deps({ calls, cache: { t: 10_000_000 - 60_000, repos: [repo("from-cache")] } }));
  assert.equal(r.source, "cache");
  assert.equal(r.repos[0]!.name, "from-cache");
  assert.equal(calls.fetch, 0);
});

test("with no cache or a stale one, GitHub is asked and the answer is cached", async () => {
  const calls = { fetch: 0, write: 0 };
  const r = await chooseRepos(deps({ calls, cache: { t: 10_000_000 - 2 * 3_600_000, repos: [repo("stale")] } }));
  assert.equal(r.source, "live");
  assert.equal(r.repos[0]!.name, "from-github");
  assert.deepEqual(calls, { fetch: 1, write: 1 });
});

test("if GitHub fails, a stale cache is used; with no cache the build-time snapshot is used", async () => {
  const failing = async () => {
    throw new Error("rate limited");
  };
  const stale = await chooseRepos(deps({ fetchRepos: failing, cache: { t: 0, repos: [repo("stale")] } }));
  assert.deepEqual([stale.source, stale.repos[0]!.name], ["cache", "stale"]);
  const none = await chooseRepos(deps({ fetchRepos: failing }));
  assert.deepEqual([none.source, none.repos[0]!.name], ["snapshot", "from-snapshot"]);
});

test("type check: a built project list is made of Project objects", () => {
  const out: Project[] = buildProjects([repo("vortex")], curated, opts);
  assert.equal(out.length, 1);
});
