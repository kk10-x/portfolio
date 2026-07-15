import { siteConfig } from "@/config/site";
import { getLatestRepo } from "@/lib/github";
import { Reveal } from "@/components/Reveal";
import { RoleRotator } from "@/components/RoleRotator";

export async function Hero() {
  const latest = await getLatestRepo();

  return (
    <section className="max-w-3xl mx-auto px-6 pt-24 pb-16">
      <Reveal delay={0}>
        <p className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mb-3">
          Hi, I&apos;m
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="gradient-text text-4xl sm:text-6xl font-bold tracking-tight">
          {siteConfig.name}
        </h1>
      </Reveal>
      <Reveal delay={0.2}>
        <h2 className="mt-2 text-xl sm:text-2xl text-neutral-600 dark:text-neutral-300">
          <RoleRotator phrases={siteConfig.rolePhrases} />
        </h2>
      </Reveal>
      <Reveal delay={0.3}>
        <p className="mt-6 text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
          {siteConfig.bio}
        </p>
      </Reveal>
      {latest && (
        <Reveal delay={0.4}>
          <p className="mt-4 text-sm font-mono text-neutral-500 dark:text-neutral-400">
            <span className="relative mr-2 inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Currently building:{" "}
            <a
              href={latest.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-700 dark:text-neutral-200 underline decoration-fuchsia-400/60 underline-offset-4 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors"
            >
              {latest.name}
            </a>
          </p>
        </Reveal>
      )}
      <Reveal delay={0.5}>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <a
            href={`https://github.com/${siteConfig.github}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 rounded-full text-white bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 bg-[length:200%_100%] bg-left hover:bg-right transition-[background-position] duration-500 shadow-md shadow-fuchsia-500/20 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:-translate-y-0.5"
          >
            GitHub
          </a>
          {siteConfig.linkedin && (
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 hover:-translate-y-0.5 transition-all"
            >
              LinkedIn
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
