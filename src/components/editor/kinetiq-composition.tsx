import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { backgroundPresets } from "@/lib/presets";
import { resolveKeyframeTransform } from "@/lib/motion-keyframes";
import type { Project, UIComponent, VisualComponent } from "@/lib/project-schema";

type KinetiqCompositionProps = { project: Project };

function renderDevice(component: UIComponent, time: number) {
  const isLaptop = component.preset === "device-macbook";
  const ratio = isLaptop ? "1.55 / 1" : component.preset === "device-ipad" ? ".78 / 1" : ".52 / 1";
  const motion = component.deviceMotion ?? "none";
  const transform = motion === "jump" ? `translateY(${Math.sin(time * Math.PI * 2) * -10}px)` : motion === "float" ? `translateY(${Math.sin(time * Math.PI * 2) * -5}px) rotate(${Math.sin(time * Math.PI) * 1.4}deg)` : motion === "tilt" ? `perspective(900px) rotateY(${Math.sin(time * Math.PI * 2) * 7}deg)` : motion === "pulse" ? `scale(${1 + Math.sin(time * Math.PI * 2) * .025})` : undefined;
  return <div style={{ display: "grid", height: "100%", width: "100%", placeItems: "center", perspective: 900 }}><div style={{ position: "relative", height: "92%", width: "82%", aspectRatio: ratio, border: "7px solid #25252d", borderRadius: isLaptop ? 20 : 34, background: "#09090c", boxShadow: "0 22px 45px rgba(0,0,0,.45)", transform }}><div style={{ position: "absolute", inset: `${component.screenPadding ?? 3}%`, overflow: "hidden", borderRadius: 24, background: "#171722" }}>{component.mediaSrc ? component.mediaKind === "video" ? <Video src={component.mediaSrc} muted style={{ width: "100%", height: "100%", objectFit: component.mediaFit ?? "cover", objectPosition: `${component.mediaPositionX ?? 50}% ${component.mediaPositionY ?? 50}%` }} /> : component.mediaKind === "prototype" ? <div style={{ display: "grid", height: "100%", placeItems: "center", color: "#c7beff", fontSize: 20 }}>Prototype preview</div> : <img src={component.mediaSrc} alt="" style={{ width: "100%", height: "100%", objectFit: component.mediaFit ?? "cover", objectPosition: `${component.mediaPositionX ?? 50}% ${component.mediaPositionY ?? 50}%` }} /> : <div style={{ display: "grid", height: "100%", placeItems: "center", background: "linear-gradient(135deg,rgba(128,103,255,.35),rgba(215,255,69,.12))", color: "rgba(255,255,255,.45)", fontSize: 20 }}>Drop media</div>}</div></div></div>;
}

function renderUi(component: UIComponent, time: number) {
  if (component.preset.startsWith("device-")) return renderDevice(component, time);
  if (component.preset === "pointer") {
    const progress = Math.min(1, Math.max(0, time * 1.8));
    const scale = (component.pointerSize ?? 1) * (component.pointerMotion === "click" ? 1 - Math.sin(progress * Math.PI) * .18 : 1);
    return <div style={{ display: "grid", height: "100%", placeItems: "center", transform: `scale(${scale})` }}><div style={{ position: "relative", width: 80, height: 80 }}>{component.pointerClickRing ? <span style={{ position: "absolute", left: 2, top: 2, width: 54, height: 54, borderRadius: 999, border: "3px solid #d7ff45", opacity: 1 - progress, transform: `scale(${.35 + progress})` }} /> : null}<span style={{ position: "absolute", left: 18, top: 5, color: "white", fontSize: 58, fontWeight: 900, filter: "drop-shadow(3px 4px #0b0b0f)" }}>↖</span></div></div>;
  }
  if (component.preset === "notification-stack") return <div style={{ display: "grid", gap: 8 }}>{["Export complete", "Comment added", "Version saved"].map((label, index) => <div key={label} style={{ transform: `translateX(${index * 10}px)`, padding: 16, borderRadius: 15, background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.12)", fontSize: 18 }}>{label}</div>)}</div>;
  if (component.preset === "otp") return <div><div style={{ marginBottom: 16, color: "rgba(255,255,255,.45)", fontSize: 14, letterSpacing: 3 }}>VERIFICATION CODE</div><div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>{"483920".split("").map((digit, index) => <span key={`${digit}-${index}`} style={{ display: "grid", aspectRatio: "1", placeItems: "center", borderRadius: 12, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", fontSize: 26, fontWeight: 800 }}>{digit}</span>)}</div></div>;
  return <div style={{ height: "100%", borderRadius: 24, padding: 24, background: "rgba(17,18,22,.94)", border: "1px solid rgba(255,255,255,.15)", boxShadow: "0 20px 50px rgba(0,0,0,.3)" }}><div style={{ color: "#d7ff45", fontSize: 14, letterSpacing: 2, textTransform: "uppercase" }}>{component.preset}</div><div style={{ marginTop: 14, fontSize: 26, fontWeight: 700 }}>{component.label}</div><div style={{ marginTop: 22, height: 10, width: "65%", borderRadius: 99, background: "rgba(128,103,255,.55)" }} /></div>;
}

function Visual({ component, project, time }: { component: VisualComponent; project: Project; time: number }) {
  const animated = resolveKeyframeTransform(component, time);
  const local = time - component.startTime;
  const enterDuration = component.transitionIn?.duration ?? 0;
  const exitDuration = component.transitionOut?.duration ?? 0;
  const remaining = component.duration - local;
  const transitionOpacity = enterDuration > 0 && local < enterDuration ? Math.max(0, local / enterDuration) : exitDuration > 0 && remaining < exitDuration ? Math.max(0, remaining / exitDuration) : 1;
  const style = { position: "absolute" as const, left: animated.x, top: animated.y, width: component.width, height: component.height, opacity: animated.opacity * transitionOpacity, transform: `scale(${animated.scale}) rotate(${animated.rotation}deg)`, transformOrigin: "center", color: "white", overflow: "hidden" };
  if (component.type === "text") return <div style={{ ...style, display: "grid", placeItems: "center", overflow: "visible", color: component.color, fontSize: component.fontSize, fontWeight: component.fontWeight, lineHeight: 1.02, textAlign: "center" }}>{component.content}</div>;
  if (component.type === "image") return <div style={style}>{component.src ? <img src={component.src} alt="" style={{ width: "100%", height: "100%", objectFit: component.fit }} /> : null}</div>;
  if (component.type === "video") return <div style={style}>{component.src ? <Video src={component.src} muted={component.muted} playbackRate={component.playbackRate ?? 1} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : null}</div>;
  if (component.type === "shape") return <div style={{ ...style, background: component.fill, borderRadius: component.shape === "rectangle" ? component.radius : 999 }} />;
  return <div style={style}>{renderUi(component, local)}</div>;
}

export function KinetiqComposition({ project }: KinetiqCompositionProps) {
  const frame = useCurrentFrame();
  const time = frame / project.fps;
  const scene = project.scenes[0];
  const background = backgroundPresets.find((preset) => preset.id === scene.backgroundPresetId) ?? backgroundPresets[0];
  return <AbsoluteFill style={{ backgroundColor: background.backgroundColor, backgroundImage: background.backgroundImage, backgroundSize: background.backgroundSize, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>{scene.layers.filter((layer) => layer.visible).flatMap((layer) => layer.components).filter((component) => time >= component.startTime && time <= component.startTime + component.duration).map((component) => <Visual key={component.id} component={component} project={project} time={time} />)}{scene.musicTracks.filter((track) => track.src && !track.muted).map((track) => <Sequence key={track.id} from={Math.round(track.startTime * project.fps)} durationInFrames={Math.round(track.duration * project.fps)}><Audio src={track.src!} volume={track.volume} loop={track.loop} /></Sequence>)}</AbsoluteFill>;
}
