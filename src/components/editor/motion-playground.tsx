"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AnimatedText } from "@/components/editor/animated-text";
import { ProjectStartScreen } from "@/components/editor/project-start-screen";
import { TimelineEditor } from "@/components/editor/timeline-editor";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import type { MotionPresetId, TransitionType, VisualComponent } from "@/lib/project-schema";
import { useEditorStore } from "@/store/editor-store";

function componentLabel(component: VisualComponent) {
  if (component.type === "text") return component.content;
  if (component.type === "ui") return component.label;
  return component.name;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const transitions: TransitionType[] = ["none", "fade", "dissolve", "slide", "zoom"];

type CanvasGuide = { x?: number; y?: number } | null;
type TransformMode = "move" | "resize" | "rotate";

export function MotionPlayground() {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewPresetId, setPreviewPresetId] = useState<MotionPresetId | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [canvasGuide, setCanvasGuide] = useState<CanvasGuide>(null);

  const {
    project,
    replayKey,
    currentTime,
    isPlaying,
    selectedLayerId,
    selectedComponentId,
    selectedMusicTrackId,
    snapEnabled,
    startBlankProject,
    setHeadline,
    setMotionPreset,
    setMotionDuration,
    setMotionStagger,
    setSplitBy,
    setBackgroundPreset,
    setCurrentTime,
    setPlaying,
    togglePlayback,
    deleteSelectedComponent,
    duplicateSelection,
    moveLayer,
    setSelectedComponent,
    checkpoint,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const allComponents = useMemo(() => timeline.layers.flatMap((layer) => layer.components), [timeline.layers]);
  const selectedComponent = allComponents.find((component) => component.id === selectedComponentId) ?? null;
  const selectedLayer = timeline.layers.find((layer) => layer.id === selectedLayerId) ?? null;
  const selectedText = selectedComponent?.type === "text" ? selectedComponent : null;
  const selectedMusic = timeline.musicTracks.find((track) => track.id === selectedMusicTrackId) ?? null;
  const background = backgroundPresets.find((item) => item.id === timeline.backgroundPresetId)!;

  useEffect(() => {
    if (!isPlaying) return;
    let previous = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const deltaSeconds = (now - previous) / 1000;
      previous = now;
      const state = useEditorStore.getState();
      const masterTimeline = state.project.scenes[0];
      const nextTime = state.currentTime + deltaSeconds;
      if (nextTime >= masterTimeline.durationInSeconds) {
        state.setCurrentTime(masterTimeline.durationInSeconds);
        state.setPlaying(false);
        return;
      }
      state.setCurrentTime(nextTime);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, setCurrentTime, setPlaying]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
      if (event.code === "Space" && hasStarted) {
        event.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback, hasStarted]);

  const visibleComponents = useMemo(
    () =>
      timeline.layers
        .filter((layer) => layer.visible)
        .flatMap((layer) =>
          layer.components
            .filter((component) => currentTime >= component.startTime && currentTime <= component.startTime + component.duration)
            .map((component) => ({ component, layerId: layer.id })),
        ),
    [timeline.layers, currentTime],
  );

  const updateComponent = (updater: (component: VisualComponent) => VisualComponent) => {
    if (!selectedComponentId) return;
    useEditorStore.setState((state) => {
      const scene = state.project.scenes[0];
      return {
        project: {
          ...state.project,
          scenes: [
            {
              ...scene,
              layers: scene.layers.map((layer) => ({
                ...layer,
                components: layer.components.map((component) => component.id === selectedComponentId ? updater(component) : component),
              })),
            },
            ...state.project.scenes.slice(1),
          ],
        },
        replayKey: state.replayKey + 1,
      };
    });
  };

  const beginCanvasTransform = (event: ReactPointerEvent, mode: TransformMode) => {
    if (!selectedComponent || !canvasRef.current || selectedLayer?.locked) return;
    event.preventDefault();
    event.stopPropagation();
    checkpoint();

    const rect = canvasRef.current.getBoundingClientRect();
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const start = {
      x: selectedComponent.x,
      y: selectedComponent.y,
      width: selectedComponent.width,
      height: selectedComponent.height,
      rotation: selectedComponent.rotation ?? 0,
    };
    const unitX = project.width / rect.width;
    const unitY = project.height / rect.height;
    const snapX = 8 * unitX;
    const snapY = 8 * unitY;
    const centerClientX = rect.left + ((start.x + start.width / 2) / project.width) * rect.width;
    const centerClientY = rect.top + ((start.y + start.height / 2) / project.height) * rect.height;
    const startAngle = Math.atan2(startClientY - centerClientY, startClientX - centerClientX) * 180 / Math.PI;

    const onMove = (pointer: PointerEvent) => {
      const dx = (pointer.clientX - startClientX) * unitX;
      const dy = (pointer.clientY - startClientY) * unitY;

      if (mode === "rotate") {
        const angle = Math.atan2(pointer.clientY - centerClientY, pointer.clientX - centerClientX) * 180 / Math.PI;
        let rotation = start.rotation + (angle - startAngle);
        if (snapEnabled) rotation = Math.round(rotation / 15) * 15;
        updateComponent((component) => ({ ...component, rotation: clamp(rotation, -360, 360) }));
        return;
      }

      if (mode === "resize") {
        let width = Math.max(40, start.width + dx);
        let height = Math.max(40, start.height + dy);
        const guide: Exclude<CanvasGuide, null> = {};

        if (snapEnabled) {
          const right = start.x + width;
          const bottom = start.y + height;
          const xTargets = [project.width / 2, project.width];
          const yTargets = [project.height / 2, project.height];
          for (const target of xTargets) {
            if (Math.abs(right - target) <= snapX) {
              width = Math.max(40, target - start.x);
              guide.x = target;
              break;
            }
          }
          for (const target of yTargets) {
            if (Math.abs(bottom - target) <= snapY) {
              height = Math.max(40, target - start.y);
              guide.y = target;
              break;
            }
          }
        }

        width = Math.min(width, project.width - start.x);
        height = Math.min(height, project.height - start.y);
        setCanvasGuide(guide.x !== undefined || guide.y !== undefined ? guide : null);
        updateComponent((component) => ({ ...component, width, height }));
        return;
      }

      let x = clamp(start.x + dx, 0, Math.max(0, project.width - start.width));
      let y = clamp(start.y + dy, 0, Math.max(0, project.height - start.height));
      const guide: Exclude<CanvasGuide, null> = {};

      if (snapEnabled) {
        const xCandidates = [
          { value: 0, guide: 0 },
          { value: project.width / 2 - start.width / 2, guide: project.width / 2 },
          { value: project.width - start.width, guide: project.width },
        ];
        const yCandidates = [
          { value: 0, guide: 0 },
          { value: project.height / 2 - start.height / 2, guide: project.height / 2 },
          { value: project.height - start.height, guide: project.height },
        ];
        for (const candidate of xCandidates) {
          if (Math.abs(x - candidate.value) <= snapX) {
            x = candidate.value;
            guide.x = candidate.guide;
            break;
          }
        }
        for (const candidate of yCandidates) {
          if (Math.abs(y - candidate.value) <= snapY) {
            y = candidate.value;
            guide.y = candidate.guide;
            break;
          }
        }
      }

      setCanvasGuide(guide.x !== undefined || guide.y !== undefined ? guide : null);
      updateComponent((component) => ({ ...component, x, y }));
    };

    const onUp = () => {
      setCanvasGuide(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const updateMusic = (src: string, name: string) => {
    useEditorStore.setState((state) => {
      const scene = state.project.scenes[0];
      const track = {
        id: uid("music"),
        name,
        src,
        startTime: state.currentTime,
        duration: Math.max(0.1, scene.durationInSeconds - state.currentTime),
        volume: 0.8,
        loop: false,
        muted: false,
        locked: false,
      };
      return {
        project: { ...state.project, scenes: [{ ...scene, musicTracks: [...scene.musicTracks, track] }, ...state.project.scenes.slice(1)] },
        selectedMusicTrackId: track.id,
        selectedComponentId: null,
        selectedComponentIds: [],
      };
    });
  };

  const importFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/"));
    if (!accepted.length) return;
    checkpoint();

    accepted.forEach((file, fileIndex) => {
      const src = URL.createObjectURL(file);
      if (file.type.startsWith("audio/")) {
        updateMusic(src, file.name);
        return;
      }

      useEditorStore.setState((state) => {
        const scene = state.project.scenes[0];
        const type = file.type.startsWith("image/") ? "image" : "video";
        const component: VisualComponent = type === "image"
          ? {
              id: uid("image"), name: file.name, type: "image", src, fit: "contain",
              startTime: state.currentTime, duration: Math.min(3, Math.max(0.1, scene.durationInSeconds - state.currentTime)),
              x: Math.round(state.project.width * 0.15), y: Math.round(state.project.height * 0.2 + fileIndex * 30),
              width: Math.round(state.project.width * 0.7), height: Math.round(state.project.height * 0.5), rotation: 0, opacity: 1,
              transitionIn: { type: "none", duration: 0.35 }, transitionOut: { type: "none", duration: 0.35 }, keyframes: [],
            }
          : {
              id: uid("video"), name: file.name, type: "video", src, muted: true, playbackRate: 1,
              startTime: state.currentTime, duration: Math.min(5, Math.max(0.1, scene.durationInSeconds - state.currentTime)),
              x: Math.round(state.project.width * 0.15), y: Math.round(state.project.height * 0.2 + fileIndex * 30),
              width: Math.round(state.project.width * 0.7), height: Math.round(state.project.height * 0.5), rotation: 0, opacity: 1,
              transitionIn: { type: "none", duration: 0.35 }, transitionOut: { type: "none", duration: 0.35 }, keyframes: [],
            };

        const target = scene.layers.find((layer) => layer.id === state.selectedLayerId && !layer.locked);
        const layerId = target?.id ?? uid("layer");
        const layers = target
          ? scene.layers.map((layer) => layer.id === target.id ? { ...layer, components: [...layer.components, component] } : layer)
          : [...scene.layers, { id: layerId, name: `Layer ${scene.layers.length + 1}`, visible: true, locked: false, components: [component] }];

        return {
          project: { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] },
          selectedLayerId: layerId,
          selectedComponentId: component.id,
          selectedComponentIds: [component.id],
          selectedMusicTrackId: null,
        };
      });
    });
  };

  const addKeyframe = () => {
    if (!selectedComponent) return;
    checkpoint();
    const localTime = Math.max(0, Math.min(selectedComponent.duration, currentTime - selectedComponent.startTime));
    updateComponent((component) => {
      const next = {
        id: uid("kf"),
        time: localTime,
        x: component.x,
        y: component.y,
        scale: 1,
        opacity: component.opacity ?? 1,
      };
      const keyframes = [...(component.keyframes ?? []).filter((keyframe) => Math.abs(keyframe.time - localTime) > 0.02), next].sort((a, b) => a.time - b.time);
      return { ...component, keyframes } as VisualComponent;
    });
  };

  const transitionStyle = (component: VisualComponent): { opacity?: number; transform?: string } => {
    const local = currentTime - component.startTime;
    const remaining = component.duration - local;
    const inTransition = component.transitionIn ?? { type: "none" as const, duration: 0 };
    const outTransition = component.transitionOut ?? { type: "none" as const, duration: 0 };
    let progress = 1;
    let type: TransitionType = "none";

    if (inTransition.type !== "none" && inTransition.duration > 0 && local < inTransition.duration) {
      progress = Math.max(0, local / inTransition.duration);
      type = inTransition.type;
    } else if (outTransition.type !== "none" && outTransition.duration > 0 && remaining < outTransition.duration) {
      progress = Math.max(0, remaining / outTransition.duration);
      type = outTransition.type;
    }

    if (type === "none") return {};
    if (type === "slide") return { opacity: progress, transform: `translateX(${(1 - progress) * 28}px)` };
    if (type === "zoom") return { opacity: progress, transform: `scale(${0.9 + progress * 0.1})` };
    return { opacity: progress };
  };

  const activeReplayKey = replayKey + previewKey;
  const isLandscape = project.width > project.height;
  const selectedVisible = selectedComponent && selectedLayer?.visible && currentTime >= selectedComponent.startTime && currentTime <= selectedComponent.startTime + selectedComponent.duration;

  if (!hasStarted) {
    return <ProjectStartScreen onStart={(width, height) => { startBlankProject(width, height); setHasStarted(true); }} />;
  }

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0B0B0F] text-[#F7F7F4]">
      <input ref={mediaInputRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(event) => event.target.files && importFiles(event.target.files)} />

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#101015] px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#D7FF45] font-black text-[#0B0B0F]">K</div>
          <div><div className="text-sm font-semibold tracking-tight">Kinetiq</div><div className="text-[10px] text-white/40">Motion Studio</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => mediaInputRef.current?.click()} className="rounded-full border border-[#8067FF]/30 bg-[#8067FF]/10 px-3 py-1.5 text-[10px] font-medium text-[#C7BEFF] hover:border-[#D7FF45]/45 hover:text-[#D7FF45]">Import media</button>
          <button type="button" onClick={() => setHasStarted(false)} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/45 hover:border-[#8067FF]/40 hover:text-white">{project.width} × {project.height}</button>
          <div className="hidden rounded-full border border-[#8067FF]/25 bg-[#8067FF]/10 px-3 py-1.5 text-[11px] text-[#C7BEFF] 2xl:block">{timeline.layers.length} layers · {allComponents.length} components{timeline.musicTracks.length ? ` · ${timeline.musicTracks.length} music` : ""}</div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[240px_1fr_300px]">
          <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Text animations</p>
              <p className="mt-1 text-[10px] text-white/30">{selectedText ? "Hover to preview · click to apply" : "Select a text component to use motion presets"}</p>
            </div>
            <div className={`space-y-1.5 ${selectedText ? "" : "pointer-events-none opacity-35"}`}>
              {motionPresets.map((preset) => (
                <button key={preset.id} onMouseEnter={() => { if (selectedText) { setPreviewPresetId(preset.id); setPreviewKey((value) => value + 1); } }} onMouseLeave={() => setPreviewPresetId(null)} onClick={() => selectedText && setMotionPreset(preset.id)} className={`group w-full rounded-lg border p-2.5 text-left transition ${selectedText?.motionPresetId === preset.id ? "border-[#D7FF45] bg-[#D7FF45]/10" : "border-white/10 bg-white/[0.025] hover:border-[#8067FF]/40 hover:bg-[#8067FF]/10"}`}>
                  <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold">{preset.name}</div>{preset.engine === "react-bits-adapter" && <span className="rounded-full bg-[#8067FF]/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#A999FF]">React Bits</span>}</div>
                  <div className="mt-1 text-[10px] leading-4 text-white/45">{preset.description}</div>
                  {selectedText && <div className="mt-2 overflow-hidden rounded-md border border-white/10 bg-black/25 px-2 py-2.5"><AnimatedText text="MOVE" presetId={preset.id} motionSettings={{ ...selectedText.motionSettings, splitBy: "characters" }} replayKey={previewPresetId === preset.id ? previewKey : 0} compact /></div>}
                </button>
              ))}
            </div>
          </aside>

          <div
            className={`relative flex min-h-0 items-center justify-center overflow-hidden bg-[#17181d] p-3 lg:p-5 ${isDraggingMedia ? "ring-2 ring-inset ring-[#D7FF45]/60" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDraggingMedia(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDraggingMedia(false); }}
            onDrop={(event) => { event.preventDefault(); setIsDraggingMedia(false); importFiles(event.dataTransfer.files); }}
          >
            {isDraggingMedia && <div className="pointer-events-none absolute inset-4 z-50 grid place-items-center rounded-2xl border-2 border-dashed border-[#D7FF45]/60 bg-[#0B0B0F]/80 text-sm font-semibold text-[#D7FF45] backdrop-blur">Drop image, video, or audio</div>}
            <div ref={canvasRef} className={`relative min-h-0 overflow-hidden rounded-[22px] border border-white/10 shadow-2xl ${background.className} ${isLandscape ? "w-[min(100%,900px)] max-h-full" : "h-full max-w-full"}`} style={{ aspectRatio: `${project.width} / ${project.height}` }}>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
              {allComponents.length === 0 && <div className="absolute inset-0 grid place-items-center px-8 text-center"><div><div className="text-sm font-semibold text-white/40">Blank canvas</div><div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/20">Drop media here or use + Add below</div></div></div>}
              {allComponents.length > 0 && visibleComponents.length === 0 && <div className="absolute inset-0 grid place-items-center px-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">Scrub into a component or press Play</div>}

              {canvasGuide?.x !== undefined && <div className="pointer-events-none absolute inset-y-0 z-40 w-px bg-[#D7FF45]/80" style={{ left: `${(canvasGuide.x / project.width) * 100}%` }} />}
              {canvasGuide?.y !== undefined && <div className="pointer-events-none absolute inset-x-0 z-40 h-px bg-[#D7FF45]/80" style={{ top: `${(canvasGuide.y / project.height) * 100}%` }} />}

              {visibleComponents.map(({ component, layerId }, index) => {
                const isSelected = selectedComponentId === component.id;
                const left = `${(component.x / project.width) * 100}%`;
                const top = `${(component.y / project.height) * 100}%`;
                const width = `${Math.min(95, (component.width / project.width) * 100)}%`;
                const height = `${Math.min(90, (component.height / project.height) * 100)}%`;
                const transition = transitionStyle(component);
                const transitionOpacity = transition.opacity ?? 1;
                const transitionTransform = transition.transform ? `${transition.transform} ` : "";
                const shared = { left, top, width, height, opacity: transitionOpacity * (component.opacity ?? 1), transform: `${transitionTransform}rotate(${component.rotation ?? 0}deg)`, transformOrigin: "center center" };
                const select = () => setSelectedComponent(component.id, layerId);

                if (component.type === "text") {
                  return <button key={component.id} onClick={select} className={`absolute flex items-center justify-center rounded-xl px-2 outline-none ${isSelected ? "ring-1 ring-[#D7FF45]/35" : ""}`} style={shared}><AnimatedText text={component.content} presetId={isSelected && previewPresetId ? previewPresetId : component.motionPresetId} motionSettings={component.motionSettings} replayKey={activeReplayKey + index + Math.round(component.startTime * 100)} /></button>;
                }
                if (component.type === "image" && component.src) {
                  return <button key={component.id} onClick={select} className={`absolute overflow-hidden rounded-xl ${isSelected ? "ring-1 ring-[#D7FF45]/35" : ""}`} style={shared}><img src={component.src} alt={component.name} className={`h-full w-full ${component.fit === "cover" ? "object-cover" : "object-contain"}`} /></button>;
                }
                if (component.type === "video" && component.src) {
                  return <button key={component.id} onClick={select} className={`absolute overflow-hidden rounded-xl bg-black ${isSelected ? "ring-1 ring-[#D7FF45]/35" : ""}`} style={shared}><video src={component.src} muted={component.muted} autoPlay loop playsInline onLoadedMetadata={(event) => { event.currentTarget.playbackRate = component.playbackRate ?? 1; }} className="h-full w-full object-contain" /></button>;
                }
                if (component.type === "shape") return <button key={component.id} onClick={select} className={`absolute ${isSelected ? "ring-1 ring-[#D7FF45]/35" : ""}`} style={{ ...shared, background: component.fill, borderRadius: component.shape === "circle" ? "999px" : component.shape === "pill" ? "999px" : component.radius }} />;
                if (component.type === "ui") return <button key={component.id} onClick={select} className={`absolute rounded-2xl border bg-[#111216]/90 p-4 text-left shadow-xl backdrop-blur ${isSelected ? "border-[#D7FF45]/60" : "border-white/15"}`} style={shared}><div className="text-[9px] uppercase tracking-[0.16em] text-[#D7FF45]">{component.preset}</div><div className="mt-2 text-sm font-semibold">{component.label}</div><div className="mt-2 h-2 w-2/3 rounded-full bg-[#8067FF]/50" /></button>;
                return <button key={component.id} onClick={select} className={`absolute grid place-items-center rounded-2xl border border-dashed bg-black/20 text-center ${isSelected ? "border-[#D7FF45] text-[#D7FF45]" : "border-white/20 text-white/35"}`} style={shared}><div><div className="text-xl">{component.type === "image" ? "▧" : "▶"}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">{component.type}</div><div className="mt-1 text-[9px] opacity-60">Drop or import media</div></div></button>;
              })}

              {selectedVisible && selectedComponent && (
                <div
                  className={`absolute z-50 border ${selectedLayer?.locked ? "border-amber-300/70" : "border-[#D7FF45]"}`}
                  style={{
                    left: `${(selectedComponent.x / project.width) * 100}%`,
                    top: `${(selectedComponent.y / project.height) * 100}%`,
                    width: `${(selectedComponent.width / project.width) * 100}%`,
                    height: `${(selectedComponent.height / project.height) * 100}%`,
                    transform: `rotate(${selectedComponent.rotation ?? 0}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  <div onPointerDown={(event) => beginCanvasTransform(event, "move")} className={`absolute inset-0 ${selectedLayer?.locked ? "cursor-not-allowed" : "cursor-move"}`} />
                  {!selectedLayer?.locked && <>
                    <button type="button" aria-label="Rotate component" onPointerDown={(event) => beginCanvasTransform(event, "rotate")} className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-7 rounded-full border-2 border-[#0B0B0F] bg-[#D7FF45] shadow" />
                    <div className="pointer-events-none absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 -translate-y-5 bg-[#D7FF45]" />
                    <button type="button" aria-label="Resize component" onPointerDown={(event) => beginCanvasTransform(event, "resize")} className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-sm border-2 border-[#0B0B0F] bg-[#D7FF45] shadow" />
                  </>}
                </div>
              )}
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
            <div className="space-y-5">
              {selectedMusic ? (
                <>
                  <div><div className="text-xs font-semibold text-[#D7FF45]">♫ {selectedMusic.name}</div><div className="mt-1 text-[10px] text-white/35">Music track · {selectedMusic.duration.toFixed(1)}s</div></div>
                  <div className="rounded-xl border border-[#D7FF45]/15 bg-[#D7FF45]/[0.04] p-4 text-[10px] leading-5 text-white/45">{selectedMusic.src ? "Audio imported. The timeline now shows a waveform-style track preview." : "Import or drop an audio file to create a soundtrack clip."}</div>
                </>
              ) : selectedComponent ? (
                <>
                  <div className="flex items-center justify-between gap-4"><div className="min-w-0"><div className="text-xs font-semibold">Selected component</div><div className="truncate text-[10px] text-white/35">{componentLabel(selectedComponent)} · {selectedComponent.type}{selectedLayer?.locked ? " · locked" : ""}</div></div><button onClick={deleteSelectedComponent} className="text-[10px] text-white/35 hover:text-red-300">Delete</button></div>

                  <div>
                    <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Transform</p><span className="text-[9px] text-white/30">Snap {snapEnabled ? "on" : "off"}</span></div>
                    <div className={`space-y-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 ${selectedLayer?.locked ? "pointer-events-none opacity-45" : ""}`}>
                      <div className="grid grid-cols-2 gap-2">
                        {(["x", "y", "width", "height"] as const).map((field) => <label key={field} className="text-[9px] uppercase tracking-[0.12em] text-white/35"><span>{field === "width" ? "W" : field === "height" ? "H" : field.toUpperCase()}</span><input type="number" value={Math.round(selectedComponent[field])} onFocus={checkpoint} onChange={(event) => { const value = Number(event.target.value); updateComponent((component) => ({ ...component, [field]: field === "width" || field === "height" ? Math.max(1, value) : value }) as VisualComponent); }} className="mt-1 w-full rounded-md border border-white/10 bg-[#15151B] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#8067FF]/60" /></label>)}
                      </div>
                      <div><div className="mb-1.5 flex justify-between text-[10px] text-white/45"><span>Rotation</span><span>{Math.round(selectedComponent.rotation ?? 0)}°</span></div><input type="range" min="-180" max="180" step="1" value={selectedComponent.rotation ?? 0} onPointerDown={checkpoint} onChange={(event) => updateComponent((component) => ({ ...component, rotation: Number(event.target.value) }))} className="w-full accent-[#8067FF]" /></div>
                      <div><div className="mb-1.5 flex justify-between text-[10px] text-white/45"><span>Opacity</span><span>{Math.round((selectedComponent.opacity ?? 1) * 100)}%</span></div><input type="range" min="0" max="1" step="0.01" value={selectedComponent.opacity ?? 1} onPointerDown={checkpoint} onChange={(event) => updateComponent((component) => ({ ...component, opacity: Number(event.target.value) }))} className="w-full accent-[#D7FF45]" /></div>
                      <div className="grid grid-cols-3 gap-1.5"><button onClick={duplicateSelection} className="rounded-md border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-[#D7FF45]/40 hover:text-[#D7FF45]">Duplicate</button><button onClick={() => selectedLayerId && moveLayer(selectedLayerId, -1)} className="rounded-md border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-[#8067FF]/50 hover:text-white">Layer ↑</button><button onClick={() => selectedLayerId && moveLayer(selectedLayerId, 1)} className="rounded-md border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-[#8067FF]/50 hover:text-white">Layer ↓</button></div>
                    </div>
                  </div>

                  {selectedText && <div><label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Content</label><textarea value={selectedText.content} onChange={(event) => setHeadline(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-xs outline-none focus:border-[#D7FF45]/70" /></div>}

                  {selectedText && <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Motion controls</p><div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <div><div className="mb-1.5 flex justify-between text-[10px] text-white/55"><span>Duration</span><span>{selectedText.motionSettings.duration.toFixed(2)}s</span></div><input type="range" min="0.2" max="1.5" step="0.05" value={selectedText.motionSettings.duration} onChange={(event) => setMotionDuration(Number(event.target.value))} className="w-full accent-[#D7FF45]" /></div>
                    <div><div className="mb-1.5 flex justify-between text-[10px] text-white/55"><span>Stagger</span><span>{selectedText.motionSettings.stagger.toFixed(2)}s</span></div><input type="range" min="0" max="0.25" step="0.01" value={selectedText.motionSettings.stagger} onChange={(event) => setMotionStagger(Number(event.target.value))} className="w-full accent-[#D7FF45]" /></div>
                    <div><div className="mb-1.5 text-[10px] text-white/55">Split by</div><div className="grid grid-cols-2 gap-1.5">{(["words", "characters"] as const).map((value) => <button key={value} onClick={() => setSplitBy(value)} className={`rounded-md border px-2 py-1.5 text-[10px] capitalize ${selectedText.motionSettings.splitBy === value ? "border-[#D7FF45] bg-[#D7FF45]/10 text-[#D7FF45]" : "border-white/10 text-white/55"}`}>{value}</button>)}</div></div>
                  </div></div>}

                  {selectedComponent.type === "video" && <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Speed</p><div className="rounded-lg border border-white/10 bg-white/[0.025] p-3"><div className="mb-2 flex justify-between text-[10px] text-white/55"><span>Playback rate</span><span>{(selectedComponent.playbackRate ?? 1).toFixed(2)}×</span></div><input type="range" min="0.25" max="4" step="0.25" value={selectedComponent.playbackRate ?? 1} onPointerDown={checkpoint} onChange={(event) => updateComponent((component) => component.type === "video" ? { ...component, playbackRate: Number(event.target.value) } : component)} className="w-full accent-[#8067FF]" /></div></div>}

                  <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Transitions</p><div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    {(["transitionIn", "transitionOut"] as const).map((side) => {
                      const value = selectedComponent[side] ?? { type: "none" as const, duration: 0.35 };
                      return <div key={side}><div className="mb-1.5 text-[10px] text-white/45">{side === "transitionIn" ? "In" : "Out"}</div><div className="grid grid-cols-[1fr_72px] gap-2"><select value={value.type} onChange={(event) => { checkpoint(); updateComponent((component) => ({ ...component, [side]: { ...value, type: event.target.value as TransitionType } }) as VisualComponent); }} className="rounded-md border border-white/10 bg-[#15151B] px-2 py-1.5 text-[10px] outline-none focus:border-[#8067FF]/60">{transitions.map((transition) => <option key={transition} value={transition}>{transition}</option>)}</select><input type="number" min="0" max="2" step="0.1" value={value.duration} onChange={(event) => updateComponent((component) => ({ ...component, [side]: { ...value, duration: Number(event.target.value) } }) as VisualComponent)} className="rounded-md border border-white/10 bg-[#15151B] px-2 py-1.5 text-[10px] outline-none" /></div></div>;
                    })}
                  </div></div>

                  <div><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Keyframes</p><button onClick={addKeyframe} className="rounded-md border border-[#8067FF]/35 bg-[#8067FF]/10 px-2 py-1 text-[9px] text-[#C7BEFF] hover:border-[#D7FF45]/50 hover:text-[#D7FF45]">◆ Add at playhead</button></div><div className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-[10px] text-white/40">{selectedComponent.keyframes?.length ? `${selectedComponent.keyframes.length} transform keyframe${selectedComponent.keyframes.length === 1 ? "" : "s"} on this clip.` : "No keyframes yet. Add one, move the playhead, then add another to build transform animation."}</div></div>
                </>
              ) : <div className="text-xs text-white/35">Nothing selected yet. Drop media or add a component from the timeline.</div>}

              <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Background</p><div className="grid grid-cols-2 gap-1.5">{backgroundPresets.map((preset) => <button key={preset.id} onClick={() => setBackgroundPreset(preset.id)} className={`rounded-lg border p-1.5 text-left ${timeline.backgroundPresetId === preset.id ? "border-[#D7FF45]" : "border-white/10"}`}><div className={`mb-1.5 h-10 rounded-md ${preset.className}`} /><span className="text-[10px] text-white/70">{preset.name}</span></button>)}</div></div>
            </div>
          </aside>
        </section>
        <TimelineEditor />
      </div>
    </main>
  );
}
