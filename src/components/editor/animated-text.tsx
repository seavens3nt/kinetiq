"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { MotionPresetId, MotionSettings } from "@/lib/project-schema";

function getTokens(text: string, splitBy: MotionSettings["splitBy"]) {
  if (splitBy === "characters") {
    return Array.from(text).map((char) => (char === " " ? "\u00a0" : char));
  }
  return text.split(/\s+/);
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=?";

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
  const [typedText, setTypedText] = useState(text);
  const [decryptText, setDecryptText] = useState(text);
  const commonClass = compact
    ? "text-center text-lg font-black tracking-[-0.04em]"
    : "text-center text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl";

  useEffect(() => {
    if (presetId !== "typing") {
      setTypedText(text);
      return;
    }
    setTypedText("");
    if (!text.length) return;
    let index = 0;
    const delay = Math.max(28, (motionSettings.duration * 1000) / Math.max(1, text.length));
    const timer = window.setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, delay);
    return () => window.clearInterval(timer);
  }, [presetId, text, motionSettings.duration, replayKey]);

  useEffect(() => {
    if (presetId !== "decrypt") {
      setDecryptText(text);
      return;
    }
    let tick = 0;
    const totalTicks = Math.max(8, Math.round(motionSettings.duration * 22));
    const timer = window.setInterval(() => {
      tick += 1;
      const reveal = Math.floor((tick / totalTicks) * text.length);
      const next = Array.from(text).map((char, index) => {
        if (char === " ") return " ";
        if (index < reveal) return char;
        return GLYPHS[(index * 7 + tick * 5) % GLYPHS.length];
      }).join("");
      setDecryptText(next);
      if (tick >= totalTicks) {
        setDecryptText(text);
        window.clearInterval(timer);
      }
    }, 45);
    return () => window.clearInterval(timer);
  }, [presetId, text, motionSettings.duration, replayKey]);

  const splitTokens = useMemo(() => getTokens(text, motionSettings.splitBy), [text, motionSettings.splitBy]);

  if (presetId === "typing") {
    return (
      <div key={`${presetId}-${replayKey}`} className={`${commonClass} inline-flex items-end justify-center`}>
        <span>{typedText}</span>
        <motion.span
          aria-hidden="true"
          className="ml-[0.06em] inline-block h-[0.9em] w-[0.06em] bg-current align-[-0.05em]"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
        />
      </div>
    );
  }

  if (presetId === "decrypt") {
    return <div key={`${presetId}-${replayKey}`} className={`${commonClass} font-mono`}>{decryptText}</div>;
  }

  if (presetId === "shiny") {
    return (
      <motion.div
        key={`${presetId}-${replayKey}`}
        className={`${commonClass} bg-[linear-gradient(105deg,#f7f7f4_20%,#d7ff45_42%,#ffffff_50%,#8067ff_58%,#f7f7f4_80%)] bg-[length:220%_100%] bg-clip-text text-transparent`}
        initial={{ backgroundPosition: "120% 0" }}
        animate={{ backgroundPosition: "-120% 0" }}
        transition={{ duration: Math.max(0.8, motionSettings.duration * 1.8), ease: "linear", repeat: Infinity, repeatDelay: 0.45 }}
      >
        {text}
      </motion.div>
    );
  }

  if (presetId === "split-rise" || presetId === "blur-stagger") {
    const isBlur = presetId === "blur-stagger";
    return (
      <motion.div
        key={`${presetId}-${replayKey}-${motionSettings.splitBy}`}
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: motionSettings.stagger } } }}
        className={`${commonClass} flex max-w-4xl flex-wrap justify-center ${motionSettings.splitBy === "words" ? "gap-x-[0.22em] gap-y-1" : "gap-0"}`}
      >
        {splitTokens.map((token, index) => (
          <motion.span
            key={`${token}-${index}`}
            variants={{
              hidden: isBlur
                ? { opacity: 0, filter: compact ? "blur(8px)" : "blur(18px)", y: 0, scale: 1.03 }
                : { opacity: 0, y: compact ? 16 : 42, filter: compact ? "blur(4px)" : "blur(8px)" },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                transition: { duration: motionSettings.duration, ease: [0.22, 1, 0.36, 1] },
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
