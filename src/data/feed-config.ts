/**
 * Where the project list comes from, and what to leave out.
 *
 * The site asks GitHub for this user's public repos when it loads. Everything that is not excluded below
 * appears in the overview and the all-projects grid. A repo with a hand-written entry in projects.ts keeps
 * that copy; any other repo gets text generated from its GitHub description and topics.
 */
export const feedConfig = {
  user: "kk10-x",

  /**
   * Repos that never appear. Forks, private and archived repos are skipped automatically, so this list is
   * for public repos that should still stay out: this site itself, scratch repos, and so on.
   */
  excludedRepos: [
    "portfolio",
    "portfolio-v2",
    "kk10-x",
    "kk10-x.github.io",
    "temp",
    "ElevenLabs",
    // private today; listed so they stay hidden even if one is ever made public
    "you-GOT-a-letter",
    "written-in-the-stars",
    "bella-ingress",
    "claude-code-internal",
    "NFT-For-Collectibles",
  ],

  /** Anything not pushed since this date is hidden. That is what keeps the old college lab repos out. */
  minPushedAt: "2025-01-01",
};
