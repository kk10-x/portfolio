import { loadLiveProjects } from "./data/live.ts";

/**
 * The entry point. The site's modules read the project list when they load, so the live list from GitHub has
 * to be in place first. The opening screen is plain HTML, so it shows straight away; its "click to enter"
 * prompt fades in once everything is ready (usually well under a second). GitHub being slow or down only
 * means the saved list is used instead.
 */
(async () => {
  await loadLiveProjects();
  await import("./main.ts");
  document.getElementById("gate")?.classList.add("ready");
})();
