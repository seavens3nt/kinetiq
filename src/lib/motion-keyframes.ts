import type { TransformKeyframe, VisualComponent } from "@/lib/project-schema";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ease(value: number, easing: TransformKeyframe["easing"]) {
  if (easing === "ease-out") return 1 - Math.pow(1 - value, 3);
  if (easing === "ease-in-out") return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  if (easing === "spring") return 1 - Math.exp(-7 * value) * Math.cos(value * Math.PI * 2.5);
  return value;
}

export function resolveKeyframeTransform(component: VisualComponent, currentTime: number) {
  const keyframes = component.keyframes ?? [];
  if (!keyframes.length) return { x: component.x, y: component.y, scale: 1, rotation: component.rotation ?? 0, opacity: component.opacity ?? 1 };
  const local = clamp(currentTime - component.startTime, 0, component.duration);
  const ordered = [...keyframes].sort((a, b) => a.time - b.time);
  const before = [...ordered].reverse().find((keyframe) => keyframe.time <= local) ?? ordered[0];
  const after = ordered.find((keyframe) => keyframe.time >= local) ?? ordered[ordered.length - 1];
  const span = Math.max(0.001, after.time - before.time);
  const progress = before === after ? 0 : ease(clamp((local - before.time) / span, 0, 1), after.easing ?? before.easing);
  return {
    x: before.x + (after.x - before.x) * progress,
    y: before.y + (after.y - before.y) * progress,
    scale: before.scale + (after.scale - before.scale) * progress,
    rotation: (before.rotation ?? component.rotation ?? 0) + ((after.rotation ?? component.rotation ?? 0) - (before.rotation ?? component.rotation ?? 0)) * progress,
    opacity: before.opacity + (after.opacity - before.opacity) * progress,
  };
}

export function makePresetKeyframes(component: VisualComponent, preset: "jump" | "float" | "reveal" | "tap" | "swipe") {
  const base = { x: component.x, y: component.y, scale: 1, rotation: component.rotation ?? 0, opacity: component.opacity ?? 1 };
  const keyframe = (time: number, patch: Partial<typeof base>, easing: TransformKeyframe["easing"] = "ease-out"): TransformKeyframe => ({ id: `kf-${Date.now()}-${time}-${Math.random().toString(36).slice(2, 5)}`, time, easing, ...base, ...patch });
  if (preset === "jump") return [keyframe(0, {}), keyframe(Math.min(.28, component.duration * .2), { y: base.y - Math.max(18, component.height * .08), scale: 1.02 }, "ease-out"), keyframe(Math.min(.58, component.duration * .4), {}, "spring")];
  if (preset === "float") return [keyframe(0, {}), keyframe(Math.min(1, component.duration / 2), { y: base.y - Math.max(10, component.height * .035), rotation: base.rotation + 1.5 }, "ease-in-out"), keyframe(Math.min(2, component.duration), {}, "ease-in-out")];
  if (preset === "reveal") return [keyframe(0, { y: base.y + Math.max(30, component.height * .12), scale: .9, opacity: 0 }), keyframe(Math.min(.65, component.duration), {}, "spring")];
  if (preset === "tap") return [keyframe(0, {}), keyframe(Math.min(.12, component.duration * .2), { scale: .82 }, "ease-out"), keyframe(Math.min(.28, component.duration * .4), {}, "spring")];
  return [keyframe(0, {}), keyframe(Math.min(.7, component.duration), { x: base.x + Math.max(80, component.width * .45) }, "ease-in-out")];
}
