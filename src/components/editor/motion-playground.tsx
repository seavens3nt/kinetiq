"use client";

import { useState } from "react";
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
    selectedElementId,
    setHeadline,
    setMotionPreset,
    setMotionDuration,
    setMotionStagger,
    setSplitBy,
    setBackgroundPreset,
    setSelectedElement,
    replay,
  } = useEditorStore();

  const scene = project.scenes[0];
  const headline = scene.elements[0];
  const background = backgroundPresets.find((item) => item.id === scene.backgroundPresetId)!;
  const activePresetId = previewPresetId ?? headline.motionPresetId;
  const activeReplayKey = replayKey + previewKey;
  const headlineVisible =
    currentTime >= headline.startTime && currentTime <= headline.startTime + headline.duration;

  return (
    <main className="min-h-screen bg-[#111216] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d7ff45] font-black text-black">K</div>
          <div>
            <div className="font-semibold tracking-tight">Kinetiq</div>
            <div className="text-xs text-white/40">Motion Playground</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
            {currentTime.toFixed(2)}s / {scene.durationInSeconds.toFixed(2)}s
          </div>
          <button
            onClick={replay}
            className="rounded-full bg-[#d7ff45] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Replay
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <section className="grid min-h-0 flex-1 lg:grid-cols-[290px_1fr_320px]">
          <aside className="overflow-y-auto border-r border-white/10 p-4">
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
                    headline.motionPresetId === preset.id
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
                      motionSettings={{ ...headline.motionSettings, splitBy: "characters" }}
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
              <button
                type="button"
                onClick={() => setSelectedElement(headline.id)}
                className={`relative flex h-full w-full items-center justify-center px-12 text-[#f7f7f4] outline-none ${
                  selectedElementId === headline.id ? "ring-2 ring-inset ring-[#d7ff45]/70" : ""
                }`}
              >
                {headlineVisible ? (
                  <AnimatedText
                    text={headline.content}
                    presetId={activePresetId}
                    motionSettings={headline.motionSettings}
                    replayKey={activeReplayKey}
                  />
                ) : (
                  <div className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/20">
                    Scrub into the text clip to preview it
                  </div>
                )}
              </button>
            </div>
          </div>

          <aside className="overflow-y-auto border-l border-white/10 p-5">
            <div className="space-y-7">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Content</label>
                <textarea
                  value={headline.content}
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
                      <span>{headline.motionSettings.duration.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.5"
                      step="0.05"
                      value={headline.motionSettings.duration}
                      onChange={(event) => setMotionDuration(Number(event.target.value))}
                      className="w-full accent-[#d7ff45]"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs text-white/55">
                      <span>Stagger</span>
                      <span>{headline.motionSettings.stagger.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.25"
                      step="0.01"
                      value={headline.motionSettings.stagger}
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
                            headline.motionSettings.splitBy === value
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
