import { siteConfig } from "@/config/site";
import { Reveal } from "@/components/Reveal";

export function Footer() {
  return (
    <footer className="max-w-3xl mx-auto px-6 py-12 text-sm text-neutral-500 dark:text-neutral-500">
      <Reveal>
        <p>
          Reach me at{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-neutral-700 dark:text-neutral-300 underline decoration-fuchsia-400/60 underline-offset-4 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors"
          >
            {siteConfig.email}
          </a>
        </p>
        <p className="mt-3">
          ©{" "}
          <span className="gradient-text font-medium">
            {new Date().getFullYear()} {siteConfig.name}
          </span>
          . Built with Next.js, deployed on Vercel.
        </p>
      </Reveal>
    </footer>
  );
}
