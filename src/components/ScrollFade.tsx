"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Apple-style hero exit: as the section scrolls out of view it
 * shrinks and dims, like product heroes on apple.com.
 */
export function ScrollFade({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    // progress 0 → section top at viewport top, 1 → section fully scrolled past
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <div ref={ref}>
      <motion.div style={reduceMotion ? undefined : { scale, opacity, y }}>
        {children}
      </motion.div>
    </div>
  );
}
