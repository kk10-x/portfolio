"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Repo } from "@/lib/github";
import { languageColor } from "@/lib/languageColors";

export function ProjectCard({ repo, index }: { repo: Repo; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false });

  // A repo with a homepage has something running you can actually click.
  const liveUrl = repo.homepage?.trim() || null;
  // The card's primary target: the live demo when there is one, else the source.
  const primaryUrl = liveUrl ?? repo.html_url;

  // 3D tilt driven by cursor position over the card
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), {
    stiffness: 250,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), {
    stiffness: 250,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width);
    mouseY.set(y / rect.height);
    setSpotlight({ x, y, visible: true });
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setSpotlight((s) => ({ ...s, visible: false }));
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="group relative block overflow-hidden rounded-2xl border border-indigo-100 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md p-5 shadow-md shadow-indigo-500/5 hover:shadow-xl hover:shadow-fuchsia-500/15 dark:shadow-none transition-shadow duration-300"
    >
      {/* Mouse-tracking spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.visible ? 1 : 0,
          background: `radial-gradient(220px circle at ${spotlight.x}px ${spotlight.y}px, rgba(217, 70, 239, 0.14), rgba(99, 102, 241, 0.08) 40%, transparent 70%)`,
        }}
      />

      {/* Top accent line — a whisper of it always shows in light mode, full on hover */}
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent opacity-30 dark:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
            {/* Stretched link: keeps the whole card clickable while still allowing
                a separate source link below (nested anchors would be invalid HTML). */}
            <a
              href={primaryUrl}
              target="_blank"
              rel="noreferrer"
              className="after:absolute after:inset-0 after:content-[''] rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
            >
              {repo.name}
            </a>
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            {liveUrl && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Live
              </span>
            )}
            <span className="text-neutral-400 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300">
              ↗
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {repo.description || "No description yet."}
        </p>

        {(repo.topics ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-500 dark:text-neutral-400"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 text-xs">
          {repo.language && (
            <span className="inline-flex items-center gap-1.5 font-mono text-neutral-500 dark:text-neutral-400">
              <span
                className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400"
                style={
                  languageColor(repo.language)
                    ? { background: languageColor(repo.language) }
                    : undefined
                }
              />
              {repo.language}
            </span>
          )}
          {repo.stargazers_count > 0 && (
            <span className="text-neutral-500 dark:text-neutral-400">
              ★ {repo.stargazers_count}
            </span>
          )}

          {/* When the card points at a live demo, keep the source one click away.
              z-10 lifts it above the stretched link's overlay. */}
          {liveUrl && (
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              className="relative z-10 ml-auto rounded text-neutral-500 hover:text-fuchsia-500 dark:text-neutral-400 dark:hover:text-fuchsia-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
            >
              Source ↗
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
