import { siteConfig } from "@/config/site";

export type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
  pushed_at: string;
  topics: string[];
};

export async function getFeaturedRepos(): Promise<Repo[]> {
  // Optional: raises the API rate limit from 60/hr (per IP) to 5000/hr
  const token = process.env.GITHUB_TOKEN;

  const res = await fetch(
    `https://api.github.com/users/${siteConfig.github}/repos?per_page=100&sort=updated`,
    {
      next: { revalidate: 3600 },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (!res.ok) {
    return [];
  }

  const repos: Repo[] = await res.json();

  const visible = repos.filter(
    (repo) =>
      !repo.fork &&
      !siteConfig.excludedRepos.includes(repo.name) &&
      repo.pushed_at >= siteConfig.minPushedAt
  );

  const featuredSet = new Set(siteConfig.featuredRepos);
  const featured = siteConfig.featuredRepos
    .map((name) => visible.find((repo) => repo.name === name))
    .filter((repo): repo is Repo => Boolean(repo));

  const rest = visible
    .filter((repo) => !featuredSet.has(repo.name))
    .sort((a, b) => b.stargazers_count - a.stargazers_count);

  return [...featured, ...rest];
}

/** Most recently pushed visible repo — powers the hero's "currently building" line. */
export async function getLatestRepo(): Promise<Repo | null> {
  const repos = await getFeaturedRepos();
  if (repos.length === 0) return null;
  return repos.reduce((latest, repo) =>
    repo.pushed_at > latest.pushed_at ? repo : latest
  );
}
