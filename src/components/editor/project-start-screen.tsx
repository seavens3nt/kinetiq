"use client";

import { useState } from "react";

const formats = [
  { id: "16:9", width: 1920, height: 1080, title: "Landscape", platforms: "YouTube · Product demo" },
  { id: "9:16", width: 1080, height: 1920, title: "Vertical", platforms: "TikTok · Reels · Shorts" },
  { id: "1:1", width: 1080, height: 1080, title: "Square", platforms: "Instagram · LinkedIn" },
] as const;

type ProjectStartScreenProps = {
  onStart: (width: number, height: number) => void;
};

type Step = "home" | "new-video" | "blank-canvas";

const navItems = [
  { label: "Home", icon: "⌂", muted: false },
  { label: "Projects", icon: "▣", muted: false },
  { label: "Templates", icon: "◇", muted: true },
] as const;

export function ProjectStartScreen({ onStart }: ProjectStartScreenProps) {
  const [step, setStep] = useState<Step>("home");

  const back = () => setStep(step === "blank-canvas" ? "new-video" : "home");

  const shell = (content: React.ReactNode) => (
    <main className="min-h-screen bg-[#09090c] text-[#f5f5f2]">
      <header className="flex h-14 items-center border-b border-white/[0.07] bg-[#0e0e13] px-4 pr-[440px] lg:px-5 lg:pr-[440px]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D7FF45] text-sm font-black text-[#0B0B0F] shadow-[0_0_24px_rgba(215,255,69,0.08)]">K</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-[-0.02em]">Kinetiq</div>
            <div className="truncate text-[10px] text-white/30">Motion Studio</div>
          </div>
          <div className="ml-3 hidden h-5 w-px bg-white/[0.07] sm:block" />
          <div className="hidden text-[11px] text-white/35 sm:block">{step === "home" ? "Home" : step === "new-video" ? "New project" : "Blank canvas"}</div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-[190px_1fr] xl:grid-cols-[210px_1fr]">
        <aside className="border-r border-white/[0.07] bg-[#0b0b0f] p-3">
          <button
            type="button"
            onClick={() => setStep("new-video")}
            className="mb-4 flex w-full items-center justify-between rounded-xl bg-[#D7FF45] px-3 py-2.5 text-left text-[12px] font-bold text-[#0B0B0F] transition hover:brightness-105"
          >
            <span>New project</span>
            <span className="text-base leading-none">＋</span>
          </button>

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.label === "Home" && setStep("home")}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[11px] transition ${item.label === "Home" && step === "home" ? "bg-white/[0.065] text-white" : item.muted ? "cursor-default text-white/20" : "text-white/45 hover:bg-white/[0.035] hover:text-white/75"}`}
              >
                <span className="w-4 text-center text-xs">{item.icon}</span>
                <span>{item.label}</span>
                {item.muted && <span className="ml-auto rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white/20">soon</span>}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-white/[0.06] pt-4">
            <div className="px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">Workspace</div>
            <div className="mt-2 rounded-lg border border-[#8067FF]/15 bg-[#8067FF]/[0.04] px-3 py-2.5">
              <div className="text-[10px] font-medium text-white/55">Kinetiq Cloud</div>
              <div className="mt-1 text-[9px] leading-4 text-white/25">Projects autosave when you are signed in.</div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-y-auto bg-[radial-gradient(circle_at_70%_0%,rgba(128,103,255,0.055),transparent_28%)]">
          {content}
        </section>
      </div>
    </main>
  );

  if (step === "home") {
    return shell(
      <div className="mx-auto w-full max-w-[1180px] px-7 py-8 lg:px-10 lg:py-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Create something that moves.</h1>
            <p className="mt-2 max-w-xl text-[12px] leading-5 text-white/35">Start from a clean canvas, then build with layers, motion presets, media, and a continuous timeline.</p>
          </div>
          <div className="hidden rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/30 lg:block">Autosave enabled</div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-white/70">Start creating</h2>
            <span className="text-[9px] uppercase tracking-[0.16em] text-white/20">Blank project</span>
          </div>

          <button
            type="button"
            onClick={() => setStep("new-video")}
            className="group grid w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111116] text-left transition hover:border-[#D7FF45]/35 hover:bg-[#121218] md:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="flex min-h-44 flex-col justify-between p-6 lg:p-7">
              <div>
                <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-[#D7FF45] text-lg font-black text-[#0B0B0F]">＋</div>
                <div className="text-xl font-semibold tracking-[-0.025em]">New motion project</div>
                <div className="mt-2 max-w-md text-[11px] leading-5 text-white/35">Choose a canvas format and open the full editor with a blank timeline.</div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-[10px] font-medium text-[#D7FF45]">Create project <span className="transition-transform group-hover:translate-x-1">→</span></div>
            </div>

            <div className="relative min-h-44 overflow-hidden border-t border-white/[0.07] bg-[#0d0d12] md:border-l md:border-t-0">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:28px_28px]" />
              <div className="absolute left-[14%] top-[18%] h-[64%] w-[72%] rounded-xl border border-white/[0.09] bg-[#15151b] shadow-2xl transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex h-7 items-center gap-1 border-b border-white/[0.06] px-2.5"><span className="h-1.5 w-1.5 rounded-full bg-white/15" /><span className="h-1.5 w-1.5 rounded-full bg-white/10" /></div>
                <div className="grid h-[calc(100%-1.75rem)] grid-cols-[28%_1fr]">
                  <div className="border-r border-white/[0.06] p-2"><div className="h-2 w-3/4 rounded bg-white/[0.06]" /><div className="mt-2 h-8 rounded bg-[#8067FF]/10" /></div>
                  <div className="grid place-items-center"><div className="h-[54%] w-[62%] rounded-md border border-[#D7FF45]/25 bg-[#D7FF45]/[0.035]" /></div>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between"><h3 className="text-[11px] font-semibold text-white/65">Quick formats</h3><span className="text-[9px] text-white/20">Canvas</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {formats.map((format) => (
                <button key={format.id} onClick={() => onStart(format.width, format.height)} className="rounded-xl border border-white/[0.07] bg-[#101015] p-3 text-left transition hover:border-[#8067FF]/40 hover:bg-[#8067FF]/[0.045]">
                  <div className="text-[12px] font-semibold">{format.id}</div>
                  <div className="mt-1 text-[9px] text-white/25">{format.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between"><h3 className="text-[11px] font-semibold text-white/65">Built for motion</h3><span className="text-[9px] text-[#8067FF]">Kinetiq</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-white/35">
              <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">Preset-driven animation</div>
              <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">Continuous timeline</div>
              <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">Smart canvas guides</div>
              <div className="rounded-lg bg-white/[0.025] px-3 py-2.5">Cloud project saves</div>
            </div>
          </div>
        </div>
      </div>,
    );
  }

  if (step === "new-video") {
    return shell(
      <div className="mx-auto w-full max-w-[1120px] px-7 py-8 lg:px-10 lg:py-10">
        <button onClick={back} className="mb-6 text-[10px] text-white/30 transition hover:text-white/70">← Back to home</button>
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D7FF45]/65">New project</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose how you want to start</h1>
          <p className="mt-2 text-[11px] leading-5 text-white/35">Kinetiq keeps the setup minimal so you can get straight into the canvas and timeline.</p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setStep("blank-canvas")}
            className="group rounded-2xl border border-[#D7FF45]/20 bg-[#D7FF45]/[0.035] p-5 text-left transition hover:border-[#D7FF45]/50 hover:bg-[#D7FF45]/[0.055]"
          >
            <div className="relative mb-5 h-44 overflow-hidden rounded-xl border border-white/[0.07] bg-[#101015]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:26px_26px]" />
              <div className="absolute left-1/2 top-1/2 h-[62%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-dashed border-[#D7FF45]/35 bg-[#D7FF45]/[0.025] transition group-hover:border-[#D7FF45]/60" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-base font-semibold">Blank canvas</div><div className="mt-1 text-[10px] leading-5 text-white/35">Start clean with an empty timeline and choose your format next.</div></div>
              <span className="text-[#D7FF45]">→</span>
            </div>
          </button>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 opacity-55">
            <div className="mb-5 grid h-44 place-items-center rounded-xl border border-white/[0.05] bg-[#0e0e12]">
              <div className="text-center"><div className="text-xl text-[#8067FF]/60">◇</div><div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/20">Coming soon</div></div>
            </div>
            <div className="text-base font-semibold text-white/45">Templates</div>
            <div className="mt-1 text-[10px] leading-5 text-white/25">Reusable product demo and launch-video starting points.</div>
          </div>
        </div>
      </div>,
    );
  }

  return shell(
    <div className="mx-auto w-full max-w-[1120px] px-7 py-8 lg:px-10 lg:py-10">
      <button onClick={back} className="mb-6 text-[10px] text-white/30 transition hover:text-white/70">← Back</button>
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D7FF45]/65">Blank canvas</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose a canvas format</h1>
        <p className="mt-2 text-[11px] leading-5 text-white/35">You can resize later. Pick the format closest to where the final motion piece will be published.</p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {formats.map((format) => {
          const landscape = format.width > format.height;
          const square = format.width === format.height;
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onStart(format.width, format.height)}
              className="group rounded-2xl border border-white/[0.07] bg-[#111116] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D7FF45]/45 hover:bg-[#121218]"
            >
              <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0d0d12]">
                <div className={`border border-white/[0.13] bg-white/[0.025] shadow-xl transition group-hover:border-[#D7FF45]/45 ${square ? "h-24 w-24 rounded-lg" : landscape ? "h-[76px] w-[136px] rounded-lg" : "h-[132px] w-[74px] rounded-lg"}`} />
              </div>
              <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold">{format.title}</div><div className="mt-0.5 text-[10px] text-white/30">{format.id}</div></div><div className="rounded-md border border-white/[0.06] px-2 py-1 text-[9px] tabular-nums text-white/25">{format.width}×{format.height}</div></div>
              <div className="mt-3 text-[9px] leading-4 text-white/25">{format.platforms}</div>
            </button>
          );
        })}
      </div>
    </div>,
  );
}
