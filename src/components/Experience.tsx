import { siteConfig } from "@/config/site";
import { Reveal } from "@/components/Reveal";

export function Experience() {
  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <Reveal>
        <h2 className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-6 uppercase tracking-wide">
          Experience
        </h2>
      </Reveal>

      <ol className="relative border-l border-neutral-200 dark:border-neutral-800 ml-1">
        {siteConfig.experience.map((job, i) => (
          <li
            key={`${job.company}-${job.role}`}
            className="relative pl-6 pb-8 last:pb-0"
          >
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 ring-4 ring-white dark:ring-black" />
            <Reveal delay={0.1 + i * 0.1}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                  {job.role}
                </h3>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {job.company}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-mono text-neutral-500 dark:text-neutral-500">
                {job.period} · {job.location}
              </p>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {job.summary}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal delay={0.35}>
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {siteConfig.education.school}
          </span>{" "}
          — {siteConfig.education.degree}, {siteConfig.education.period}
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <h2 className="mt-14 mb-4 text-sm font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Skills
        </h2>
      </Reveal>
      <div className="flex flex-wrap gap-2">
        {siteConfig.skills.map((skill, i) => (
          <Reveal key={skill} as="span" delay={i * 0.04}>
            <span className="inline-block px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-indigo-500/[0.07] via-fuchsia-500/[0.07] to-cyan-500/[0.07] dark:bg-neutral-800 dark:from-transparent dark:via-transparent dark:to-transparent text-neutral-700 dark:text-neutral-300 border border-indigo-200/50 dark:border-transparent hover:border-fuchsia-400/60 hover:from-indigo-500/10 hover:via-fuchsia-500/10 hover:to-cyan-500/10 hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">
              {skill}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
