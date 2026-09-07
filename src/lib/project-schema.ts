import { z } from "zod";

export const MotionPresetIdSchema = z.enum([
  "none",
  "fade",
  "rise",
  "pop",
  "blur-reveal",
  "split-rise",
]);

export const SplitBySchema = z.enum(["words", "characters"]);

export const MotionSettingsSchema = z.object({
  duration: z.number().min(0.1).max(3),
  stagger: z.number().min(0).max(0.5),
  splitBy: SplitBySchema,
});

export const BackgroundPresetIdSchema = z.enum([
  "ink",
  "paper",
  "acid-glow",
  "violet-mesh",
]);

export const TextElementSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  fontSize: z.number(),
  fontWeight: z.number(),
  color: z.string(),
  startTime: z.number().min(0),
  duration: z.number().positive(),
  motionPresetId: MotionPresetIdSchema,
  motionSettings: MotionSettingsSchema,
});

export const SceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationInSeconds: z.number().positive(),
  backgroundPresetId: BackgroundPresetIdSchema,
  elements: z.array(TextElementSchema),
});

export const ProjectSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  fps: z.number().positive(),
  scenes: z.array(SceneSchema).min(1),
});

export type MotionPresetId = z.infer<typeof MotionPresetIdSchema>;
export type SplitBy = z.infer<typeof SplitBySchema>;
export type MotionSettings = z.infer<typeof MotionSettingsSchema>;
export type BackgroundPresetId = z.infer<typeof BackgroundPresetIdSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Project = z.infer<typeof ProjectSchema>;
