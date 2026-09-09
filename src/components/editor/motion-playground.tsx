"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedText } from "@/components/editor/animated-text";
import { ProjectStartScreen } from "@/components/editor/project-start-screen";
import { TimelineEditor } from "@/components/editor/timeline-editor";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import type { MotionPresetId } from "@/lib/project-schema";
import { useEditorStore } from "@/store/editor-store";

export function MotionPlayground() {
  const [previewPresetId, setPreviewPresetId] = useState<MotionPresetId | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const {
    project,
    replayKey,
    currentTime,
    isPlaying,
    selectedElementId,
    setCanvasSize,
    setHeadline,
    setMotionPreset,
    setMotionDuration,
    setMotionStagger,
    setSplitBy,
    setBackgroundPreset,
    setCurrentTime,
    setPlaying,
    togglePlayback,
    deleteSelectedElement,
    setSelectedElement,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const selectedElement =
    timeline.elements.find((element) => element.id === selectedElementId) ?? timeline.elements[0];
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

  const visibleElements = useMemo(
    () =>
      timeline.elements.filter(
        (element) => currentTime >= element.startTime && currentTime <= element.startTime + element.duration,
      ),
    [timeline.elements, currentTime],
  );

  const activePresetId = previewPresetId ?? selectedElement.motionPresetId;
  const activeReplayKey = replayKey + previewKey;
  const isLandscape = project.width > project.height;

  if (!hasStarted) {
    return (
      <ProjectStartScreen
        onStart={(width, height) => {
          setCanvasSize(width, height);
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
          <div>
            <div className="text-sm font-semibold tracking-tight">Kinetiq</div>
            <div className="text-[10px] text-white/40">Motion Studio</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHasStarted(false)}
            className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/45 transition hover:border-[#8067FF]/40 hover:text-white"
          >
            {project.width} × {project.height}
          </button>
          <div className="rounded-full border border-[#8067FF]/25 bg-[#8067FF]/10 px-3 py-1.5 text-[11px] text-[#C7BEFF]">
            Master timeline · {timeline.elements.length} layer{timeline.elements.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[240px_1fr_300px]">
          <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Text animations</p>
              <p className="mt-1 text-[10px] text-white/30">Hover to preview · click to apply</p>
            </div>

            <div className="space-y-1.5">
              {motionPresets.map((preset) => (
                <button
                  key={preset.id}
                  onMouseEnter={() => {
                    setPreviewPresetId(preset.id);
                    setPreviewKey((value) => value + 1);
                  }}
                  onMouseLeave={() => setPreviewPresetId(null)}
                  onFocus={() => {
                    setPreviewPresetId(preset.id);
                    setPreviewKey((value) => value + 1);
                  }}
                  onBlur={() => setPreviewPresetId(null)}
                  onClick={() => setMotionPreset(preset.id)}
                  className={`group w-full rounded-lg border p-2.5 text-left transition ${
                    selectedElement.motionPresetId === preset.id
                      ? "border-[#D7FF45] bg-[#D7FF45]/10"
                      : "border-white/10 bg-white/[0.025] hover:border-[#8067FF]/40 hover:bg-[#8067FF]/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold">{preset.name}</div>
                    {preset.engine === "react-bits-adapter" && (
                      <span className="rounded-full bg-[#8067FF]/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#A999FF]">
                        React Bits
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] leading-4 text-white/45">{preset.description}</div>
                  <div className="mt-2 overflow-hidden rounded-md border border-white/10 bg-black/25 px-2 py-2.5">
                    <AnimatedText
                      text="MOVE"
                      presetId={preset.id}
                      motionSettings={{ ...selectedElement.motionSettings, splitBy: "characters" }}
                      replayKey={previewPresetId === preset.id ? previewKey : 0}
                      compact
                    />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 items-center justify-center overflow-hidden bg-[#17181d] p-3 lg:p-5">
            <div
              className={`relative min-h-0 overflow-hidden rounded-[22px] border border-white/10 shadow-2xl ${background.className} ${
                isLandscape ? "w-[min(100%,900px)] max-h-full" : "h-full max-w-full"
              }`}
              style={{ aspectRatio: `${project.width} / ${project.height}` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
              <div className="relative h-full w-full text-[#F7F7F4]">
                {visibleElements.length === 0 && (
                  <div className="absolute inset-0 grid place-items-center px-8 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
                    Scrub into a clip or press Play
                  </div>
                )}

                {visibleElements.map((element, index) => {
                  const isSelected = selectedElementId === element.id;
                  const localReplayKey = activeReplayKey + Math.round(element.startTime * 100) + index;

                  return (
                    <button
                      key={element.id}
                      type="button"
                      onClick={() => setSelectedElement(element.id)}
                      className={`absolute left-1/2 top-1/2 flex w-[82%] -translate-x-1/2 items-center justify-center rounded-2xl px-4 py-2 outline-none ${
                        isSelected ? "ring-2 ring-[#D7FF45]/70" : ""
                      }`}
                      style={{
                        transform: `translate(-50%, calc(-50% + ${index * 90 - (visibleElements.length - 1) * 45}px))`,
                      }}
                    >
                      <AnimatedText
                        text={element.content}
                        presetId={isSelected ? activePresetId : element.motionPresetId}
                        motionSettings={element.motionSettings}
                        replayKey={localReplayKey}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold">Selected layer</div>
                  <div className="truncate text-[10px] text-white/35">{selectedElement.content}</div>
                </div>
                <button
                  onClick={deleteSelectedElement}
                  disabled={timeline.elements.length === 1}
                  className="shrink-0 text-[10px] text-white/35 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                >
                  Delete
                </button>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Content</label>
                <textarea
                  value={selectedElement.content}
                  onChange={(event) => setHeadline(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-xs outline-none transition focus:border-[#D7FF45]/70"
                />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Motion controls</p>
                <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-[10px] text-white/55">
                      <span>Duration</span>
                      <span>{selectedElement.motionSettings.duration.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.5"
                      step="0.05"
                      value={selectedElement.motionSettings.duration}
                      onChange={(event) => setMotionDuration(Number(event.target.value))}
                      className="w-full accent-[#D7FF45]"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex justify-between text-[10px] text-white/55">
                      <span>Stagger</span>
                      <span>{selectedElement.motionSettings.stagger.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.25"
                      step="0.01"
                      value={selectedElement.motionSettings.stagger}
                      onChange={(event) => setMotionStagger(Number(event.target.value))}
                      className="w-full accent-[#D7FF45]"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-[10px] text-white/55">Split by</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["words", "characters"] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setSplitBy(value)}
                          className={`rounded-md border px-2 py-1.5 text-[10px] capitalize transition ${
                            selectedElement.motionSettings.splitBy === value
                              ? "border-[#D7FF45] bg-[#D7FF45]/10 text-[#D7FF45]"
                              : "border-white/10 text-white/55 hover:border-[#8067FF]/40 hover:bg-[#8067FF]/10"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Background</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {backgroundPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setBackgroundPreset(preset.id)}
                      className={`rounded-lg border p-1.5 text-left ${
                        timeline.backgroundPresetId === preset.id ? "border-[#D7FF45]" : "border-white/10"
                      }`}
                    >
                      <div className={`mb-1.5 h-10 rounded-md ${preset.className}`} />
                      <span className="text-[10px] text-white/70">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <TimelineEditor />
      </div>
    </main>
  );
}
