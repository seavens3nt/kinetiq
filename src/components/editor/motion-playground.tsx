"use client";

import { AnimatedText } from "@/components/editor/animated-text";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import { useEditorStore } from "@/store/editor-store";

export function MotionPlayground() {
  const {
    project,
    replayKey,
    setHeadline,
    setMotionPreset,
    setBackgroundPreset,
    replay,
  } = useEditorStore();

  const scene = project.scenes[0];
  const headline = scene.elements[0];
  const background = backgroundPresets.find((item) => item.id === scene.backgroundPresetId)!;

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
        <button
          onClick={replay}
          className="rounded-full bg-[#d7ff45] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
        >
          Replay
        </button>
      </header>

      <section className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[270px_1fr_300px]">
        <aside className="border-r border-white/10 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Text animations</p>
          <div className="space-y-2">
            {motionPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setMotionPreset(preset.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  headline.motionPresetId === preset.id
                    ? "border-[#d7ff45] bg-[#d7ff45]/10"
                    : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                }`}
              >
                <div className="text-sm font-semibold">{preset.name}</div>
                <div className="mt-1 text-xs leading-5 text-white/45">{preset.description}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex items-center justify-center overflow-hidden bg-[#17181d] p-6 lg:p-10">
          <div
            className={`relative aspect-[9/16] h-[72vh] max-h-[780px] min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl ${background.className}`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
            <div className="relative flex h-full items-center justify-center px-12 text-[#f7f7f4]">
              <AnimatedText text={headline.content} presetId={headline.motionPresetId} replayKey={replayKey} />
            </div>
          </div>
        </div>

        <aside className="border-l border-white/10 p-5">
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

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-white/50">
              <strong className="text-white/80">Architecture note:</strong> saved projects only store Kinetiq preset IDs. The underlying implementation can later be replaced by the exact React Bits adapter without changing project files.
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
