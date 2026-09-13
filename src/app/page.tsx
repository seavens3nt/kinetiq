import Link from "next/link";

const features = [
  {
    eyebrow: "Preset-driven motion",
    title: "Animate ideas without babysitting keyframes.",
    copy: "Build polished text, UI, shape, image, and video motion from reusable presets you can still fine-tune in the editor.",
  },
  {
    eyebrow: "Continuous timeline",
    title: "Compose the whole story in one timeline.",
    copy: "Layer clips, music, markers, transitions, and motion blocks in one focused workspace made for product storytelling.",
  },
  {
    eyebrow: "Canvas-first editing",
    title: "Move, resize, rotate, and align directly on stage.",
    copy: "Smart guides, snapping, transform controls, and a clean inspector keep layout work fast and visual.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08080b] text-[#f7f7f4]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(128,103,255,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(215,255,69,0.08),transparent_20%)]" />

      <header className="relative z-20 border-b border-white/[0.06] bg-[#08080b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#D7FF45] text-sm font-black text-[#0B0B0F] shadow-[0_0_30px_rgba(215,255,69,0.08)]">K</div>
            <div>
              <div className="text-sm font-semibold tracking-[-0.03em]">Kinetiq</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/25">Motion Studio</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-[11px] text-white/40 md:flex">
            <a href="#product" className="transition hover:text-white">Product</a>
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#why" className="transition hover:text-white">Why Kinetiq</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/studio" className="hidden rounded-full border border-white/[0.09] px-3.5 py-2 text-[10px] text-white/55 transition hover:border-white/20 hover:text-white sm:block">Open workspace</Link>
            <Link href="/studio" className="rounded-full bg-[#D7FF45] px-4 py-2 text-[10px] font-bold text-[#0B0B0F] transition hover:brightness-105">Start creating</Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7FF45] shadow-[0_0_14px_rgba(215,255,69,0.65)]" />
            Motion storytelling, without the timeline chaos
          </div>

          <h1 className="mt-7 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Move ideas,
            <span className="block text-white/42">not keyframes.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-7 text-white/42 sm:text-[15px]">
            Kinetiq is a focused motion editor for product launches, SaaS demos, kinetic typography, pitch videos, and UI storytelling. Build fast with presets, then refine everything on canvas and timeline.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/studio" className="rounded-full bg-[#D7FF45] px-5 py-3 text-[11px] font-bold text-[#0B0B0F] shadow-[0_10px_40px_rgba(215,255,69,0.09)] transition hover:-translate-y-0.5 hover:brightness-105">Open Kinetiq Studio →</Link>
            <a href="#product" className="rounded-full border border-white/[0.09] bg-white/[0.02] px-5 py-3 text-[11px] text-white/55 transition hover:border-[#8067FF]/40 hover:text-white">See how it works</a>
          </div>
        </div>

        <div id="product" className="relative mx-auto mt-16 max-w-6xl lg:mt-20">
          <div className="absolute -inset-16 -z-10 bg-[radial-gradient(circle,rgba(128,103,255,0.15),transparent_58%)] blur-3xl" />
          <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0c0c11] shadow-[0_35px_120px_rgba(0,0,0,0.6)]">
            <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#0f0f14] px-4">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/10" /><span className="h-2 w-2 rounded-full bg-white/[0.07]" /><span className="h-2 w-2 rounded-full bg-white/[0.05]" /></div>
              <div className="text-[9px] font-medium text-white/30">Product Launch · Kinetiq Studio</div>
              <div className="rounded-md border border-[#D7FF45]/20 bg-[#D7FF45]/[0.05] px-2 py-1 text-[8px] text-[#D7FF45]">Saved</div>
            </div>

            <div className="grid min-h-[520px] grid-cols-[170px_1fr_220px] bg-[#121318] max-lg:grid-cols-[145px_1fr] max-md:grid-cols-1">
              <aside className="border-r border-white/[0.06] bg-[#0d0d12] p-3 max-md:hidden">
                <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/20">Motion</div>
                <div className="mt-3 space-y-2">
                  {['Split Rise','Blur Reveal','Pop','Fade'].map((item, i) => <div key={item} className={`rounded-lg border px-3 py-2.5 text-[9px] ${i === 0 ? 'border-[#D7FF45]/30 bg-[#D7FF45]/[0.05] text-[#D7FF45]' : 'border-white/[0.05] bg-white/[0.015] text-white/35'}`}>{item}</div>)}
                </div>
              </aside>

              <div className="relative flex min-h-[360px] items-center justify-center bg-[#17181d] p-8">
                <div className="absolute left-4 top-4 rounded-full border border-white/[0.06] bg-[#0c0c10]/70 px-3 py-1.5 text-[8px] text-white/28 backdrop-blur">1080 × 1920</div>
                <div className="relative h-[330px] w-[186px] overflow-hidden rounded-[18px] border border-white/[0.12] bg-[#0a0a0d] shadow-[0_25px_70px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(128,103,255,0.42),transparent_32%)]" />
                  <div className="absolute left-5 top-16 text-[8px] uppercase tracking-[0.18em] text-[#D7FF45]">Launch faster</div>
                  <div className="absolute left-5 top-24 max-w-[145px] text-[24px] font-semibold leading-[0.95] tracking-[-0.05em]">Motion that keeps up with your ideas.</div>
                  <div className="absolute bottom-8 left-5 right-5 rounded-xl border border-white/[0.09] bg-white/[0.04] p-3 backdrop-blur"><div className="text-[7px] text-white/28">KINETIQ RECOMMENDS</div><div className="mt-2 h-2 w-4/5 rounded-full bg-[#8067FF]/65" /><div className="mt-1.5 h-2 w-2/3 rounded-full bg-white/[0.07]" /></div>
                  <div className="absolute inset-x-5 top-[92px] h-[90px] rounded-lg border border-[#D7FF45]/35" />
                  <span className="absolute right-3 top-[86px] h-2.5 w-2.5 rounded-sm bg-[#D7FF45]" />
                </div>
              </div>

              <aside className="border-l border-white/[0.06] bg-[#0d0d12] p-3 max-lg:hidden">
                <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/20">Inspector</div>
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                  <div className="text-[9px] font-medium">Transform</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">{['X 120','Y 420','W 840','H 180'].map((v) => <div key={v} className="rounded-md bg-[#15151b] px-2 py-2 text-[8px] text-white/35">{v}</div>)}</div>
                  <div className="mt-4"><div className="mb-1 flex justify-between text-[8px] text-white/25"><span>Opacity</span><span>100%</span></div><div className="h-1 rounded-full bg-white/[0.06]"><div className="h-1 w-full rounded-full bg-[#D7FF45]" /></div></div>
                </div>
              </aside>
            </div>

            <div className="border-t border-white/[0.06] bg-[#0b0b0f] p-3">
              <div className="mb-2 flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-[#D7FF45]" /><div className="h-2 w-20 rounded-full bg-white/[0.06]" /><div className="ml-auto h-2 w-12 rounded-full bg-white/[0.04]" /></div>
              <div className="grid grid-cols-[120px_1fr] gap-2"><div className="rounded-md border border-white/[0.05] bg-[#101015] px-2 py-2 text-[8px] text-white/30">01 Heading</div><div className="relative h-9 rounded-md bg-[#8067FF]/15"><div className="absolute left-[8%] top-1.5 h-6 w-[34%] rounded bg-[#8067FF]/50" /><div className="absolute left-[44%] top-1.5 h-6 w-[24%] rounded bg-[#D7FF45]/25" /><div className="absolute left-[38%] inset-y-0 w-px bg-[#D7FF45]" /></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="relative z-10 border-y border-white/[0.06] bg-white/[0.012]">
        <div className="mx-auto grid max-w-7xl gap-px px-5 py-0 lg:grid-cols-3 lg:px-8">
          {features.map((feature, index) => (
            <article key={feature.title} className={`py-12 lg:px-8 lg:py-16 ${index > 0 ? 'border-t border-white/[0.06] lg:border-l lg:border-t-0' : ''}`}>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D7FF45]/65">{feature.eyebrow}</div>
              <h2 className="mt-4 max-w-sm text-xl font-semibold leading-tight tracking-[-0.035em]">{feature.title}</h2>
              <p className="mt-3 max-w-sm text-[11px] leading-5 text-white/35">{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8067FF]">Workflow</div>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">From blank canvas to launch-ready motion.</h2>
            <p className="mt-4 max-w-md text-[12px] leading-6 text-white/35">Kinetiq keeps setup light so you spend more time shaping the story and less time managing the tool.</p>
          </div>

          <div className="space-y-3">
            {[
              ['01','Choose a format','Start in landscape, vertical, or square and resize later.'],
              ['02','Build with layers','Add text, media, UI cards, shapes, and music to one continuous timeline.'],
              ['03','Apply motion','Use presets, transitions, transform controls, and keyframes where they actually help.'],
              ['04','Save and refine','Cloud projects keep your work available while you iterate toward export.'],
            ].map(([number,title,copy]) => (
              <div key={number} className="grid gap-4 rounded-2xl border border-white/[0.065] bg-[#0e0e13] p-5 sm:grid-cols-[48px_1fr] sm:p-6">
                <div className="text-[10px] font-semibold text-[#D7FF45]">{number}</div>
                <div><div className="text-sm font-semibold">{title}</div><div className="mt-1.5 text-[11px] leading-5 text-white/32">{copy}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#D7FF45]/15 bg-[linear-gradient(135deg,rgba(215,255,69,0.07),rgba(128,103,255,0.06))] p-8 sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D7FF45]">Kinetiq Studio</div>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Build the motion piece you were picturing.</h2>
              <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/35">Open the workspace and start from a blank canvas. No setup maze, no keyframe wall.</p>
            </div>
            <Link href="/studio" className="inline-flex w-fit rounded-full bg-[#D7FF45] px-5 py-3 text-[11px] font-bold text-[#0B0B0F] transition hover:-translate-y-0.5 hover:brightness-105">Start creating →</Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-[10px] text-white/24 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>© 2026 Kinetiq · Move ideas, not keyframes.</div>
          <div className="flex gap-5"><Link href="/studio" className="transition hover:text-white/55">Studio</Link><a href="#product" className="transition hover:text-white/55">Product</a><a href="#workflow" className="transition hover:text-white/55">Workflow</a></div>
        </div>
      </footer>
    </main>
  );
}
