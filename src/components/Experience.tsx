import { siteConfig } from "@/config/site";
import { Reveal } from "@/components/Reveal";

export function Experience() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
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
    </section>
  );
}
