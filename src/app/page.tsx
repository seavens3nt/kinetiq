import Link from "next/link";
import { InteractiveMotionDemo } from "@/components/landing/interactive-motion-demo";

const features = [
  {
    label: "Motion presets",
    title: "Fast motion without generic template energy.",
    copy: "Start from polished behaviors for type, UI, images, video, and shapes, then tune timing and transforms yourself.",
  },
  {
    label: "Canvas control",
    title: "Design where the motion actually happens.",
    copy: "Move, resize, rotate, align, and snap directly on stage with a focused inspector beside it.",
  },
  {
    label: "One timeline",
    title: "Tell the whole story in one continuous flow.",
    copy: "Keep layers, music, transitions, markers, and motion blocks together instead of scattering the edit across scenes.",
  },
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 34 : 74;
  const limeId = compact ? "kinetiq-lime-s" : "kinetiq-lime-l";
  const darkId = compact ? "kinetiq-dark-s" : "kinetiq-dark-l";

  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={limeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#efff69" />
          <stop offset="55%" stopColor="#d7ff45" />
          <stop offset="100%" stopColor="#87962d" />
        </linearGradient>
        <linearGradient id={darkId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#09090b" />
          <stop offset="55%" stopColor="#202119" />
          <stop offset="100%" stopColor="#d7ff45" />
        </linearGradient>
      </defs>
      <path d="M10 8H24V26L42 8H61L36 33L61 64H43L24 41V64H10Z" fill={`url(#${limeId})`} />
      <path d="M10 8H24V31L10 45Z" fill="#111216" opacity="0.82" />
      <path d="M24 41L36 33L61 64H43Z" fill={`url(#${darkId})`} />
    </svg>
  );
}

function StudioPreview() {
  return (
    <div id="product" className="relative mx-auto mt-16 max-w-6xl lg:mt-20">
      <div className="absolute -inset-20 -z-10 bg-[radial-gradient(circle,rgba(215,255,69,0.08),transparent_56%)] blur-3xl" />
      <div className="overflow-hidden rounded-[28px] border border-white/[0.075] bg-[#0a0a0d] shadow-[0_34px_120px_rgba(0,0,0,0.62)]">
        <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#0c0c10] px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/10" />
            <span className="h-2 w-2 rounded-full bg-white/[0.07]" />
            <span className="h-2 w-2 rounded-full bg-white/[0.05]" />
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/25">Kinetiq Studio</div>
          <div className="rounded-md border border-[#d7ff45]/20 bg-[#d7ff45]/[0.055] px-2 py-1 text-[8px] text-[#d7ff45]">Saved</div>
        </div>

        <div className="grid min-h-[500px] grid-cols-[170px_1fr_220px] bg-[#121217] max-lg:grid-cols-[150px_1fr] max-md:grid-cols-1">
          <aside className="border-r border-white/[0.055] bg-[#0c0c10] p-3 max-md:hidden">
            <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/20">Motion</div>
            <div className="mt-3 space-y-2">
              {["Split Rise", "Blur Reveal", "Kinetic Push", "UI Pop"].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg border px-3 py-2.5 text-[9px] ${
                    index === 0
                      ? "border-[#d7ff45]/30 bg-[#d7ff45]/[0.045] text-[#d7ff45]"
                      : "border-white/[0.05] bg-white/[0.012] text-white/35"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[#15161a] p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(215,255,69,0.08),transparent_28%)]" />
            <div className="absolute left-4 top-4 rounded-full border border-white/[0.055] bg-black/30 px-3 py-1.5 text-[8px] text-white/25">1080 × 1920</div>
            <div className="relative h-[330px] w-[186px] overflow-hidden rounded-[18px] border border-white/[0.12] bg-[#08080a] shadow-[0_30px_80px_rgba(0,0,0,0.58)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(215,255,69,0.10),transparent_34%)]" />
              <div className="absolute right-[-32px] top-[48px] h-[3px] w-[150px] rotate-[-12deg] bg-[linear-gradient(90deg,transparent,#d7ff45_55%,transparent)] blur-[1px]" />
              <div className="absolute left-5 top-14 text-[7px] uppercase tracking-[0.32em] text-white/40">Create</div>
              <div className="absolute left-5 top-[78px] text-[7px] uppercase tracking-[0.32em] text-white/40">Animate</div>
              <div className="absolute left-5 top-[102px] text-[7px] uppercase tracking-[0.32em] text-white/40">Share</div>
              <div className="absolute left-5 top-[126px] text-[7px] uppercase tracking-[0.32em] text-[#d7ff45]">Move</div>
              <div className="absolute left-5 top-[151px] h-[2px] w-8 bg-[#d7ff45]" />
              <div className="absolute bottom-7 left-5 right-5 text-[24px] font-semibold leading-[0.9] tracking-[-0.05em] text-white">Move ideas, not keyframes.</div>
            </div>
          </div>

          <aside className="border-l border-white/[0.055] bg-[#0c0c10] p-3 max-lg:hidden">
            <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/20">Inspector</div>
            <div className="mt-3 rounded-xl border border-white/[0.055] bg-white/[0.012] p-3">
              <div className="text-[9px] font-medium">Transform</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["X 120", "Y 420", "W 840", "H 180"].map((value) => (
                  <div key={value} className="rounded-md bg-[#141419] px-2 py-2 text-[8px] text-white/30">{value}</div>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[8px] text-white/25">
                  <span>Opacity</span>
                  <span>100%</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.055]">
                  <div className="h-1 w-full rounded-full bg-[#d7ff45]" />
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="border-t border-white/[0.055] bg-[#09090d] p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-[#d7ff45] text-[8px] text-black">▶</div>
            <div className="h-2 w-20 rounded-full bg-white/[0.055]" />
            <div className="ml-auto h-2 w-12 rounded-full bg-white/[0.035]" />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div className="rounded-md border border-white/[0.05] bg-[#101015] px-2 py-2 text-[8px] text-white/30">01 Heading</div>
            <div className="relative h-9 rounded-md bg-white/[0.025]">
              <div className="absolute left-[8%] top-1.5 h-6 w-[34%] rounded bg-[#d7ff45]/20" />
              <div className="absolute left-[44%] top-1.5 h-6 w-[24%] rounded bg-white/[0.055]" />
              <div className="absolute inset-y-0 left-[38%] w-px bg-[#d7ff45]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060608] text-[#f6f6f3]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.045),transparent_26%),radial-gradient(circle_at_78%_24%,rgba(215,255,69,0.05),transparent_20%)]" />

      <header className="sticky top-0 z-40 border-b border-white/[0.055] bg-[#060608]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark compact />
            <div>
              <div className="text-sm font-semibold tracking-[0.08em]">KINETIQ</div>
              <div className="mt-0.5 text-[8px] uppercase tracking-[0.28em] text-white/25">Motion Studio</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[10px] uppercase tracking-[0.18em] text-white/35 md:flex">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#interactive" className="transition hover:text-white">Try it</a>
            <a href="#features" className="transition hover:text-white">Features</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/studio" className="hidden rounded-full border border-white/[0.085] px-3.5 py-2 text-[10px] text-white/55 transition hover:border-white/20 hover:text-white sm:block">Open studio</Link>
            <Link href="/studio" className="rounded-full bg-[#d7ff45] px-4 py-2 text-[10px] font-bold text-[#070709] transition hover:brightness-105">Start creating</Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.32em] text-white/30">
              <span className="h-px w-9 bg-[#d7ff45]" />
              Motion storytelling for product teams
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
              Move ideas,
              <span className="block text-white/35">not keyframes.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[14px] leading-7 text-white/40 sm:text-[15px]">
              Kinetiq is a focused motion editor for SaaS launches, pitch videos, kinetic typography, product demos, and UI storytelling — built around presets, direct canvas control, and one continuous timeline.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d7ff45] px-5 py-3 text-[11px] font-bold text-[#070709] shadow-[0_12px_44px_rgba(215,255,69,0.10)] transition hover:-translate-y-0.5 hover:brightness-105">Open Kinetiq Studio <span>→</span></Link>
              <a href="#interactive" className="inline-flex w-fit items-center rounded-full border border-white/[0.085] bg-white/[0.015] px-5 py-3 text-[11px] text-white/55 transition hover:border-white/20 hover:text-white">Try the motion demo</a>
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 text-[9px] uppercase tracking-[0.30em] text-white/25">
              <span>Create</span><span className="text-[#d7ff45]">•</span><span>Animate</span><span className="text-[#d7ff45]">•</span><span>Share</span><span className="text-[#d7ff45]">•</span><span className="text-[#d7ff45]">Move</span>
            </div>
          </div>

          <div className="relative min-h-[430px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_45%,rgba(215,255,69,0.09),transparent_34%)] blur-3xl" />
            <div className="absolute right-[-10%] top-[18%] h-[3px] w-[88%] rotate-[-8deg] bg-[linear-gradient(90deg,transparent,#d7ff45_54%,transparent)] blur-[1px] opacity-70" />
            <div className="absolute right-[-14%] top-[31%] h-[2px] w-[76%] rotate-[-7deg] bg-[linear-gradient(90deg,transparent,#6d7a29_56%,transparent)] opacity-40" />
            <div className="absolute left-[10%] top-[10%] scale-[2.2] opacity-95 sm:left-[22%] sm:top-[14%] sm:scale-[2.5]"><BrandMark /></div>
            <div className="absolute bottom-[18%] left-[9%] sm:left-[20%]">
              <div className="text-[44px] font-semibold tracking-[0.08em] sm:text-[58px]">KINETIQ</div>
              <div className="mt-3 text-[9px] uppercase tracking-[0.48em] text-white/35 sm:text-[10px]">Move ideas, not keyframes.</div>
            </div>
          </div>
        </div>

        <StudioPreview />
      </section>

      <section id="interactive" className="relative z-10 border-y border-white/[0.055] bg-white/[0.01] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#d7ff45]">Interactive motion lab</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Try the motion before opening the editor.</h2>
            <p className="mt-3 text-[12px] leading-6 text-white/40">Switch between motion behaviors and replay them live. This is the interaction model Kinetiq uses to make motion presets feel editable instead of canned.</p>
          </div>
          <InteractiveMotionDemo />
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="group rounded-[24px] border border-white/[0.065] bg-[#0d0d11] p-6 transition hover:-translate-y-1 hover:border-[#d7ff45]/25 hover:bg-[#0f100f] lg:p-7">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d7ff45]/75">{feature.label}</div>
                <div className="text-[10px] text-white/15">0{index + 1}</div>
              </div>
              <h3 className="mt-10 text-xl font-semibold leading-tight tracking-[-0.035em]">{feature.title}</h3>
              <p className="mt-3 text-[11px] leading-5 text-white/35">{feature.copy}</p>
              <div className="mt-8 h-px w-10 bg-[#d7ff45]/40 transition-all group-hover:w-20" />
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#d7ff45]/15 bg-[linear-gradient(135deg,rgba(215,255,69,0.06),rgba(255,255,255,0.015))] p-8 sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d7ff45]">Create · Animate · Share · Move</div>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Build the motion piece you were picturing.</h2>
              <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/35">Open Kinetiq Studio and start from a blank canvas. No setup maze, no wall of keyframes.</p>
            </div>
            <Link href="/studio" className="inline-flex w-fit rounded-full bg-[#d7ff45] px-5 py-3 text-[11px] font-bold text-[#070709] transition hover:-translate-y-0.5 hover:brightness-105">Open the studio →</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.055] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><BrandMark compact /><div><div className="text-[11px] font-semibold tracking-[0.12em]">KINETIQ</div><div className="mt-1 text-[8px] uppercase tracking-[0.3em] text-white/20">Move ideas, not keyframes.</div></div></div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/20">Motion Studio · 2026</div>
        </div>
      </footer>
    </main>
  );
}
