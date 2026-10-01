// Compares the hand-written entries in src/data/projects.ts with what GitHub says, using the same rules the
// site uses (src/data/feed-config.ts). The site lists every visible repo on its own; this just tells you which
// ones have hand-written copy and which are using text generated from the GitHub description.
//   npm run check:projects
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const config = read("../src/data/feed-config.ts");
const USER = config.match(/user:\s*"([^"]+)"/)?.[1];
const MIN_PUSHED = config.match(/minPushedAt:\s*"([^"]+)"/)?.[1];
const excluded = [...(config.match(/excludedRepos:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
const curated = [...read("../src/data/projects.ts").matchAll(/repo:\s*"([^"]+)"/g)].map((m) => m[1]);

const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, { headers });
if (!res.ok) {
  console.error(`GitHub API returned ${res.status}`);
  process.exitCode = 2;
} else {
  const repos = await res.json();
  const visible = repos.filter((r) => !r.fork && !r.private && !r.archived && !excluded.includes(r.name.toLowerCase()) && r.pushed_at >= MIN_PUSHED);
  const names = new Set(visible.map((r) => r.name.toLowerCase()));

  const generated = visible.filter((r) => !curated.some((c) => c.toLowerCase() === r.name.toLowerCase())).map((r) => r.name);
  const stale = curated.filter((c) => !names.has(c.toLowerCase()));

  console.log(`${visible.length} repos will show on the site (${visible.length - generated.length} with hand-written copy).`);
  if (generated.length) console.log(`Using text generated from GitHub (add an entry to src/data/projects.ts to write your own): ${generated.join(", ")}`);
  if (stale.length) console.log(`Hand-written entries that no longer match a visible repo (renamed, deleted or excluded?), so they are not shown: ${stale.join(", ")}`);
  if (!generated.length && !stale.length) console.log("Every visible repo has hand-written copy.");
  process.exitCode = stale.length ? 1 : 0;
}
