import { siteConfig } from "@/config/site";
import { Reveal } from "@/components/Reveal";

export function Skills() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <Reveal>
        <h2 className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">
          Skills
        </h2>
      </Reveal>
      <div className="flex flex-wrap gap-2">
        {siteConfig.skills.map((skill, i) => (
          <Reveal key={skill} as="span" delay={i * 0.04}>
            <span className="inline-block px-3 py-1.5 rounded-md text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-transparent hover:border-fuchsia-400/60 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:via-fuchsia-500/10 hover:to-cyan-500/10 hover:-translate-y-0.5 hover:scale-105 transition-all duration-200">
              {skill}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
