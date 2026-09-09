"use client";

const formats = [
  {
    id: "16:9",
    width: 1920,
    height: 1080,
    platforms: "YouTube, Facebook",
  },
  {
    id: "9:16",
    width: 1080,
    height: 1920,
    platforms: "TikTok, YouTube, Instagram, Facebook",
  },
  {
    id: "1:1",
    width: 1080,
    height: 1080,
    platforms: "Instagram, LinkedIn, Facebook",
  },
] as const;

type ProjectStartScreenProps = {
  onStart: (width: number, height: number) => void;
};

export function ProjectStartScreen({ onStart }: ProjectStartScreenProps) {
  return (
    <main className="min-h-screen bg-[#111216] text-white">
      <header className="flex h-14 items-center border-b border-white/10 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d7ff45] font-black text-black">K</div>
          <div>
            <div className="font-semibold tracking-tight">Kinetiq</div>
            <div className="text-xs text-white/40">New project</div>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col justify-center px-6 py-10 lg:px-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Video</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Blank canvas</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
            Choose the format you want to design for. You can still resize later.
          </p>
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
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#d7ff45]/60 hover:bg-[#d7ff45]/[0.045]"
              >
                <div className="mb-5 flex h-36 items-center justify-center rounded-xl border border-white/10 bg-[#17181d]">
                  <div
                    className={`border border-white/20 bg-white/[0.04] transition group-hover:border-[#d7ff45]/60 group-hover:bg-[#d7ff45]/5 ${
                      square ? "h-20 w-20 rounded-lg" : landscape ? "h-16 w-28 rounded-lg" : "h-28 w-16 rounded-lg"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold">{format.id}</div>
                  <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] tabular-nums text-white/35">
                    {format.width}×{format.height}
                  </div>
                </div>
                <div className="mt-1 text-sm leading-5 text-white/45">{format.platforms}</div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
