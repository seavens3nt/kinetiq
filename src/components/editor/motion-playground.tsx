"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedText } from "@/components/editor/animated-text";
import { TimelineEditor } from "@/components/editor/timeline-editor";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import type { MotionPresetId } from "@/lib/project-schema";
import { useEditorStore } from "@/store/editor-store";

export function MotionPlayground() {
  const [previewPresetId, setPreviewPresetId] = useState<MotionPresetId | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const {
    project,
    replayKey,
    currentTime,
    isPlaying,
    activeSceneIndex,
    selectedElementId,
    setHeadline,
    setMotionPreset,
    setMotionDuration,
    setMotionStagger,
    setSplitBy,
    setBackgroundPreset,
    setCurrentTime,
    setPlaying,
    togglePlayback,
    setActiveScene,
    addScene,
    duplicateScene,
    deleteScene,
    addTextElement,
    deleteSelectedElement,
    setSelectedElement,
    replay,
  } = useEditorStore();

  const scene = project.scenes[activeSceneIndex];
  const selectedElement =
    scene.elements.find((element) => element.id === selectedElementId) ?? scene.elements[0];
  const background = backgroundPresets.find((item) => item.id === scene.backgroundPresetId)!;

  useEffect(() => {
    if (!isPlaying) return;

    let previous = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const deltaSeconds = (now - previous) / 1000;
      previous = now;
      const state = useEditorStore.getState();
      const activeScene = state.project.scenes[state.activeSceneIndex];
      const nextTime = state.currentTime + deltaSeconds;

      if (nextTime >= activeScene.durationInSeconds) {
        state.setCurrentTime(activeScene.durationInSeconds);
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
      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback]);

  const visibleElements = useMemo(
    () =>
      scene.elements.filter(
        (element) => currentTime >= element.startTime && currentTime <= element.startTime + element.duration,
      ),
    [scene.elements, currentTime],
  );

  const activePresetId = previewPresetId ?? selectedElement.motionPresetId;
  const activeReplayKey = replayKey + previewKey;

  return (
    <main className="min-h-screen bg-[#111216] text-white">
      <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d7ff45] font-black text-black">K</div>
          <div>
            <div className="font-semibold tracking-tight">Kinetiq</div>
            <div className="text-xs text-white/40">Motion Studio</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs tabular-nums text-white/55 sm:block">
            {currentTime.toFixed(2)}s / {scene.durationInSeconds.toFixed(2)}s
          </div>
          <button
            onClick={togglePlayback}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold transition hover:bg-white/[0.08]"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={replay}
            className="rounded-full bg-[#d7ff45] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Replay
          </button>
        </div>
      </header>

      <div className="border-b border-white/10 bg-[#0f1014] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {project.scenes.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveScene(index)}
              className={`min-w-[132px] rounded-xl border px-3 py-2 text-left transition ${
                activeSceneIndex === index
                  ? "border-[#d7ff45] bg-[#d7ff45]/10"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
            >
              <div className="text-xs font-semibold">{item.name}</div>
              <div className="mt-1 text-[11px] text-white/35">
                {item.durationInSeconds.toFixed(1)}s · {item.elements.length} layer{item.elements.length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
          <button
            onClick={addScene}
            className="min-w-[110px] rounded-xl border border-dashed border-white/15 px-3 py-2 text-left text-xs text-white/50 transition hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
          >
            + Add scene
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={duplicateScene} className="text-xs text-white/45 hover:text-white">Duplicate scene</button>
          <span className="text-white/15">·</span>
          <button
            onClick={deleteScene}
            disabled={project.scenes.length === 1}
            className="text-xs text-white/45 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-25"
          >
            Delete scene
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-8.75rem)] flex-col">
        <section className="grid min-h-0 flex-1 lg:grid-cols-[290px_1fr_320px]">
          <aside className="overflow-y-auto border-r border-white/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Layers</p>
                <p className="mt-1 text-xs text-white/30">Select a text layer to edit it.</p>
              </div>
              <button
                onClick={addTextElement}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/65 hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
              >
                + Text
              </button>
            </div>

            <div className="mb-6 space-y-2">
              {scene.elements.map((element) => (
                <button
                  key={element.id}
                  onClick={() => setSelectedElement(element.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedElementId === element.id
                      ? "border-[#d7ff45] bg-[#d7ff45]/10"
                      : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="truncate text-sm font-semibold">{element.content}</div>
                  <div className="mt-1 text-xs text-white/35">
                    {element.startTime.toFixed(2)}s → {(element.startTime + element.duration).toFixed(2)}s
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Text animations</p>
              <p className="mt-1 text-xs text-white/30">Hover to preview · click to apply</p>
            </div>

            <div className="space-y-2">
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
                  className={`group w-full rounded-xl border p-3 text-left transition ${
                    selectedElement.motionPresetId === preset.id
                      ? "border-[#d7ff45] bg-[#d7ff45]/10"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{preset.name}</div>
                    {preset.engine === "react-bits-adapter" && (
                      <span className="rounded-full bg-[#8067ff]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a999ff]">
                        React Bits
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-white/45">{preset.description}</div>
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-4">
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

          <div className="flex min-h-[420px] items-center justify-center overflow-hidden bg-[#17181d] p-6 lg:p-10">
            <div
              className={`relative aspect-[9/16] h-[58vh] max-h-[680px] min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl ${background.className}`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
              <div className="relative h-full w-full text-[#f7f7f4]">
                {visibleElements.length === 0 && (
                  <div className="absolute inset-0 grid place-items-center px-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/20">
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
                        isSelected ? "ring-2 ring-[#d7ff45]/70" : ""
                      }`}
                      style={{ transform: `translate(-50%, calc(-50% + ${index * 110 - (visibleElements.length - 1) * 55}px))` }}
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

          <aside className="overflow-y-auto border-l border-white/10 p-5">
            <div className="space-y-7">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Selected text</div>
                  <div className="text-xs text-white/35">{selectedElement.content}</div>
                </div>
                <button
                  onClick={deleteSelectedElement}
                  disabled={scene.elements.length === 1}
                  className="text-xs text-white/35 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                >
                  Delete
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Content</label>
                <textarea
                  value={selectedElement.content}
                  onChange={(event) => setHeadline(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm outline-none transition focus:border-[#d7ff45]/70"
                />
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Motion controls</p>
                <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div>
                    <div className="mb-2 flex justify-between text-xs text-white/55">
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
                      className="w-full accent-[#d7ff45]"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs text-white/55">
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
                      className="w-full accent-[#d7ff45]"
                    />
                  </div>

                  <div>
                    <div className="mb-2 text-xs text-white/55">Split by</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["words", "characters"] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setSplitBy(value)}
                          className={`rounded-lg border px-3 py-2 text-xs capitalize transition ${
                            selectedElement.motionSettings.splitBy === value
                              ? "border-[#d7ff45] bg-[#d7ff45]/10 text-[#d7ff45]"
                              : "border-white/10 text-white/55 hover:bg-white/[0.04]"
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Background</p>
                <div className="grid grid-cols-2 gap-2">
                  {backgroundPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setBackgroundPreset(preset.id)}
                      className={`rounded-xl border p-2 text-left ${
                        scene.backgroundPresetId === preset.id ? "border-[#d7ff45]" : "border-white/10"
                      }`}
                    >
                      <div className={`mb-2 h-14 rounded-lg ${preset.className}`} />
                      <span className="text-xs text-white/70">{preset.name}</span>
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
