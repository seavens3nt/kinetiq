import { z } from "zod";

export const MotionPresetIdSchema = z.enum([
  "none",
  "fade",
  "rise",
  "pop",
  "blur-reveal",
  "split-rise",
  "typing",
  "blur-stagger",
  "shiny",
  "decrypt",
  "scatter-gather",
  "sentence-build",
  "word-swap",
  "follow-type",
  "text-pill",
  "anchor-reveal",
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
  "soft-grid",
  "lime-haze",
  "violet-glow",
  "clean-light",
]);

export const TransitionTypeSchema = z.enum(["none", "fade", "dissolve", "slide", "zoom", "chromatic-blur", "color-smear"]);
export const TransitionSchema = z.object({
  type: TransitionTypeSchema,
  duration: z.number().min(0).max(2),
});

export const TransformKeyframeSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  x: z.number(),
  y: z.number(),
  scale: z.number().positive(),
  rotation: z.number().min(-360).max(360).optional(),
  opacity: z.number().min(0).max(1),
  easing: z.enum(["linear", "ease-out", "ease-in-out", "spring"]).optional(),
});

const TimedComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.number().min(0),
  duration: z.number().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().min(-360).max(360).optional(),
  opacity: z.number().min(0).max(1).optional(),
  transitionIn: TransitionSchema.optional(),
  transitionOut: TransitionSchema.optional(),
  keyframes: z.array(TransformKeyframeSchema).optional(),
});

export const TextComponentSchema = TimedComponentSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.number().positive(),
  color: z.string(),
  motionPresetId: MotionPresetIdSchema,
  motionSettings: MotionSettingsSchema,
  wordStyles: z.array(z.object({
    wordIndex: z.number().int().min(0),
    color: z.string().optional(),
    fontWeight: z.number().positive().optional(),
    fontSizeScale: z.number().min(0.5).max(2).optional(),
    opacity: z.number().min(0).max(1).optional(),
  })).optional(),
  typingSfx: z.object({
    enabled: z.boolean(),
    volume: z.number().min(0).max(1),
    pitch: z.number().min(0.5).max(2),
  }).optional(),
});

export const ImageComponentSchema = TimedComponentSchema.extend({
  type: z.literal("image"),
  src: z.string().nullable(),
  fit: z.enum(["contain", "cover"]),
});

export const VideoComponentSchema = TimedComponentSchema.extend({
  type: z.literal("video"),
  src: z.string().nullable(),
  muted: z.boolean(),
  playbackRate: z.number().min(0.25).max(4).optional(),
});

export const ShapeComponentSchema = TimedComponentSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rectangle", "circle", "pill"]),
  fill: z.string(),
  radius: z.number().min(0),
});

export const UIComponentSchema = TimedComponentSchema.extend({
  type: z.literal("ui"),
  preset: z.enum(["notification", "statistic", "progress-card", "phone", "browser", "graph", "notification-stack", "otp", "apple-control", "figma-panel", "cursor", "device-phone", "device-macbook", "device-ipad", "pointer", "ios-sheet", "safari-window", "macos-menu", "app-card", "design-inspector"]),
  label: z.string(),
  mediaSrc: z.string().nullable().optional(),
  mediaKind: z.enum(["image", "video", "prototype"]).optional(),
  mediaFit: z.enum(["contain", "cover"]).optional(),
  mediaPositionX: z.number().min(0).max(100).optional(),
  mediaPositionY: z.number().min(0).max(100).optional(),
  screenPadding: z.number().min(0).max(16).optional(),
  deviceMotion: z.enum(["none", "float", "jump", "tilt", "pulse"]).optional(),
  pointerMotion: z.enum(["none", "click", "hover", "drag", "bounce"]).optional(),
  pointerSize: z.number().min(0.5).max(3).optional(),
  pointerTrail: z.boolean().optional(),
  pointerClickRing: z.boolean().optional(),
});

export const VisualComponentSchema = z.discriminatedUnion("type", [
  TextComponentSchema,
  ImageComponentSchema,
  VideoComponentSchema,
  ShapeComponentSchema,
  UIComponentSchema,
]);

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  components: z.array(VisualComponentSchema),
});

export const MusicTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  src: z.string().nullable(),
  startTime: z.number().min(0),
  duration: z.number().positive(),
  volume: z.number().min(0).max(1),
  loop: z.boolean(),
  muted: z.boolean(),
  locked: z.boolean(),
});

export const TimelineMarkerSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  label: z.string(),
});

export const SceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationInSeconds: z.number().positive(),
  backgroundPresetId: BackgroundPresetIdSchema,
  layers: z.array(LayerSchema),
  musicTracks: z.array(MusicTrackSchema),
  markers: z.array(TimelineMarkerSchema),
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
export type TransitionType = z.infer<typeof TransitionTypeSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type TransformKeyframe = z.infer<typeof TransformKeyframeSchema>;
export type TextComponent = z.infer<typeof TextComponentSchema>;
export type TextWordStyle = NonNullable<TextComponent["wordStyles"]>[number];
export type TypingSfx = NonNullable<TextComponent["typingSfx"]>;
export type ImageComponent = z.infer<typeof ImageComponentSchema>;
export type VideoComponent = z.infer<typeof VideoComponentSchema>;
export type ShapeComponent = z.infer<typeof ShapeComponentSchema>;
export type UIComponent = z.infer<typeof UIComponentSchema>;
export type VisualComponent = z.infer<typeof VisualComponentSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type MusicTrack = z.infer<typeof MusicTrackSchema>;
export type TimelineMarker = z.infer<typeof TimelineMarkerSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Project = z.infer<typeof ProjectSchema>;
