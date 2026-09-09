"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 112;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const hundredths = Math.floor((time % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

export function TimelineEditor() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const {
    project,
    currentTime,
    isPlaying,
    selectedElementId,
    setCurrentTime,
    togglePlayback,
    replay,
    setSelectedElement,
    setElementTiming,
    setSceneDuration,
    addTextElement,
    deleteSelectedElement,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const duration = timeline.durationInSeconds;

  const ticks = useMemo(() => {
    const wholeSeconds = Math.ceil(duration);
    return Array.from({ length: wholeSeconds + 1 }, (_, index) => index);
  }, [duration]);

  const pointerToTime = (clientX: number) => {
    const element = timelineRef.current;
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const usableWidth = Math.max(1, rect.width - LABEL_WIDTH);
    const x = clamp(clientX - rect.left - LABEL_WIDTH, 0, usableWidth);
    return (x / usableWidth) * duration;
  };

  const beginPlayheadDrag = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentTime(pointerToTime(event.clientX));
  };

  const movePlayhead = (event: React.PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      setCurrentTime(pointerToTime(event.clientX));
    }
  };

  const beginBlockDrag = (
    event: React.PointerEvent,
    elementId: string,
    mode: "move" | "resize-start" | "resize-end",
  ) => {
    event.stopPropagation();
    const element = timeline.elements.find((item) => item.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    const startPointerTime = pointerToTime(event.clientX);
    const originalStart = element.startTime;
    const originalDuration = element.duration;

    const handleMove = (moveEvent: PointerEvent) => {
      const pointerTime = pointerToTime(moveEvent.clientX);
      const delta = pointerTime - startPointerTime;

      if (mode === "move") {
        const nextStart = clamp(originalStart + delta, 0, duration - originalDuration);
        setElementTiming(elementId, nextStart, originalDuration);
      }

      if (mode === "resize-start") {
        const nextStart = clamp(originalStart + delta, 0, originalStart + originalDuration - 0.1);
        const nextDuration = originalDuration + (originalStart - nextStart);
        setElementTiming(elementId, nextStart, nextDuration);
      }

      if (mode === "resize-end") {
        const nextDuration = clamp(originalDuration + delta, 0.1, duration - originalStart);
        setElementTiming(elementId, originalStart, nextDuration);
      }
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0B0B0F] text-[#F7F7F4]">
      <div className="relative flex h-11 items-center border-b border-white/10 bg-[#101015] px-3">
        <div className="flex items-center gap-2 text-[10px] text-white/35">
          <span className="font-semibold uppercase tracking-[0.18em]">Master timeline</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/35">
            {timeline.elements.length} layer{timeline.elements.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#D7FF45] text-[10px] font-black text-[#0B0B0F] shadow-[0_0_18px_rgba(215,255,69,0.18)]"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <span className="text-[11px] font-semibold tabular-nums text-[#F7F7F4]">{formatTime(currentTime)}</span>
          <span className="text-[11px] tabular-nums text-white/30">| {formatTime(duration)}</span>
          <button
            type="button"
            onClick={replay}
            className="ml-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55 transition hover:border-[#D7FF45]/40 hover:text-[#D7FF45]"
          >
            Replay
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="hidden items-center gap-1.5 text-[10px] text-white/35 md:flex">
            Video length
            <input
              type="number"
              min="1"
              step="0.5"
              value={duration}
              onChange={(event) => setSceneDuration(Number(event.target.value) || 1)}
              className="w-14 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] text-[#F7F7F4] outline-none focus:border-[#D7FF45]/50"
            />
            s
          </label>
          <button
            type="button"
            onClick={addTextElement}
            className="rounded-md border border-[#8067FF]/40 bg-[#8067FF]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#BDB2FF] transition hover:border-[#D7FF45]/50 hover:text-[#D7FF45]"
          >
            + Layer
          </button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-[224px] select-none overflow-y-auto bg-[#0D0D12]"
        onPointerDown={beginPlayheadDrag}
        onPointerMove={movePlayhead}
      >
        <div className="sticky top-0 z-20 grid grid-cols-[112px_1fr] border-b border-white/10 bg-[#0D0D12]">
          <div className="flex h-8 items-center gap-2 border-r border-white/10 px-3 text-white/20">
            <button type="button" className="text-[12px] transition hover:text-[#D7FF45]">⌫</button>
            <button type="button" className="text-[12px] transition hover:text-[#D7FF45]">✂</button>
          </div>
          <div className="relative h-8">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 h-full border-l border-white/[0.08]"
                style={{ left: `${(tick / duration) * 100}%` }}
              >
                <span className="absolute left-1 top-1.5 text-[9px] tabular-nums text-white/30">
                  00:{String(tick).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[112px_1fr]">
          <div className="relative border-r border-white/10 bg-[#101015]">
            <div className="sticky top-8 flex h-12 items-center justify-center border-b border-white/10">
              <button
                type="button"
                onClick={addTextElement}
                className="grid h-8 w-8 place-items-center rounded-md border border-dashed border-[#8067FF]/40 bg-[#8067FF]/10 text-sm text-[#BDB2FF] transition hover:border-[#D7FF45]/60 hover:text-[#D7FF45]"
                title="Add layer"
              >
                +
              </button>
            </div>
            {timeline.elements.map((element) => (
              <button
                key={element.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`flex h-10 w-full items-center gap-2 border-b border-white/10 px-3 text-left text-[10px] transition ${
                  selectedElementId === element.id
                    ? "bg-[#D7FF45]/8 text-[#D7FF45]"
                    : "text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded text-[9px] ${selectedElementId === element.id ? "bg-[#D7FF45]/12" : "bg-white/[0.04]"}`}>
                  T
                </span>
                <span className="truncate">{element.content || "Text"}</span>
              </button>
            ))}
          </div>

          <div className="relative min-w-0 bg-[#0D0D12]">
            <div className="relative h-12 border-b border-white/10 bg-[#121219]">
              <div className="absolute inset-y-1.5 left-0 right-0 rounded-md border border-white/[0.05] bg-white/[0.035] px-3 text-[10px] leading-9 text-white/25">
                Drop media / audio here
              </div>
            </div>

            {timeline.elements.map((element) => {
              const left = (element.startTime / duration) * 100;
              const width = (element.duration / duration) * 100;
              const isSelected = selectedElementId === element.id;

              return (
                <div key={element.id} className="relative h-10 border-b border-white/10 bg-[#0F0F14]">
                  <div
                    className={`absolute inset-y-1.5 rounded-md border text-[10px] font-semibold shadow-sm transition ${
                      isSelected
                        ? "border-[#D7FF45] bg-[#D7FF45]/16 text-[#E9FF9E] shadow-[0_0_0_1px_rgba(215,255,69,0.08)]"
                        : "border-[#8067FF]/50 bg-[#8067FF]/18 text-[#CEC7FF] hover:bg-[#8067FF]/24"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onPointerDown={(event) => beginBlockDrag(event, element.id, "move")}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md hover:bg-white/10"
                      onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-start")}
                    />
                    <div className="pointer-events-none flex h-full items-center gap-1 truncate px-3">
                      <span className="text-[11px]">T</span>
                      <span className="truncate">{element.content || "Text"}</span>
                    </div>
                    <div
                      className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md hover:bg-white/10"
                      onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-end")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-[112px] right-0 top-0 z-30">
          <div
            className="absolute bottom-0 top-0 w-[2px] bg-[#D7FF45] shadow-[0_0_10px_rgba(215,255,69,0.18)]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -left-[4px] top-0 h-3 w-[10px] rounded-b border border-[#D7FF45] bg-[#0B0B0F]" />
          </div>
        </div>
      </div>

      {selectedElementId && timeline.elements.length > 1 && (
        <div className="flex h-7 items-center justify-end border-t border-white/10 bg-[#101015] px-3">
          <button
            type="button"
            onClick={deleteSelectedElement}
            className="text-[10px] text-white/30 transition hover:text-red-300"
          >
            Delete selected layer
          </button>
        </div>
      )}
    </section>
  );
}
