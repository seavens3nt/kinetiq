"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import type { MotionPresetId, MotionSettings, TextWordStyle, TypingSfx } from "@/lib/project-schema";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=?";
let typingAudioContext: AudioContext | null = null;

function wordStyle(styles: TextWordStyle[], index: number): CSSProperties {
  const style = styles.find((item) => item.wordIndex === index);
  return {
    color: style?.color,
    fontWeight: style?.fontWeight,
    fontSize: style?.fontSizeScale ? `${style.fontSizeScale}em` : undefined,
    opacity: style?.opacity,
  };
}

function renderStyledText(text: string, styles: TextWordStyle[]): ReactNode {
  let wordIndex = -1;
  return text.split(/(\s+)/).map((part, index) => {
    if (/^\s+$/.test(part)) return <span key={`space-${index}`}>{part}</span>;
    wordIndex += 1;
    return <span key={`${part}-${index}`} style={wordStyle(styles, wordIndex)}>{part}</span>;
  });
}

function animatedTokens(text: string, splitBy: MotionSettings["splitBy"]) {
  let wordIndex = 0;
  if (splitBy === "words") return text.split(/\s+/).map((token, index) => ({ token, wordIndex: index }));
  return Array.from(text).map((token) => {
    const currentWord = wordIndex;
    if (token === " ") wordIndex += 1;
    return { token: token === " " ? "\u00a0" : token, wordIndex: currentWord };
  });
}

function playTypingSound(settings: TypingSfx, index: number) {
  if (!settings.enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    typingAudioContext ??= new AudioContextClass();
    const oscillator = typingAudioContext.createOscillator();
    const gain = typingAudioContext.createGain();
    const now = typingAudioContext.currentTime;
    oscillator.type = "square";
    oscillator.frequency.value = (440 + (index % 5) * 22) * settings.pitch;
    gain.gain.setValueAtTime(Math.max(0.0001, settings.volume * 0.08), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    oscillator.connect(gain).connect(typingAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.03);
  } catch {
    // Browsers may keep Web Audio locked until the first editor interaction.
  }
}

export function AnimatedText({
  text,
  presetId,
  motionSettings,
  replayKey,
  compact = false,
  fontSize,
  fontWeight,
  color,
  wordStyles = [],
  typingSfx = { enabled: false, volume: 0.18, pitch: 1 },
}: {
  text: string;
  presetId: MotionPresetId;
  motionSettings: MotionSettings;
  replayKey: number;
  compact?: boolean;
  fontSize?: string;
  fontWeight?: number;
  color?: string;
  wordStyles?: TextWordStyle[];
  typingSfx?: TypingSfx;
}) {
  const [typedText, setTypedText] = useState(text);
  const [decryptText, setDecryptText] = useState(text);
  const commonClass = compact
    ? "text-center text-lg font-black tracking-[-0.04em]"
    : "text-center text-5xl font-black tracking-[-0.055em] sm:text-7xl lg:text-8xl";
  const baseStyle = { fontSize, fontWeight, color };

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
      if (text[index - 1] !== " ") playTypingSound(typingSfx, index);
      if (index >= text.length) window.clearInterval(timer);
    }, delay);
    return () => window.clearInterval(timer);
  }, [presetId, text, motionSettings.duration, replayKey, typingSfx.enabled, typingSfx.pitch, typingSfx.volume]);

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
      setDecryptText(Array.from(text).map((char, index) => char === " " ? " " : index < reveal ? char : GLYPHS[(index * 7 + tick * 5) % GLYPHS.length]).join(""));
      if (tick >= totalTicks) {
        setDecryptText(text);
        window.clearInterval(timer);
      }
    }, 45);
    return () => window.clearInterval(timer);
  }, [presetId, text, motionSettings.duration, replayKey]);

  const splitBy = presetId === "follow-type" ? "characters" : motionSettings.splitBy;
  const tokens = useMemo(() => animatedTokens(text, splitBy), [text, splitBy]);

  if (presetId === "typing") {
    return <div key={`${presetId}-${replayKey}`} style={baseStyle} className={`${commonClass} inline-flex items-end justify-center`}>
      <span>{renderStyledText(typedText, wordStyles)}</span>
      <motion.span aria-hidden="true" className="ml-[0.06em] inline-block h-[0.9em] w-[0.06em] bg-current align-[-0.05em]" animate={{ opacity: [1, 1, 0, 0] }} transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.45, 0.5, 1] }} />
    </div>;
  }

  if (presetId === "decrypt") return <div key={`${presetId}-${replayKey}`} style={baseStyle} className={`${commonClass} font-mono`}>{renderStyledText(decryptText, wordStyles)}</div>;

  if (presetId === "shiny") return <motion.div key={`${presetId}-${replayKey}`} style={baseStyle} className={`${commonClass} bg-[linear-gradient(105deg,#f7f7f4_20%,#d7ff45_42%,#ffffff_50%,#8067ff_58%,#f7f7f4_80%)] bg-[length:220%_100%] bg-clip-text text-transparent`} initial={{ backgroundPosition: "120% 0" }} animate={{ backgroundPosition: "-120% 0" }} transition={{ duration: Math.max(0.8, motionSettings.duration * 1.8), ease: "linear", repeat: Infinity, repeatDelay: 0.45 }}>{renderStyledText(text, wordStyles)}</motion.div>;

  if (presetId === "text-pill") return <motion.div key={`${presetId}-${replayKey}`} initial={{ opacity: 0, scaleX: 0.15, borderRadius: 999 }} animate={{ opacity: 1, scaleX: 1, borderRadius: 18 }} transition={{ duration: motionSettings.duration, ease: [0.22, 1, 0.36, 1] }} style={{ ...baseStyle, background: "rgba(11,11,15,.92)", padding: ".18em .45em", transformOrigin: "center" }} className={commonClass}>{renderStyledText(text, wordStyles)}</motion.div>;

  const splitPresets: MotionPresetId[] = ["split-rise", "blur-stagger", "scatter-gather", "sentence-build", "word-swap", "follow-type", "anchor-reveal"];
  if (splitPresets.includes(presetId)) {
    return <motion.div key={`${presetId}-${replayKey}-${splitBy}`} initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: motionSettings.stagger } } }} style={baseStyle} className={`${commonClass} flex max-w-4xl flex-wrap justify-center ${splitBy === "words" ? "gap-x-[0.22em] gap-y-1" : "gap-0"}`}>
      {tokens.map(({ token, wordIndex }, index) => {
        const hidden = presetId === "blur-stagger" ? { opacity: 0, filter: compact ? "blur(8px)" : "blur(18px)", scale: 1.03 }
          : presetId === "scatter-gather" ? { opacity: 0, x: ((index % 5) - 2) * (compact ? 28 : 80), y: ((index % 3) - 1) * (compact ? 24 : 65), rotate: (index % 2 ? 1 : -1) * 18, filter: "blur(8px)" }
          : presetId === "word-swap" ? { opacity: 0, y: index % 2 ? -45 : 45, rotateX: index % 2 ? -70 : 70 }
          : presetId === "follow-type" ? { opacity: 0, x: -12, y: 18, scale: 0.8, filter: "blur(5px)" }
          : presetId === "anchor-reveal" && index === 0 ? { opacity: 0, scale: 0.72 }
          : { opacity: 0, y: compact ? 16 : 42, filter: compact ? "blur(4px)" : "blur(8px)" };
        return <motion.span key={`${token}-${index}`} variants={{ hidden, visible: { opacity: 1, x: 0, y: 0, rotate: 0, rotateX: 0, scale: 1, filter: "blur(0px)", transition: { duration: motionSettings.duration, ease: [0.22, 1, 0.36, 1] } } }} style={wordStyle(wordStyles, wordIndex)} className={`inline-block ${presetId === "anchor-reveal" && index === 0 ? "rounded-[.2em] bg-[#D7FF45] px-[.18em] text-[#0B0B0F]" : ""}`}>{token}</motion.span>;
      })}
    </motion.div>;
  }

  const baseVariants: Partial<Record<MotionPresetId, { initial: Record<string, string | number>; animate: Record<string, string | number> }>> = {
    none: { initial: {}, animate: {} },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    rise: { initial: { opacity: 0, y: compact ? 18 : 50 }, animate: { opacity: 1, y: 0 } },
    pop: { initial: { opacity: 0, scale: 0.78 }, animate: { opacity: 1, scale: 1 } },
    "blur-reveal": { initial: { opacity: 0, filter: compact ? "blur(8px)" : "blur(18px)", scale: 1.04 }, animate: { opacity: 1, filter: "blur(0px)", scale: 1 } },
  };
  const variants = baseVariants[presetId] ?? { initial: {}, animate: {} };

  return <motion.div key={`${presetId}-${replayKey}`} initial={variants.initial} animate={variants.animate} transition={{ duration: motionSettings.duration, ease: [0.22, 1, 0.36, 1] }} style={baseStyle} className={commonClass}>{renderStyledText(text, wordStyles)}</motion.div>;
}
