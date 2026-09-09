"use client";

import { useMemo, useRef, useState } from "react";
import type { AddableComponentType } from "@/store/editor-store";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 132;
const SNAP_THRESHOLD = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const hundredths = Math.floor((time % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

const componentMeta: Record<AddableComponentType, { label: string; icon: string }> = {
  text: { label: "Text", icon: "T" },
  image: { label: "Image", icon: "▧" },
  video: { label: "Video", icon: "▶" },
  shape: { label: "Shape", icon: "◇" },
  ui: { label: "UI Component", icon: "▦" },
};

export function TimelineEditor() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [snapGuide, setSnapGuide] = useState<number | null>(null);

  const {
    project,
    currentTime,
    isPlaying,
    selectedLayerId,
    selectedComponentId,
    selectedMusicTrackId,
    setCurrentTime,
    togglePlayback,
    replay,
    setSelectedLayer,
    setSelectedComponent,
    setSelectedMusicTrack,
    setComponentTiming,
    setMusicTiming,
    setSceneDuration,
    addLayer,
    addComponentToSelectedLayer,
    addMusicTrack,
    deleteSelectedComponent,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const duration = timeline.durationInSeconds;
  const componentCount = timeline.layers.reduce((sum, layer) => sum + layer.components.length, 0);

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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) setCurrentTime(pointerToTime(event.clientX));
  };

  const componentSnapPoints = (componentId: string) => {
    const layer = timeline.layers.find((item) => item.components.some((component) => component.id === componentId));
    if (!layer) return [0, duration];
    return [
      0,
      duration,
      ...layer.components
        .filter((component) => component.id !== componentId)
        .flatMap((component) => [component.startTime, component.startTime + component.duration]),
    ];
  };

  const snapValue = (value: number, points: number[]) => {
    let best = value;
    let bestDistance = SNAP_THRESHOLD;
    for (const point of points) {
      const distance = Math.abs(value - point);
      if (distance <= bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    return best;
  };

  const beginTimedDrag = (
    event: React.PointerEvent,
    itemId: string,
    originalStart: number,
    originalDuration: number,
    mode: "move" | "resize-start" | "resize-end",
    kind: "component" | "music",
  ) => {
    event.stopPropagation();
    const startPointerTime = pointerToTime(event.clientX);
    const points = kind === "component" ? componentSnapPoints(itemId) : [0, duration];

    const apply = (startTime: number, itemDuration: number) => {
      if (kind === "component") setComponentTiming(itemId, startTime, itemDuration);
      else setMusicTiming(itemId, startTime, itemDuration);
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = pointerToTime(moveEvent.clientX) - startPointerTime;

      if (mode === "move") {
        let nextStart = clamp(originalStart + delta, 0, duration - originalDuration);
        const snappedStart = snapValue(nextStart, points);
        const snappedEnd = snapValue(nextStart + originalDuration, points);
        if (Math.abs(snappedStart - nextStart) <= Math.abs(snappedEnd - (nextStart + originalDuration))) {
          nextStart = clamp(snappedStart, 0, duration - originalDuration);
          setSnapGuide(snappedStart);
        } else {
          nextStart = clamp(snappedEnd - originalDuration, 0, duration - originalDuration);
          setSnapGuide(snappedEnd);
        }
        apply(nextStart, originalDuration);
      } else if (mode === "resize-start") {
        const rawStart = clamp(originalStart + delta, 0, originalStart + originalDuration - 0.1);
        const nextStart = snapValue(rawStart, points);
        setSnapGuide(nextStart);
        apply(nextStart, originalDuration + (originalStart - nextStart));
      } else {
        const rawEnd = clamp(originalStart + originalDuration + delta, originalStart + 0.1, duration);
        const nextEnd = snapValue(rawEnd, points);
        setSnapGuide(nextEnd);
        apply(originalStart, nextEnd - originalStart);
      }
    };

    const handleUp = () => {
      setSnapGuide(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const newLayer = (type: AddableComponentType) => {
    addLayer(type);
    setAddMenuOpen(false);
  };

  const addToLayer = (type: AddableComponentType) => {
    addComponentToSelectedLayer(type);
    setAddMenuOpen(false);
  };

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0B0B0F] text-[#F7F7F4]">
      <div className="relative flex h-11 items-center border-b border-white/10 bg-[#101015] px-3">
        <div className="flex items-center gap-2 text-[10px] text-white/35">
          <span className="font-semibold uppercase tracking-[0.18em]">Master timeline</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/35">
            {timeline.layers.length} layers · {componentCount} components
          </span>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <button type="button" onClick={togglePlayback} className="grid h-7 w-7 place-items-center rounded-full bg-[#D7FF45] text-[10px] font-black text-[#0B0B0F] shadow-[0_0_18px_rgba(215,255,69,0.18)]">
            {isPlaying ? "Ⅱ" : "▶"}
          </button>
          <span className="text-[11px] font-semibold tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-[11px] tabular-nums text-white/30">| {formatTime(duration)}</span>
          <button onClick={replay} className="ml-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55 hover:border-[#D7FF45]/40 hover:text-[#D7FF45]">Replay</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="hidden items-center gap-1.5 text-[10px] text-white/35 md:flex">
            Length
            <input type="number" min="1" step="0.5" value={duration} onChange={(event) => setSceneDuration(Number(event.target.value) || 1)} className="w-14 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] outline-none focus:border-[#D7FF45]/50" />
            s
          </label>
          <div className="relative">
            <button type="button" onClick={() => setAddMenuOpen((value) => !value)} className="rounded-md border border-[#8067FF]/40 bg-[#8067FF]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#BDB2FF] hover:border-[#D7FF45]/50 hover:text-[#D7FF45]">+ Add</button>
            {addMenuOpen && (
              <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[#14141B] p-2 shadow-2xl">
                <div className="px-2 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">New layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(componentMeta) as AddableComponentType[]).map((type) => (
                    <button key={type} onClick={() => newLayer(type)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-white/65 hover:bg-white/[0.05] hover:text-white">
                      <span className="grid h-5 w-5 place-items-center rounded bg-[#8067FF]/15 text-[#BDB2FF]">{componentMeta[type].icon}</span>{componentMeta[type].label}
                    </button>
                  ))}
                </div>
                <div className="my-2 border-t border-white/10" />
                <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Add to selected layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(componentMeta) as AddableComponentType[]).map((type) => (
                    <button key={type} onClick={() => addToLayer(type)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-white/55 hover:bg-white/[0.05] hover:text-[#D7FF45]">
                      <span>{componentMeta[type].icon}</span>{componentMeta[type].label}
                    </button>
                  ))}
                </div>
                <div className="my-2 border-t border-white/10" />
                <button onClick={() => { addMusicTrack(); setAddMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-medium text-[#D7FF45] hover:bg-[#D7FF45]/[0.06]">
                  <span className="grid h-5 w-5 place-items-center rounded bg-[#D7FF45]/10">♫</span>Add music track
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={timelineRef} className="relative max-h-[300px] min-h-[224px] select-none overflow-y-auto bg-[#0D0D12]" onPointerDown={beginPlayheadDrag} onPointerMove={movePlayhead}>
        <div className="sticky top-0 z-20 grid grid-cols-[132px_1fr] border-b border-white/10 bg-[#0D0D12]">
          <div className="flex h-8 items-center gap-2 border-r border-white/10 px-3 text-white/20"><span className="text-[9px] font-semibold uppercase tracking-[0.14em]">Layers</span></div>
          <div className="relative h-8">
            {ticks.map((tick) => (
              <div key={tick} className="absolute top-0 h-full border-l border-white/[0.08]" style={{ left: `${(tick / duration) * 100}%` }}>
                <span className="absolute left-1 top-1.5 text-[9px] tabular-nums text-white/30">00:{String(tick).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[132px_1fr] border-b border-white/10">
          <div className="flex h-11 items-center gap-2 border-r border-white/10 bg-[#101015] px-3 text-[10px] text-white/35"><span className="grid h-5 w-5 place-items-center rounded bg-white/[0.04]">BG</span>Canvas</div>
          <div className="relative h-11 bg-[#121219]"><div className="absolute inset-y-1.5 left-0 right-0 rounded-md border border-white/[0.05] bg-white/[0.035] px-3 text-[10px] leading-8 text-white/25">Background · {timeline.backgroundPresetId}</div></div>
        </div>

        {timeline.layers.map((layer, layerIndex) => {
          const isLayerSelected = selectedLayerId === layer.id;
          return (
            <div key={layer.id} className="grid grid-cols-[132px_1fr] border-b border-white/10">
              <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedLayer(layer.id); }} className={`flex h-11 items-center gap-2 border-r border-white/10 px-3 text-left text-[10px] ${isLayerSelected ? "bg-[#D7FF45]/[0.05] text-[#D7FF45]" : "bg-[#101015] text-white/40 hover:text-white/65"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded ${isLayerSelected ? "bg-[#D7FF45]/10" : "bg-white/[0.04]"}`}>{layerIndex + 1}</span>
                <span className="min-w-0"><span className="block truncate font-medium">{layer.name}</span><span className="block text-[9px] text-white/25">{layer.components.length} component{layer.components.length === 1 ? "" : "s"}</span></span>
              </button>

              <div className="relative h-11 bg-[#0F0F14]">
                {layer.components.map((component) => {
                  const left = (component.startTime / duration) * 100;
                  const width = (component.duration / duration) * 100;
                  const isSelected = selectedComponentId === component.id;
                  const meta = componentMeta[component.type];
                  return (
                    <div
                      key={component.id}
                      className={`absolute inset-y-2 rounded-md border text-[9px] font-semibold transition ${isSelected ? "z-10 border-[#D7FF45] bg-[#D7FF45]/16 text-[#E9FF9E]" : "border-[#8067FF]/50 bg-[#8067FF]/18 text-[#CEC7FF] hover:bg-[#8067FF]/24"}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onPointerDown={(event) => {
                        setSelectedComponent(component.id, layer.id);
                        beginTimedDrag(event, component.id, component.startTime, component.duration, "move", "component");
                      }}
                    >
                      <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, component.id, component.startTime, component.duration, "resize-start", "component")} />
                      <div className="pointer-events-none flex h-full items-center gap-1 truncate px-2"><span>{meta.icon}</span><span className="truncate">{component.name}</span></div>
                      <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, component.id, component.startTime, component.duration, "resize-end", "component")} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-[132px_1fr] border-b border-white/10">
          <div className="flex h-12 items-center gap-2 border-r border-white/10 bg-[#101015] px-3 text-[10px] text-[#D7FF45]/70"><span className="grid h-5 w-5 place-items-center rounded bg-[#D7FF45]/10">♫</span>Music</div>
          <div className="relative h-12 bg-[#0C0C11]">
            {timeline.musicTracks.length === 0 ? (
              <button type="button" onClick={addMusicTrack} className="absolute inset-y-1.5 left-2 rounded-md border border-dashed border-[#D7FF45]/20 px-3 text-[9px] text-white/25 hover:border-[#D7FF45]/45 hover:text-[#D7FF45]">+ Add music</button>
            ) : timeline.musicTracks.map((track) => {
              const left = (track.startTime / duration) * 100;
              const width = (track.duration / duration) * 100;
              const selected = selectedMusicTrackId === track.id;
              return (
                <div key={track.id} className={`absolute inset-y-2 rounded-md border text-[9px] font-semibold ${selected ? "border-[#D7FF45] bg-[#D7FF45]/12 text-[#E9FF9E]" : "border-[#D7FF45]/25 bg-[#D7FF45]/[0.06] text-[#D7FF45]/70"}`} style={{ left: `${left}%`, width: `${width}%` }} onPointerDown={(event) => { setSelectedMusicTrack(track.id); beginTimedDrag(event, track.id, track.startTime, track.duration, "move", "music"); }}>
                  <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, track.id, track.startTime, track.duration, "resize-start", "music")} />
                  <div className="pointer-events-none flex h-full items-center gap-1 truncate px-2"><span>♫</span><span>{track.name}</span><span className="ml-1 opacity-45">No audio uploaded</span></div>
                  <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, track.id, track.startTime, track.duration, "resize-end", "music")} />
                </div>
              );
            })}
          </div>
        </div>

        {snapGuide !== null && (
          <div className="pointer-events-none absolute bottom-0 left-[132px] right-0 top-8 z-20">
            <div className="absolute bottom-0 top-0 w-px bg-[#8067FF] shadow-[0_0_8px_rgba(128,103,255,0.7)]" style={{ left: `${(snapGuide / duration) * 100}%` }} />
          </div>
        )}

        <div className="pointer-events-none absolute bottom-0 left-[132px] right-0 top-0 z-30">
          <div className="absolute bottom-0 top-0 w-[2px] bg-[#D7FF45] shadow-[0_0_10px_rgba(215,255,69,0.18)]" style={{ left: `${(currentTime / duration) * 100}%` }}>
            <div className="absolute -left-[4px] top-0 h-3 w-[10px] rounded-b border border-[#D7FF45] bg-[#0B0B0F]" />
          </div>
        </div>
      </div>

      {selectedComponentId && (
        <div className="flex h-7 items-center justify-end border-t border-white/10 bg-[#101015] px-3">
          <button onClick={deleteSelectedComponent} className="text-[10px] text-white/30 hover:text-red-300">Delete selected component</button>
        </div>
      )}
    </section>
  );
}
