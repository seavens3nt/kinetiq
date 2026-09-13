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
];

export type BackgroundPreset = {
  id: BackgroundPresetId;
  name: string;
  className: string;
};

export const backgroundPresets: BackgroundPreset[] = [
  { id: "ink", name: "Kinetiq Ink", className: "bg-[#0b0b0f]" },
  { id: "paper", name: "Paper", className: "bg-[#f7f7f4]" },
  {
    id: "acid-glow",
    name: "Acid Glow",
    className: "bg-[radial-gradient(circle_at_50%_30%,#d7ff45_0%,#262a1a_28%,#0b0b0f_72%)]",
  },
  {
    id: "violet-mesh",
    name: "Violet Mesh",
    className: "bg-[radial-gradient(circle_at_25%_30%,#8067ff_0%,transparent_34%),radial-gradient(circle_at_75%_65%,#d7ff45_0%,transparent_28%),#0b0b0f]",
  },
  {
    id: "soft-grid",
    name: "Soft Grid",
    className: "bg-[#101116] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:42px_42px]",
  },
  {
    id: "lime-haze",
    name: "Lime Haze",
    className: "bg-[radial-gradient(circle_at_78%_28%,rgba(215,255,69,0.55),transparent_23%),radial-gradient(circle_at_30%_80%,rgba(215,255,69,0.12),transparent_35%),#090a0b]",
  },
  {
    id: "violet-glow",
    name: "Violet Glow",
    className: "bg-[radial-gradient(circle_at_50%_42%,rgba(128,103,255,0.65),transparent_32%),#0a0910]",
  },
  {
    id: "clean-light",
    name: "Clean Light",
    className: "bg-[radial-gradient(circle_at_75%_22%,rgba(215,255,69,0.3),transparent_28%),#f4f5ef]",
  },
];
