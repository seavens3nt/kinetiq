"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 152;

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
    replay,
    setSelectedElement,
    setElementTiming,
    setSceneDuration,
    setActiveScene,
    addScene,
    duplicateScene,
    deleteScene,
    addTextElement,
    deleteSelectedElement,
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
    <section className="shrink-0 border-t border-white/10 bg-[#0d0e12] text-white">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#101116] px-3 py-1.5">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Scenes</span>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {project.scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScene(index)}
              className={`shrink-0 rounded-md border px-2.5 py-1.5 text-left transition ${
                activeSceneIndex === index
                  ? "border-[#d7ff45] bg-[#d7ff45]/10"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
            >
              <div className="text-[11px] font-semibold">{item.name}</div>
              <div className="text-[9px] text-white/35">{item.durationInSeconds.toFixed(1)}s · {item.elements.length}L</div>
            </button>
          ))}
          <button
            type="button"
            onClick={addScene}
            className="shrink-0 rounded-md border border-dashed border-white/15 px-2.5 py-1.5 text-[11px] text-white/50 hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
          >
            + Scene
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-2">
          <button onClick={duplicateScene} className="text-[10px] text-white/35 hover:text-white">Duplicate</button>
          <button
            onClick={deleteScene}
            disabled={project.scenes.length === 1}
            className="text-[10px] text-white/35 hover:text-red-300 disabled:opacity-20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#d7ff45] text-xs font-black text-black"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <button
            onClick={replay}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.08]"
          >
            Replay
          </button>
          <div className="ml-1 text-[11px] tabular-nums text-white/45">
            {currentTime.toFixed(2)} / {duration.toFixed(2)}s
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-1.5 text-[11px] text-white/45 sm:flex">
            Length
            <input
              type="number"
              min="1"
              step="0.5"
              value={duration}
              onChange={(event) => setSceneDuration(Number(event.target.value) || 1)}
              className="w-14 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-white outline-none"
            />
            s
          </label>
          <button
            type="button"
            onClick={addTextElement}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/70 hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
          >
            + Layer
          </button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative max-h-[230px] select-none overflow-y-auto"
        onPointerDown={beginPlayheadDrag}
        onPointerMove={movePlayhead}
      >
        <div className="sticky top-0 z-10 grid grid-cols-[152px_1fr] border-b border-white/10 bg-[#0d0e12]">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Layers</span>
            {selectedElementId && scene.elements.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteSelectedElement();
                }}
                className="text-[9px] text-white/30 hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>
          <div className="relative h-8">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 h-full border-l border-white/10"
                style={{ left: `${(tick / duration) * 100}%` }}
              >
                <span className="absolute left-1 top-1.5 text-[9px] text-white/35">{tick}s</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[152px_1fr] border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-white/55">
            <span className="grid h-5 w-5 place-items-center rounded bg-white/[0.05] text-[9px]">BG</span>
            <span>Background</span>
          </div>
          <div className="relative h-10 bg-white/[0.015]">
            <div className="absolute inset-y-1.5 left-0 right-0 rounded-md border border-white/10 bg-white/[0.04] px-3 text-[10px] leading-7 text-white/45">
              {scene.backgroundPresetId}
            </div>
          </div>
        </div>

        {scene.elements.map((element, index) => {
          const left = (element.startTime / duration) * 100;
          const width = (element.duration / duration) * 100;
          const isSelected = selectedElementId === element.id;

          return (
            <div key={element.id} className="grid grid-cols-[152px_1fr] border-b border-white/10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-left text-[11px] ${isSelected ? "bg-[#d7ff45]/5 text-[#d7ff45]" : "text-white/55 hover:bg-white/[0.025]"}`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded text-[9px] ${isSelected ? "bg-[#d7ff45]/15" : "bg-white/[0.05]"}`}>T</span>
                <span className="min-w-0 flex-1 truncate">{element.content || `Text ${index + 1}`}</span>
              </button>
              <div className="relative h-10 bg-white/[0.01]">
                <div
                  className={`absolute inset-y-1.5 rounded-md border text-[10px] ${
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
                  <div className="pointer-events-none truncate px-3 leading-7">{element.content}</div>
                  <div
                    className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md bg-white/10 hover:bg-white/20"
                    onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-end")}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute bottom-0 left-[152px] right-0 top-0 z-20">
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
