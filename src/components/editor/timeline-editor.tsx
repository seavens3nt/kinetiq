"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 108;

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
    <section className="shrink-0 border-t border-black/10 bg-[#f7f8fa] text-[#15171a]">
      <div className="flex h-10 items-center border-b border-[#e6e8ec] bg-white px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-3">
          {project.scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScene(index)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                activeSceneIndex === index
                  ? "bg-[#15171a] text-white"
                  : "text-[#6c737f] hover:bg-[#f1f3f5] hover:text-[#15171a]"
              }`}
            >
              {item.name}
            </button>
          ))}
          <button
            type="button"
            onClick={addScene}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-[#8b929c] hover:bg-[#f1f3f5] hover:text-[#15171a]"
          >
            + Scene
          </button>
          <button
            type="button"
            onClick={duplicateScene}
            className="ml-1 shrink-0 text-[10px] text-[#9aa1aa] hover:text-[#15171a]"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={deleteScene}
            disabled={project.scenes.length === 1}
            className="shrink-0 text-[10px] text-[#9aa1aa] hover:text-red-500 disabled:opacity-25"
          >
            Delete
          </button>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#111318] text-[10px] font-bold text-white shadow-sm"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <span className="text-[11px] font-semibold tabular-nums text-[#202329]">{formatTime(currentTime)}</span>
          <span className="text-[11px] tabular-nums text-[#a0a6af]">| {formatTime(duration)}</span>
          <button
            type="button"
            onClick={replay}
            className="ml-1 rounded px-1.5 py-1 text-[10px] text-[#8d949e] hover:bg-[#f1f3f5] hover:text-[#15171a]"
          >
            Replay
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <label className="hidden items-center gap-1 text-[10px] text-[#8b929c] md:flex">
            Length
            <input
              type="number"
              min="1"
              step="0.5"
              value={duration}
              onChange={(event) => setSceneDuration(Number(event.target.value) || 1)}
              className="w-12 rounded border border-[#e2e5e9] bg-white px-1.5 py-1 text-[10px] text-[#444a53] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={addTextElement}
            className="rounded-md border border-[#e2e5e9] bg-white px-2.5 py-1 text-[10px] font-medium text-[#555c66] hover:bg-[#f4f5f7]"
          >
            + Layer
          </button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-[210px] select-none overflow-y-auto bg-white"
        onPointerDown={beginPlayheadDrag}
        onPointerMove={movePlayhead}
      >
        <div className="sticky top-0 z-20 grid grid-cols-[108px_1fr] border-b border-[#edf0f2] bg-white">
          <div className="flex h-8 items-center gap-2 px-3 text-[#c0c5cc]">
            <button type="button" className="text-[13px] hover:text-[#636a74]">⌫</button>
            <button type="button" className="text-[13px] hover:text-[#636a74]">✂</button>
          </div>
          <div className="relative h-8">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 h-full border-l border-[#e7eaee]"
                style={{ left: `${(tick / duration) * 100}%` }}
              >
                <span className="absolute left-1 top-1.5 text-[9px] tabular-nums text-[#9ba3ad]">
                  00:{String(tick).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[108px_1fr]">
          <div className="relative border-r border-[#edf0f2] bg-white">
            <div className="sticky top-8 flex h-12 items-center justify-center border-b border-[#edf0f2]">
              <button
                type="button"
                onClick={addTextElement}
                className="grid h-8 w-8 place-items-center rounded-md border border-dashed border-[#d9dde2] bg-[#f7f8fa] text-sm text-[#4f5660] hover:border-[#aeb5be]"
                title="Add layer"
              >
                ✎
              </button>
            </div>
            {scene.elements.map((element) => (
              <button
                key={element.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElement(element.id);
                }}
                className={`flex h-10 w-full items-center gap-2 border-b border-[#edf0f2] px-3 text-left text-[10px] ${
                  selectedElementId === element.id ? "bg-[#f2f9ff] text-[#1677ff]" : "text-[#858c95] hover:bg-[#fafbfc]"
                }`}
              >
                <span className="text-[12px]">T</span>
                <span className="truncate">{element.content || "Text"}</span>
              </button>
            ))}
          </div>

          <div className="relative min-w-0 bg-[#fbfcfd]">
            <div className="relative h-12 border-b border-[#edf0f2] bg-[#f1f3f5]">
              <div className="absolute inset-y-1.5 left-0 right-0 rounded-md bg-[#eef1f4] px-3 text-[10px] leading-9 text-[#8b929b]">
                Drag and drop media here
              </div>
            </div>

            {scene.elements.map((element) => {
              const left = (element.startTime / duration) * 100;
              const width = (element.duration / duration) * 100;
              const isSelected = selectedElementId === element.id;

              return (
                <div key={element.id} className="relative h-10 border-b border-[#edf0f2] bg-white">
                  <div
                    className={`absolute inset-y-1.5 rounded-md text-[10px] font-medium shadow-sm ${
                      isSelected
                        ? "bg-[#ff8a24] text-white ring-1 ring-[#ef7b17]"
                        : "bg-[#f28a2d] text-white hover:bg-[#ec8123]"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onPointerDown={(event) => beginBlockDrag(event, element.id, "move")}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md hover:bg-black/10"
                      onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-start")}
                    />
                    <div className="pointer-events-none flex h-full items-center gap-1 truncate px-3">
                      <span className="text-[11px]">T</span>
                      <span className="truncate">{element.content || "Add heading"}</span>
                    </div>
                    <div
                      className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md hover:bg-black/10"
                      onPointerDown={(event) => beginBlockDrag(event, element.id, "resize-end")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-[108px] right-0 top-0 z-30">
          <div
            className="absolute bottom-0 top-0 w-[2px] bg-[#171a1f]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -left-[4px] top-0 h-3 w-[10px] rounded-b border border-[#171a1f] bg-white" />
          </div>
        </div>
      </div>

      {selectedElementId && scene.elements.length > 1 && (
        <div className="flex h-7 items-center justify-end border-t border-[#edf0f2] bg-white px-3">
          <button
            type="button"
            onClick={deleteSelectedElement}
            className="text-[10px] text-[#a0a6af] hover:text-red-500"
          >
            Delete selected layer
          </button>
        </div>
      )}
    </section>
  );
}
