"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 120;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function TimelineEditor() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const {
    project,
    activeSceneIndex,
    currentTime,
    isPlaying,
    selectedElementId,
    setCurrentTime,
    togglePlayback,
    setSelectedElement,
    setElementTiming,
    setSceneDuration,
  } = useEditorStore();

  const scene = project.scenes[activeSceneIndex];
  const duration = scene.durationInSeconds;

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
    const element = scene.elements.find((item) => item.id === elementId);
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
    <section className="border-t border-white/10 bg-[#0d0e12] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayback}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#d7ff45] text-xs font-black text-black"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <div>
            <div className="text-sm font-semibold">Timeline · {scene.name}</div>
            <div className="text-xs text-white/35">Scrub, drag clips, and resize their edges.</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs tabular-nums text-white/45">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
          <label className="flex items-center gap-2 text-xs text-white/50">
            Scene length
            <input
              type="number"
              min="1"
              step="0.5"
              value={duration}
              onChange={(event) => setSceneDuration(Number(event.target.value) || 1)}
              className="w-16 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-white outline-none"
            />
            s
          </label>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative select-none overflow-hidden"
        onPointerDown={beginPlayheadDrag}
        onPointerMove={movePlayhead}
      >
        <div className="grid grid-cols-[120px_1fr] border-b border-white/10">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">Track</div>
          <div className="relative h-9">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 h-full border-l border-white/10"
                style={{ left: `${(tick / duration) * 100}%` }}
              >
                <span className="absolute left-1 top-2 text-[10px] text-white/35">{tick}s</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[120px_1fr] border-b border-white/10">
          <div className="flex items-center px-3 py-3 text-xs text-white/55">Background</div>
          <div className="relative h-12 bg-white/[0.015]">
            <div className="absolute inset-y-2 left-0 right-0 rounded-md border border-white/10 bg-white/[0.04] px-3 text-[11px] leading-8 text-white/45">
              {scene.backgroundPresetId}
            </div>
          </div>
        </div>

        {scene.elements.map((element) => {
          const left = (element.startTime / duration) * 100;
          const width = (element.duration / duration) * 100;
          const isSelected = selectedElementId === element.id;

          return (
            <div key={element.id} className="grid grid-cols-[120px_1fr] border-b border-white/10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`px-3 py-3 text-left text-xs ${isSelected ? "text-[#d7ff45]" : "text-white/55"}`}
              >
                Text
              </button>
              <div className="relative h-12 bg-white/[0.01]">
                <div
                  className={`absolute inset-y-2 rounded-md border text-[11px] ${
                    isSelected
                      ? "border-[#d7ff45] bg-[#d7ff45]/15 text-[#e8ff8d]"
                      : "border-[#8067ff]/50 bg-[#8067ff]/15 text-[#c8bdff]"
                  }`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  onPointerDown={(event) => beginBlockDrag(event, element.id, "move")}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md bg-white/10 hover:bg-white/20"
                    onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-start")}
                  />
                  <div className="pointer-events-none truncate px-3 leading-8">{element.content}</div>
                  <div
                    className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md bg-white/10 hover:bg-white/20"
                    onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-end")}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute bottom-0 left-[120px] right-0 top-0 z-20">
          <div
            className="absolute bottom-0 top-0 w-px bg-[#d7ff45]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -left-1.5 top-0 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-[#d7ff45]" />
          </div>
        </div>
      </div>
    </section>
  );
}
