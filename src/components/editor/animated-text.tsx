"use client";

import { motion } from "motion/react";
import type { MotionPresetId, MotionSettings } from "@/lib/project-schema";

function getTokens(text: string, splitBy: MotionSettings["splitBy"]) {
  if (splitBy === "characters") {
    return Array.from(text).map((char) => (char === " " ? "\u00a0" : char));
  }

  return text.split(/\s+/);
}

export function AnimatedText({
  text,
  presetId,
  motionSettings,
  replayKey,
  compact = false,
}: {
  text: string;
  presetId: MotionPresetId;
  motionSettings: MotionSettings;
  replayKey: number;
  compact?: boolean;
}) {
  const commonClass = compact
    ? "text-center text-lg font-black tracking-[-0.04em]"
    : "text-center text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl";

  if (presetId === "split-rise") {
    const tokens = getTokens(text, motionSettings.splitBy);

    return (
      <motion.div
        key={`${presetId}-${replayKey}-${motionSettings.splitBy}`}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: motionSettings.stagger },
          },
        }}
        className={`${commonClass} flex max-w-4xl flex-wrap justify-center ${
          motionSettings.splitBy === "words" ? "gap-x-[0.22em] gap-y-1" : "gap-0"
        }`}
      >
        {tokens.map((token, index) => (
          <motion.span
            key={`${token}-${index}`}
            variants={{
              hidden: { opacity: 0, y: compact ? 16 : 42, filter: compact ? "blur(4px)" : "blur(8px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: motionSettings.duration,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
            className="inline-block"
          >
            {token}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  const variants = {
    none: { initial: {}, animate: {} },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    rise: { initial: { opacity: 0, y: compact ? 18 : 50 }, animate: { opacity: 1, y: 0 } },
    pop: { initial: { opacity: 0, scale: 0.78 }, animate: { opacity: 1, scale: 1 } },
    "blur-reveal": {
      initial: { opacity: 0, filter: compact ? "blur(8px)" : "blur(18px)", scale: 1.04 },
      animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    },
  }[presetId];

  return (
    <motion.div
      key={`${presetId}-${replayKey}`}
      initial={variants.initial}
      animate={variants.animate}
      transition={{ duration: motionSettings.duration, ease: [0.22, 1, 0.36, 1] }}
      className={commonClass}
    >
      {text}
    </motion.div>
  );
}
