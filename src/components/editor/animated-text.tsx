"use client";

import { motion } from "motion/react";
import type { MotionPresetId } from "@/lib/project-schema";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

function Word({ children }: { children: string }) {
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, y: 42, filter: "blur(8px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

export function AnimatedText({
  text,
  presetId,
  replayKey,
}: {
  text: string;
  presetId: MotionPresetId;
  replayKey: number;
}) {
  const commonClass = "text-center text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl";

  if (presetId === "split-rise") {
    return (
      <motion.div
        key={`${presetId}-${replayKey}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`${commonClass} flex max-w-4xl flex-wrap justify-center gap-x-[0.22em] gap-y-1`}
      >
        {text.split(/\s+/).map((word, index) => (
          <Word key={`${word}-${index}`}>{word}</Word>
        ))}
      </motion.div>
    );
  }

  const variants = {
    none: { initial: {}, animate: {} },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    rise: { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 } },
    pop: { initial: { opacity: 0, scale: 0.78 }, animate: { opacity: 1, scale: 1 } },
    "blur-reveal": {
      initial: { opacity: 0, filter: "blur(18px)", scale: 1.04 },
      animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    },
  }[presetId];

  return (
    <motion.div
      key={`${presetId}-${replayKey}`}
      initial={variants.initial}
      animate={variants.animate}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={commonClass}
    >
      {text}
    </motion.div>
  );
}
