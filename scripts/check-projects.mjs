// Compares the curated tour in src/data/projects.ts with what is actually on GitHub, so a new repo
// never silently goes missing and a renamed or deleted one never leaves a dead link.
//   npm run check:projects
import { readFileSync } from "node:fs";

const USER = "kk10-x";
const HIDDEN = new Set(["portfolio", "portfolio-v2", "kk10-x", "kk10-x.github.io", "temp", "ElevenLabs"]);
const MIN_PUSHED = "2025-01-01";

const src = readFileSync(new URL("../src/data/projects.ts", import.meta.url), "utf8");
const listed = [...src.matchAll(/repo:\s*"([^"]+)"/g)].map((m) => m[1]);

const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, { headers });
if (!res.ok) {
  console.error(`GitHub API returned ${res.status}`);
  process.exitCode = 2;
  throw new Error("GitHub API request failed");
}
const repos = await res.json();
const byName = new Map(repos.map((r) => [r.name, r]));

const missingOnGitHub = listed.filter((n) => !byName.has(n));
const candidates = repos
  .filter((r) => !r.fork && !r.private && !HIDDEN.has(r.name) && r.pushed_at >= MIN_PUSHED && !listed.includes(r.name))
  .map((r) => r.name);

console.log(`${listed.length} projects in the tour.`);
if (missingOnGitHub.length) console.log(`Listed but not found on GitHub (renamed or deleted?): ${missingOnGitHub.join(", ")}`);
if (candidates.length) console.log(`Public, recent, not in the tour yet: ${candidates.join(", ")}`);
if (!missingOnGitHub.length && !candidates.length) console.log("The tour matches GitHub.");
process.exitCode = missingOnGitHub.length || candidates.length ? 1 : 0;
