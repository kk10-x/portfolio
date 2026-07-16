# Portfolio

Personal portfolio site for Khrithik S Anand — pulls project cards live from GitHub instead of a hardcoded list, so it stays current as repos are added.

**Live:** https://portfolio-rho-blue-18.vercel.app

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion (scroll-triggered entrances, 3D card tilt, spotlight hover)
- GitHub REST API (server-side fetch, revalidated hourly)
- Deployed on Vercel

## Architecture

The site is a single static-ish page split into a few server components:

- `src/config/site.ts` — all personal info (name, bio, skills, GitHub handle) in one place, plus curation knobs: `excludedRepos`, a `minPushedAt` cutoff date (hides old college repos), and an optional `featuredRepos` list to pin specific projects to the top.
- `src/lib/github.ts` — fetches the GitHub user's repos server-side via `fetch(..., { next: { revalidate: 3600 } })`, filters out forks/excluded/stale repos, and sorts by stars (with any featured repos pinned first).
- `src/components/` — `Hero`, `Experience` (includes skills), `Projects`, `Footer` are server components; `ProjectCard`, `ParticleField`, `SlideIn`/`ScrollFade` (scroll-linked transitions), `TerminalCard`, and `ThemeToggle` are the client components.
- `src/app/icon.svg` + `src/app/opengraph-image.tsx` — gradient favicon and a generated OG image so shared links render a proper preview card.

No backend or database — the GitHub API is the only external dependency, and Next.js's built-in ISR cache keeps it from being hit on every request. This was simpler than hand-maintaining a projects JSON file and keeps the site honest: what's shown is what's actually on GitHub.

## Key features

- Live project feed from the GitHub API — new repos show up automatically, no manual edits
- Optional curation via `excludedRepos` / `featuredRepos` in `site.ts` if you want to hide noise or pin specific projects later
- Manual dark/light toggle, persisted in localStorage, no flash on load
- Apple-style scroll experience — full-viewport sections with scroll-linked slide/fade transitions
- Zero backend — fully static-renderable aside from the revalidated GitHub fetch

## Setup / run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

To point this at a different GitHub account, edit `github` in `src/config/site.ts`.

Optionally set `GITHUB_TOKEN` (see `.env.example`) to raise the GitHub API rate limit from 60 to 5000 requests/hour — not required for normal use thanks to the hourly cache.

## Deploy

Deployed on [Vercel](https://vercel.com/new), connected to this repo — pushes to `main` deploy automatically.
