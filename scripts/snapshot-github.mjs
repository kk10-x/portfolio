// Saves a copy of this user's public repos into src/data/snapshot.json at build time. The site normally asks
// GitHub live when it loads; this copy is only the fallback for when that request fails (offline, rate
// limited, GitHub down). If GitHub can't be reached here either, the existing snapshot is kept and the build
// carries on: a failed refresh must never fail a deploy.
//   npm run snapshot
import { readFileSync, writeFileSync } from "node:fs";

const USER = readFileSync(new URL("../src/data/feed-config.ts", import.meta.url), "utf8").match(/user:\s*"([^"]+)"/)?.[1];
const MIN_PUSHED = readFileSync(new URL("../src/data/feed-config.ts", import.meta.url), "utf8").match(/minPushedAt:\s*"([^"]+)"/)?.[1];
const OUT = new URL("../src/data/snapshot.json", import.meta.url);

if (!USER || !MIN_PUSHED) {
  console.warn("snapshot: could not read the user or date from src/data/feed-config.ts; keeping the existing snapshot");
} else {
  try {
    const headers = { Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
    const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    const all = await res.json();
    if (!Array.isArray(all) || all.length === 0) throw new Error("unexpected response");
    // Public, original, recent repos only. Private names must never end up in a public bundle.
    const repos = all
      .filter((r) => !r.private && !r.fork && !r.archived && r.pushed_at >= MIN_PUSHED)
      .map((r) => ({
        name: r.name,
        description: r.description,
        homepage: r.homepage || null,
        language: r.language,
        topics: r.topics ?? [],
        fork: false,
        private: false,
        archived: false,
        pushed_at: r.pushed_at,
      }));
    writeFileSync(OUT, JSON.stringify(repos, null, 2) + "\n");
    console.log(`snapshot: saved ${repos.length} public repos from ${USER}`);
  } catch (err) {
    console.warn(`snapshot: could not refresh (${err.message}); keeping the existing snapshot`);
  }
}
