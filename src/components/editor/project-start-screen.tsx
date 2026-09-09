"use client";

import { useState } from "react";

const formats = [
  { id: "16:9", width: 1920, height: 1080, platforms: "YouTube, Facebook" },
  { id: "9:16", width: 1080, height: 1920, platforms: "TikTok, YouTube, Instagram, Facebook" },
  { id: "1:1", width: 1080, height: 1080, platforms: "Instagram, LinkedIn, Facebook" },
] as const;

type ProjectStartScreenProps = {
  onStart: (width: number, height: number) => void;
};

type Step = "home" | "new-video" | "blank-canvas";

export function ProjectStartScreen({ onStart }: ProjectStartScreenProps) {
  const [step, setStep] = useState<Step>("home");

  const shell = (content: React.ReactNode) => (
    <main className="min-h-screen bg-[#0B0B0F] text-[#F7F7F4]">
      <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#101015] px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#D7FF45] font-black text-[#0B0B0F]">K</div>
          <div>
            <div className="font-semibold tracking-tight">Kinetiq</div>
            <div className="text-xs text-white/40">Motion Studio</div>
          </div>
        </div>
        {step !== "home" && (
          <button
            type="button"
            onClick={() => setStep(step === "blank-canvas" ? "new-video" : "home")}
            className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[11px] text-white/45 transition hover:border-[#8067FF]/40 hover:text-white"
          >
            ← Back
          </button>
        )}
      </header>
      {content}
    </main>
  );

  if (step === "home") {
    return shell(
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-6 py-12 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D7FF45]/75">Home</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Move ideas, not keyframes.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
            Create a new motion video from a blank canvas and build it with layers, components, motion presets, and music.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStep("new-video")}
          className="mt-9 flex w-full max-w-md items-center justify-between rounded-2xl border border-[#D7FF45]/25 bg-[#D7FF45]/[0.06] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D7FF45]/60 hover:bg-[#D7FF45]/10"
        >
          <div>
            <div className="text-lg font-semibold">New Video</div>
            <div className="mt-1 text-sm text-white/45">Start a new Kinetiq project</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#D7FF45] text-xl font-black text-[#0B0B0F]">+</div>
        </button>
      </section>,
    );
  }

  if (step === "new-video") {
    return shell(
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-6 py-12 lg:px-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Video</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Create new video</h1>
        </div>

        <button
          type="button"
          onClick={() => setStep("blank-canvas")}
          className="group w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#8067FF]/50 hover:bg-[#8067FF]/[0.06]"
        >
          <div className="mb-5 grid h-36 place-items-center rounded-xl border border-white/10 bg-[#15151B]">
            <div className="h-20 w-32 rounded-lg border border-dashed border-[#8067FF]/50 bg-[#8067FF]/[0.06] transition group-hover:border-[#D7FF45]/60" />
          </div>
          <div className="text-lg font-semibold">Blank Canvas</div>
          <div className="mt-1 text-sm text-white/45">Choose an aspect ratio and start with an empty timeline.</div>
        </button>
      </section>,
    );
  }

  return shell(
    <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-6 py-10 lg:px-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Video · Blank Canvas</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Choose a format</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Your editor will open completely empty. Add layers, components, and music from the timeline.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {formats.map((format) => {
          const landscape = format.width > format.height;
          const square = format.width === format.height;
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onStart(format.width, format.height)}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D7FF45]/60 hover:bg-[#D7FF45]/[0.045]"
            >
              <div className="mb-5 flex h-36 items-center justify-center rounded-xl border border-white/10 bg-[#15151B]">
                <div className={`border border-white/20 bg-white/[0.04] transition group-hover:border-[#D7FF45]/60 group-hover:bg-[#D7FF45]/5 ${square ? "h-20 w-20 rounded-lg" : landscape ? "h-16 w-28 rounded-lg" : "h-28 w-16 rounded-lg"}`} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">{format.id}</div>
                <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] tabular-nums text-white/35">{format.width}×{format.height}</div>
              </div>
              <div className="mt-1 text-sm leading-5 text-white/45">{format.platforms}</div>
            </button>
          );
        })}
      </div>
    </section>,
  );
}
