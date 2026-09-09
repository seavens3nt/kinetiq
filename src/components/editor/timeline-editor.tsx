"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 160;

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
    <section className="border-t border-white/10 bg-[#0d0e12] text-white">
      <div className="border-b border-white/10 bg-[#101116] px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Scenes</div>
          {project.scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScene(index)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                activeSceneIndex === index
                  ? "border-[#d7ff45] bg-[#d7ff45]/10"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
            >
              <div className="text-xs font-semibold">{item.name}</div>
              <div className="mt-0.5 text-[10px] text-white/35">
                {item.durationInSeconds.toFixed(1)}s · {item.elements.length} layer{item.elements.length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={addScene}
            className="shrink-0 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-white/50 transition hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
          >
            + Scene
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            <button type="button" onClick={duplicateScene} className="text-[11px] text-white/40 hover:text-white">
              Duplicate
            </button>
            <button
              type="button"
              onClick={deleteScene}
              disabled={project.scenes.length === 1}
              className="text-[11px] text-white/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayback}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#d7ff45] text-xs font-black text-black"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <div>
            <div className="text-sm font-semibold">{scene.name}</div>
            <div className="text-xs text-white/35">Scenes, layers, and timing live here.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs tabular-nums text-white/45">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
          <label className="hidden items-center gap-2 text-xs text-white/50 sm:flex">
            Length
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
          <button
            type="button"
            onClick={addTextElement}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition hover:border-[#d7ff45]/50 hover:text-[#d7ff45]"
          >
            + Layer
          </button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative max-h-[330px] select-none overflow-y-auto"
        onPointerDown={beginPlayheadDrag}
        onPointerMove={movePlayhead}
      >
        <div className="sticky top-0 z-10 grid grid-cols-[160px_1fr] border-b border-white/10 bg-[#0d0e12]">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">Layers</span>
            {selectedElementId && scene.elements.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteSelectedElement();
                }}
                className="text-[10px] text-white/30 hover:text-red-300"
              >
                Delete selected
              </button>
            )}
          </div>
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

        <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-white/55">
            <span className="grid h-5 w-5 place-items-center rounded bg-white/[0.05] text-[10px]">BG</span>
            <span>Background</span>
          </div>
          <div className="relative h-12 bg-white/[0.015]">
            <div className="absolute inset-y-2 left-0 right-0 rounded-md border border-white/10 bg-white/[0.04] px-3 text-[11px] leading-8 text-white/45">
              {scene.backgroundPresetId}
            </div>
          </div>
        </div>

        {scene.elements.map((element, index) => {
          const left = (element.startTime / duration) * 100;
          const width = (element.duration / duration) * 100;
          const isSelected = selectedElementId === element.id;

          return (
            <div key={element.id} className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`flex items-center gap-2 px-3 py-3 text-left text-xs ${isSelected ? "bg-[#d7ff45]/5 text-[#d7ff45]" : "text-white/55 hover:bg-white/[0.025]"}`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded text-[10px] ${isSelected ? "bg-[#d7ff45]/15" : "bg-white/[0.05]"}`}>T</span>
                <span className="min-w-0 flex-1 truncate">{element.content || `Text ${index + 1}`}</span>
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

        <div className="pointer-events-none absolute bottom-0 left-[160px] right-0 top-0 z-20">
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
