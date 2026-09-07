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
];
