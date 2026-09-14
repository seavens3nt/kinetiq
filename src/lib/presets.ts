import type { BackgroundPresetId, MotionPresetId } from "@/lib/project-schema";

export type MotionPreset = {
  id: MotionPresetId;
  name: string;
  description: string;
  engine: "native" | "react-bits-adapter";
};

export const motionPresets: MotionPreset[] = [
  { id: "none", name: "None", description: "Static text.", engine: "native" },
  { id: "fade", name: "Fade", description: "Clean opacity reveal.", engine: "native" },
  { id: "rise", name: "Rise", description: "Smooth upward entrance.", engine: "native" },
  { id: "pop", name: "Pop", description: "Fast scale-and-settle entrance.", engine: "native" },
  { id: "blur-reveal", name: "Blur Reveal", description: "Moves from soft blur into focus.", engine: "native" },
  {
    id: "split-rise",
    name: "Split Rise",
    description: "Word-by-word stagger inspired by React Bits Split Text.",
    engine: "react-bits-adapter",
  },
  {
    id: "typing",
    name: "Typing",
    description: "Character-by-character type-on reveal with a live caret.",
    engine: "native",
  },
  {
    id: "blur-stagger",
    name: "Blur Stagger",
    description: "Sequential word/character focus reveal inspired by React Bits Blur Text.",
    engine: "react-bits-adapter",
  },
  {
    id: "shiny",
    name: "Shiny Text",
    description: "Animated highlight sweep inspired by React Bits Shiny Text.",
    engine: "react-bits-adapter",
  },
  {
    id: "decrypt",
    name: "Decrypt",
    description: "Scrambled characters resolve into the final message.",
    engine: "react-bits-adapter",
  },
  { id: "scatter-gather", name: "Scatter → Gather", description: "Words converge from a radial scatter.", engine: "react-bits-adapter" },
  { id: "sentence-build", name: "Sentence Build", description: "Builds a sentence in paced word groups.", engine: "native" },
  { id: "word-swap", name: "Word Swap", description: "Words rotate and swap into their final line.", engine: "react-bits-adapter" },
  { id: "follow-type", name: "Follow Type", description: "Characters follow the typing cursor with spring motion.", engine: "native" },
  { id: "text-pill", name: "Text Pill", description: "Expands a compact label into a full statement.", engine: "native" },
  { id: "anchor-reveal", name: "Anchor Reveal", description: "Pins the first word while the rest assemble around it.", engine: "react-bits-adapter" },
];

export type BackgroundPreset = {
  id: BackgroundPresetId;
  name: string;
  className: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
};

export const backgroundPresets: BackgroundPreset[] = [
  { id: "ink", name: "Kinetiq Ink", className: "bg-[#0b0b0f]", backgroundColor: "#0b0b0f" },
  { id: "paper", name: "Paper", className: "bg-[#f7f7f4]", backgroundColor: "#f7f7f4" },
  {
    id: "acid-glow",
    name: "Acid Glow",
    className: "bg-[radial-gradient(circle_at_50%_30%,#d7ff45_0%,#262a1a_28%,#0b0b0f_72%)]",
    backgroundColor: "#0b0b0f",
    backgroundImage: "radial-gradient(circle at 50% 30%, #d7ff45 0%, #262a1a 28%, #0b0b0f 72%)",
  },
  {
    id: "violet-mesh",
    name: "Violet Mesh",
    className: "bg-[radial-gradient(circle_at_25%_30%,#8067ff_0%,transparent_34%),radial-gradient(circle_at_75%_65%,#d7ff45_0%,transparent_28%),#0b0b0f]",
    backgroundColor: "#0b0b0f",
    backgroundImage: "radial-gradient(circle at 25% 30%, #8067ff 0%, transparent 34%), radial-gradient(circle at 75% 65%, #d7ff45 0%, transparent 28%)",
  },
  {
    id: "soft-grid",
    name: "Soft Grid",
    className: "bg-[#101116] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px]",
    backgroundColor: "#101116",
    backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
    backgroundSize: "42px 42px",
  },
  {
    id: "lime-haze",
    name: "Lime Haze",
    className: "bg-[radial-gradient(circle_at_78%_28%,rgba(215,255,69,0.55),transparent_23%),radial-gradient(circle_at_30%_80%,rgba(215,255,69,0.12),transparent_35%),#090a0b]",
    backgroundColor: "#090a0b",
    backgroundImage: "radial-gradient(circle at 78% 28%, rgba(215,255,69,.55), transparent 23%), radial-gradient(circle at 30% 80%, rgba(215,255,69,.12), transparent 35%)",
  },
  {
    id: "violet-glow",
    name: "Violet Glow",
    className: "bg-[radial-gradient(circle_at_50%_42%,rgba(128,103,255,0.65),transparent_32%),#0a0910]",
    backgroundColor: "#0a0910",
    backgroundImage: "radial-gradient(circle at 50% 42%, rgba(128,103,255,.65), transparent 32%)",
  },
  {
    id: "clean-light",
    name: "Clean Light",
    className: "bg-[radial-gradient(circle_at_75%_22%,rgba(215,255,69,0.3),transparent_28%),#f4f5ef]",
    backgroundColor: "#f4f5ef",
    backgroundImage: "radial-gradient(circle at 75% 22%, rgba(215,255,69,.3), transparent 28%)",
  },
];
