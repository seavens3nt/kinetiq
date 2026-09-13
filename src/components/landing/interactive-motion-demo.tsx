"use client";

import { useState } from "react";

const presets = [
  {
    id: "split",
    name: "Split Rise",
    eyebrow: "Kinetic type",
    description: "Characters rise into place with a staggered settle.",
    accent: "#d7ff45",
    transform: "translateY(0) scale(1)",
  },
  {
    id: "push",
    name: "Kinetic Push",
    eyebrow: "Product launch",
    description: "A sharper entrance built for punchy launch headlines.",
    accent: "#a7bd35",
    transform: "translateX(0) scale(1.02)",
  },
  {
    id: "ui",
    name: "UI Pop",
    eyebrow: "Interface motion",
    description: "UI cards arrive with a restrained spring and settle.",
    accent: "#d7ff45",
    transform: "translateY(0) scale(1)",
  },
] as const;

export function InteractiveMotionDemo() {
  const [active, setActive] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const preset = presets[active];

  return (
    <section id="interactive" className="border-y border-white/[0.06] bg-[#09090c]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-28">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7ff45]">Try the motion system</div>
          <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Choose a behavior. See the motion change.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/40">Kinetiq is preset-driven, but presets are starting points rather than locked templates. Pick one below and replay the preview.</p>

          <div className="mt-7 space-y-2">
            {presets.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActive(index); setReplayKey((value) => value + 1); }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${active === index ? "border-[#d7ff45]/35 bg-[#d7ff45]/[0.055]" : "border-white/[0.065] bg-white/[0.015] hover:border-white/[0.13] hover:bg-white/[0.025]"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={`text-[12px] font-semibold ${active === index ? "text-[#d7ff45]" : "text-white/70"}`}>{item.name}</div>
                    <div className="mt-1 text-[10px] text-white/30">{item.description}</div>
                  </div>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${active === index ? "bg-[#d7ff45]" : "bg-white/10"}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#111217] shadow-[0_25px_90px_rgba(0,0,0,0.35)]">
          <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#0c0c10] px-4">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/25">Live preset preview</div>
            <button type="button" onClick={() => setReplayKey((value) => value + 1)} className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[9px] text-white/45 transition hover:border-[#d7ff45]/35 hover:text-[#d7ff45]">Replay ↻</button>
          </div>

          <div className="grid min-h-[430px] place-items-center bg-[radial-gradient(circle_at_72%_28%,rgba(215,255,69,0.08),transparent_27%),linear-gradient(180deg,#15161a,#101115)] p-6 sm:p-10">
            <div className="relative aspect-[9/16] h-[330px] overflow-hidden rounded-[18px] border border-white/[0.10] bg-[#070709] shadow-[0_30px_70px_rgba(0,0,0,0.48)] sm:h-[360px]">
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute right-[-36px] top-[58px] h-[3px] w-[160px] rotate-[-12deg] bg-[linear-gradient(90deg,transparent,#d7ff45_56%,transparent)] blur-[1px]" />
              <div className="absolute left-5 top-8 text-[7px] uppercase tracking-[0.30em] text-white/30">{preset.eyebrow}</div>

              <div key={`${preset.id}-${replayKey}`} className={`absolute left-5 right-5 top-[90px] ${preset.id === "split" ? "animate-[kinetiqRise_.65s_cubic-bezier(.22,1,.36,1)_both]" : preset.id === "push" ? "animate-[kinetiqPush_.55s_cubic-bezier(.16,1,.3,1)_both]" : "animate-[kinetiqPop_.6s_cubic-bezier(.2,.8,.2,1)_both]"}`}>
                <div className="text-[34px] font-semibold leading-[0.9] tracking-[-0.055em] text-white">Move ideas,<br /><span className="text-white/35">not keyframes.</span></div>
              </div>

              {preset.id === "ui" && (
                <div key={`card-${replayKey}`} className="absolute bottom-8 left-5 right-5 animate-[kinetiqPop_.7s_.1s_cubic-bezier(.2,.8,.2,1)_both] rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 backdrop-blur">
                  <div className="text-[7px] uppercase tracking-[0.18em] text-[#d7ff45]">Kinetiq component</div>
                  <div className="mt-2 h-2 w-4/5 rounded-full bg-white/[0.10]" />
                  <div className="mt-1.5 h-2 w-2/3 rounded-full bg-[#d7ff45]/30" />
                </div>
              )}

              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-[7px] uppercase tracking-[0.18em] text-white/18">
                <span>{preset.name}</span><span>00:02.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes kinetiqRise {
          from { opacity: 0; transform: translateY(38px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes kinetiqPush {
          from { opacity: 0; transform: translateX(-44px) skewX(-5deg); }
          to { opacity: 1; transform: translateX(0) skewX(0); }
        }
        @keyframes kinetiqPop {
          0% { opacity: 0; transform: translateY(24px) scale(.92); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.015); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
