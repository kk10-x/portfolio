// GitHub's official language colors (subset — the languages that appear in these repos)
// Source: github-linguist languages.yml
export const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  "C++": "#f34b7d",
  C: "#555555",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#663399",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  TSQL: "#e38c00",
  Assembly: "#6E4C13",
};

export function languageColor(language: string): string | undefined {
  return languageColors[language];
}
