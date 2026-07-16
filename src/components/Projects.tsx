import { getFeaturedRepos } from "@/lib/github";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";

export async function Projects() {
  const repos = await getFeaturedRepos();

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <Reveal>
        <h2 className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">
          Projects
        </h2>
      </Reveal>

      {repos.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Couldn&apos;t load repos right now — check back later, or browse{" "}
          <a
            href="https://github.com"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>{" "}
          directly.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {repos.slice(0, 8).map((repo, i) => (
            <ProjectCard key={repo.id} repo={repo} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
