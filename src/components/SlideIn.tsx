"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Apple-style scroll-linked side transition, symmetric in both directions.
 * Entry and exit each span a fixed fraction of the viewport height — not a
 * fraction of the section's own scroll length — so tall sections don't end
 * up with a long dead zone between the fade-in finishing and the fade-out
 * starting. Scrolling back up replays the same motion in reverse.
 */
export function SlideIn({
  children,
  from = "left",
}: {
  children: React.ReactNode;
  from?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Entry: section top travels from the viewport bottom up to its 60% mark.
  const { scrollYProgress: enter } = useScroll({
    target: ref,
    offset: ["start end", "start 60%"],
  });
  // Exit: section bottom travels from the viewport's 40% mark up to its top.
  const { scrollYProgress: exit } = useScroll({
    target: ref,
    offset: ["end 40%", "end start"],
  });

  const distance = from === "left" ? -90 : 90;
  const visible = useTransform([enter, exit], ([e, x]: number[]) => e * (1 - x));
  const x = useTransform(visible, (v) => distance * (1 - v));
  const opacity = visible;

  return (
    <div ref={ref}>
      <motion.div style={reduceMotion ? undefined : { x, opacity }}>
        {children}
      </motion.div>
    </div>
  );
}
