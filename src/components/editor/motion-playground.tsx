"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedText } from "@/components/editor/animated-text";
import { ProjectStartScreen } from "@/components/editor/project-start-screen";
import { TimelineEditor } from "@/components/editor/timeline-editor";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import type { MotionPresetId, VisualComponent } from "@/lib/project-schema";
import { useEditorStore } from "@/store/editor-store";

function componentLabel(component: VisualComponent) {
  if (component.type === "text") return component.content;
  if (component.type === "ui") return component.label;
  return component.name;
}

export function MotionPlayground() {
  const [previewPresetId, setPreviewPresetId] = useState<MotionPresetId | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const {
    project,
    replayKey,
    currentTime,
    isPlaying,
    selectedComponentId,
    selectedMusicTrackId,
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
    setSelectedComponent,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const allComponents = useMemo(() => timeline.layers.flatMap((layer) => layer.components), [timeline.layers]);
  const selectedComponent = allComponents.find((component) => component.id === selectedComponentId) ?? null;
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
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
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

  const activeReplayKey = replayKey + previewKey;
  const isLandscape = project.width > project.height;

  if (!hasStarted) {
    return (
      <ProjectStartScreen
        onStart={(width, height) => {
          startBlankProject(width, height);
          setHasStarted(true);
        }}
      />
    );
  }

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0B0B0F] text-[#F7F7F4]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#101015] px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#D7FF45] font-black text-[#0B0B0F]">K</div>
          <div><div className="text-sm font-semibold tracking-tight">Kinetiq</div><div className="text-[10px] text-white/40">Motion Studio</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setHasStarted(false)} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/45 hover:border-[#8067FF]/40 hover:text-white">
            {project.width} × {project.height}
          </button>
          <div className="rounded-full border border-[#8067FF]/25 bg-[#8067FF]/10 px-3 py-1.5 text-[11px] text-[#C7BEFF]">
            {timeline.layers.length} layers · {allComponents.length} components{timeline.musicTracks.length ? ` · ${timeline.musicTracks.length} music` : ""}
          </div>
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
                <button
                  key={preset.id}
                  onMouseEnter={() => { if (selectedText) { setPreviewPresetId(preset.id); setPreviewKey((value) => value + 1); } }}
                  onMouseLeave={() => setPreviewPresetId(null)}
                  onClick={() => selectedText && setMotionPreset(preset.id)}
                  className={`group w-full rounded-lg border p-2.5 text-left transition ${selectedText?.motionPresetId === preset.id ? "border-[#D7FF45] bg-[#D7FF45]/10" : "border-white/10 bg-white/[0.025] hover:border-[#8067FF]/40 hover:bg-[#8067FF]/10"}`}
                >
                  <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold">{preset.name}</div>{preset.engine === "react-bits-adapter" && <span className="rounded-full bg-[#8067FF]/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#A999FF]">React Bits</span>}</div>
                  <div className="mt-1 text-[10px] leading-4 text-white/45">{preset.description}</div>
                  {selectedText && <div className="mt-2 overflow-hidden rounded-md border border-white/10 bg-black/25 px-2 py-2.5"><AnimatedText text="MOVE" presetId={preset.id} motionSettings={{ ...selectedText.motionSettings, splitBy: "characters" }} replayKey={previewPresetId === preset.id ? previewKey : 0} compact /></div>}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 items-center justify-center overflow-hidden bg-[#17181d] p-3 lg:p-5">
            <div className={`relative min-h-0 overflow-hidden rounded-[22px] border border-white/10 shadow-2xl ${background.className} ${isLandscape ? "w-[min(100%,900px)] max-h-full" : "h-full max-w-full"}`} style={{ aspectRatio: `${project.width} / ${project.height}` }}>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
              {allComponents.length === 0 && (
                <div className="absolute inset-0 grid place-items-center px-8 text-center">
                  <div>
                    <div className="text-sm font-semibold text-white/40">Blank canvas</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/20">Use + Add below to create your first layer or component</div>
                  </div>
                </div>
              )}
              {allComponents.length > 0 && visibleComponents.length === 0 && <div className="absolute inset-0 grid place-items-center px-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">Scrub into a component or press Play</div>}
              {visibleComponents.map(({ component, layerId }, index) => {
                const isSelected = selectedComponentId === component.id;
                const left = `${(component.x / project.width) * 100}%`;
                const top = `${(component.y / project.height) * 100}%`;
                const width = `${Math.min(95, (component.width / project.width) * 100)}%`;
                const height = `${Math.min(90, (component.height / project.height) * 100)}%`;
                const shared = { left, top, width, height };
                const select = () => setSelectedComponent(component.id, layerId);

                if (component.type === "text") {
                  return (
                    <button key={component.id} onClick={select} className={`absolute flex items-center justify-center rounded-xl px-2 outline-none ${isSelected ? "ring-2 ring-[#D7FF45]/70" : ""}`} style={shared}>
                      <AnimatedText text={component.content} presetId={isSelected && previewPresetId ? previewPresetId : component.motionPresetId} motionSettings={component.motionSettings} replayKey={activeReplayKey + index + Math.round(component.startTime * 100)} />
                    </button>
                  );
                }
                if (component.type === "shape") return <button key={component.id} onClick={select} className={`absolute ${isSelected ? "ring-2 ring-[#D7FF45]/70" : ""}`} style={{ ...shared, background: component.fill, borderRadius: component.shape === "circle" ? "999px" : component.shape === "pill" ? "999px" : component.radius }} />;
                if (component.type === "ui") return <button key={component.id} onClick={select} className={`absolute rounded-2xl border bg-[#111216]/90 p-4 text-left shadow-xl backdrop-blur ${isSelected ? "border-[#D7FF45]" : "border-white/15"}`} style={shared}><div className="text-[9px] uppercase tracking-[0.16em] text-[#D7FF45]">{component.preset}</div><div className="mt-2 text-sm font-semibold">{component.label}</div><div className="mt-2 h-2 w-2/3 rounded-full bg-[#8067FF]/50" /></button>;
                return <button key={component.id} onClick={select} className={`absolute grid place-items-center rounded-2xl border border-dashed bg-black/20 text-center ${isSelected ? "border-[#D7FF45] text-[#D7FF45]" : "border-white/20 text-white/35"}`} style={shared}><div><div className="text-xl">{component.type === "image" ? "▧" : "▶"}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">{component.type}</div><div className="mt-1 text-[9px] opacity-60">Upload coming next</div></div></button>;
              })}
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
            <div className="space-y-5">
              {selectedMusic ? (
                <>
                  <div><div className="text-xs font-semibold text-[#D7FF45]">♫ {selectedMusic.name}</div><div className="mt-1 text-[10px] text-white/35">Music track · {selectedMusic.duration.toFixed(1)}s</div></div>
                  <div className="rounded-xl border border-[#D7FF45]/15 bg-[#D7FF45]/[0.04] p-4 text-[10px] text-white/45">Audio upload, waveform, trimming, volume and loop controls will attach to this dedicated music track.</div>
                </>
              ) : selectedComponent ? (
                <>
                  <div className="flex items-center justify-between gap-4"><div className="min-w-0"><div className="text-xs font-semibold">Selected component</div><div className="truncate text-[10px] text-white/35">{componentLabel(selectedComponent)} · {selectedComponent.type}</div></div><button onClick={deleteSelectedComponent} className="text-[10px] text-white/35 hover:text-red-300">Delete</button></div>
                  {selectedText ? (
                    <>
                      <div><label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Content</label><textarea value={selectedText.content} onChange={(event) => setHeadline(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-xs outline-none focus:border-[#D7FF45]/70" /></div>
                      <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Motion controls</p><div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                        <div><div className="mb-1.5 flex justify-between text-[10px] text-white/55"><span>Duration</span><span>{selectedText.motionSettings.duration.toFixed(2)}s</span></div><input type="range" min="0.2" max="1.5" step="0.05" value={selectedText.motionSettings.duration} onChange={(event) => setMotionDuration(Number(event.target.value))} className="w-full accent-[#D7FF45]" /></div>
                        <div><div className="mb-1.5 flex justify-between text-[10px] text-white/55"><span>Stagger</span><span>{selectedText.motionSettings.stagger.toFixed(2)}s</span></div><input type="range" min="0" max="0.25" step="0.01" value={selectedText.motionSettings.stagger} onChange={(event) => setMotionStagger(Number(event.target.value))} className="w-full accent-[#D7FF45]" /></div>
                        <div><div className="mb-1.5 text-[10px] text-white/55">Split by</div><div className="grid grid-cols-2 gap-1.5">{(["words", "characters"] as const).map((value) => <button key={value} onClick={() => setSplitBy(value)} className={`rounded-md border px-2 py-1.5 text-[10px] capitalize ${selectedText.motionSettings.splitBy === value ? "border-[#D7FF45] bg-[#D7FF45]/10 text-[#D7FF45]" : "border-white/10 text-white/55"}`}>{value}</button>)}</div></div>
                      </div></div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-[#8067FF]/20 bg-[#8067FF]/[0.06] p-4 text-[10px] leading-5 text-white/45">{selectedComponent.type === "image" || selectedComponent.type === "video" ? "This component is ready for media upload and canvas transform controls." : "This component is ready for canvas transform and style controls."}</div>
                  )}
                </>
              ) : <div className="text-xs text-white/35">Nothing selected yet. Add a layer or component from the timeline.</div>}

              <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Background</p><div className="grid grid-cols-2 gap-1.5">{backgroundPresets.map((preset) => <button key={preset.id} onClick={() => setBackgroundPreset(preset.id)} className={`rounded-lg border p-1.5 text-left ${timeline.backgroundPresetId === preset.id ? "border-[#D7FF45]" : "border-white/10"}`}><div className={`mb-1.5 h-10 rounded-md ${preset.className}`} /><span className="text-[10px] text-white/70">{preset.name}</span></button>)}</div></div>
            </div>
          </aside>
        </section>
        <TimelineEditor />
      </div>
    </main>
  );
}
