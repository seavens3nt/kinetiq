"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AddableComponentType } from "@/store/editor-store";
import { useEditorStore } from "@/store/editor-store";

const LABEL_WIDTH = 164;
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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [snapGuide, setSnapGuide] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const {
    project,
    currentTime,
    isPlaying,
    selectedLayerId,
    selectedComponentId,
    selectedComponentIds,
    selectedMusicTrackId,
    snapEnabled,
    pastProjects,
    futureProjects,
    clipboard,
    setCurrentTime,
    nudgePlayhead,
    togglePlayback,
    replay,
    setSelectedLayer,
    setSelectedComponent,
    setSelectedMusicTrack,
    clearSelection,
    setComponentTiming,
    setMusicTiming,
    setSceneDuration,
    addLayer,
    addComponentToSelectedLayer,
    addMusicTrack,
    deleteSelection,
    rippleDeleteSelection,
    duplicateSelection,
    copySelection,
    pasteClipboard,
    splitSelectionAtPlayhead,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayer,
    toggleMusicMute,
    toggleMusicLock,
    addMarker,
    removeMarker,
    toggleSnap,
    checkpoint,
    undo,
    redo,
  } = useEditorStore();

  const timeline = project.scenes[0];
  const duration = timeline.durationInSeconds;
  const componentCount = timeline.layers.reduce((sum, layer) => sum + layer.components.length, 0);
  const hasSelection = Boolean(selectedComponentIds.length || selectedMusicTrackId);

  const ticks = useMemo(() => {
    const density = zoom >= 3 ? 0.25 : zoom >= 2 ? 0.5 : 1;
    const count = Math.ceil(duration / density);
    return Array.from({ length: count + 1 }, (_, index) => Number((index * density).toFixed(2)));
  }, [duration, zoom]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      const command = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (command && key === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if (command && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (command && key === "b") {
        event.preventDefault();
        splitSelectionAtPlayhead();
        return;
      }
      if (command && key === "d") {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (command && key === "c") {
        if (hasSelection) {
          event.preventDefault();
          copySelection();
        }
        return;
      }
      if (command && key === "v") {
        if (clipboard) {
          event.preventDefault();
          pasteClipboard();
        }
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (hasSelection) {
          event.preventDefault();
          event.shiftKey ? rippleDeleteSelection() : deleteSelection();
        }
        return;
      }
      if (event.key === "Escape") {
        clearSelection();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgePlayhead(event.shiftKey ? -5 : -1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgePlayhead(event.shiftKey ? 5 : 1);
        return;
      }
      if (key === "m") {
        event.preventDefault();
        addMarker();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addMarker, clearSelection, clipboard, copySelection, deleteSelection, duplicateSelection, hasSelection, nudgePlayhead, pasteClipboard, redo, rippleDeleteSelection, splitSelectionAtPlayhead, undo]);

  const pointerToTime = (clientX: number) => {
    const surface = surfaceRef.current;
    if (!surface) return 0;
    const rect = surface.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    return (x / Math.max(1, rect.width)) * duration;
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
      ...timeline.markers.map((marker) => marker.time),
      ...layer.components
        .filter((component) => component.id !== componentId)
        .flatMap((component) => [component.startTime, component.startTime + component.duration]),
    ];
  };

  const snapValue = (value: number, points: number[]) => {
    if (!snapEnabled) return value;
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
    checkpoint();
    const startPointerTime = pointerToTime(event.clientX);
    const points = kind === "component" ? componentSnapPoints(itemId) : [0, duration, ...timeline.markers.map((marker) => marker.time)];

    const apply = (startTime: number, itemDuration: number) => {
      kind === "component" ? setComponentTiming(itemId, startTime, itemDuration) : setMusicTiming(itemId, startTime, itemDuration);
    };

    const guideIfSnapped = (raw: number, snapped: number) => {
      setSnapGuide(snapEnabled && Math.abs(raw - snapped) <= SNAP_THRESHOLD ? snapped : null);
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = pointerToTime(moveEvent.clientX) - startPointerTime;

      if (mode === "move") {
        const rawStart = clamp(originalStart + delta, 0, duration - originalDuration);
        const snappedStart = snapValue(rawStart, points);
        const rawEnd = rawStart + originalDuration;
        const snappedEnd = snapValue(rawEnd, points);
        if (Math.abs(snappedStart - rawStart) <= Math.abs(snappedEnd - rawEnd)) {
          guideIfSnapped(rawStart, snappedStart);
          apply(clamp(snappedStart, 0, duration - originalDuration), originalDuration);
        } else {
          guideIfSnapped(rawEnd, snappedEnd);
          apply(clamp(snappedEnd - originalDuration, 0, duration - originalDuration), originalDuration);
        }
      } else if (mode === "resize-start") {
        const rawStart = clamp(originalStart + delta, 0, originalStart + originalDuration - 0.1);
        const nextStart = snapValue(rawStart, points);
        guideIfSnapped(rawStart, nextStart);
        apply(nextStart, originalDuration + (originalStart - nextStart));
      } else {
        const rawEnd = clamp(originalStart + originalDuration + delta, originalStart + 0.1, duration);
        const nextEnd = snapValue(rawEnd, points);
        guideIfSnapped(rawEnd, nextEnd);
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

  const toolButton = "grid h-7 min-w-7 place-items-center rounded-md border border-white/10 bg-white/[0.025] px-1.5 text-[10px] text-white/45 transition hover:border-[#8067FF]/50 hover:bg-[#8067FF]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25";

  const rowLabels = (
    <div className="bg-[#101015]">
      <div className="sticky top-0 z-40 flex h-9 items-center justify-between border-b border-r border-white/10 bg-[#0D0D12] px-3 text-white/25">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">Tracks</span>
        <span className="text-[9px]">{componentCount}</span>
      </div>

      <div className="flex h-11 items-center gap-2 border-b border-r border-white/10 px-3 text-[10px] text-white/35">
        <span className="grid h-5 w-5 place-items-center rounded bg-white/[0.04]">BG</span>Canvas
      </div>

      {timeline.layers.map((layer, layerIndex) => {
        const isLayerSelected = selectedLayerId === layer.id;
        return (
          <div key={layer.id} className={`flex h-11 items-center gap-1 border-b border-r border-white/10 px-1.5 ${isLayerSelected ? "bg-[#D7FF45]/[0.05]" : ""} ${layer.visible ? "" : "opacity-45"}`}>
            <button type="button" onClick={() => setSelectedLayer(layer.id)} className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[9px] ${isLayerSelected ? "bg-[#D7FF45]/10 text-[#D7FF45]" : "bg-white/[0.04] text-white/40"}`}>{layerIndex + 1}</button>
            <button type="button" onClick={() => setSelectedLayer(layer.id)} className={`min-w-0 flex-1 truncate text-left text-[10px] ${isLayerSelected ? "text-[#D7FF45]" : "text-white/45"}`}>{layer.name}</button>
            <div className="flex shrink-0 items-center">
              <button type="button" title="Move track up" disabled={layerIndex === 0} onClick={() => moveLayer(layer.id, -1)} className="grid h-5 w-4 place-items-center text-[8px] text-white/25 hover:text-[#D7FF45] disabled:opacity-15">↑</button>
              <button type="button" title="Move track down" disabled={layerIndex === timeline.layers.length - 1} onClick={() => moveLayer(layer.id, 1)} className="grid h-5 w-4 place-items-center text-[8px] text-white/25 hover:text-[#D7FF45] disabled:opacity-15">↓</button>
              <button type="button" title={layer.visible ? "Hide track" : "Show track"} onClick={() => toggleLayerVisibility(layer.id)} className="grid h-6 w-5 place-items-center rounded text-[9px] text-white/35 hover:text-white">{layer.visible ? "◉" : "○"}</button>
              <button type="button" title={layer.locked ? "Unlock track" : "Lock track"} onClick={() => toggleLayerLock(layer.id)} className={`grid h-6 w-5 place-items-center rounded text-[9px] ${layer.locked ? "text-[#D7FF45]" : "text-white/30"}`}>{layer.locked ? "▣" : "▢"}</button>
            </div>
          </div>
        );
      })}

      {timeline.musicTracks.length === 0 ? (
        <div className="flex h-12 items-center gap-2 border-b border-r border-white/10 px-3 text-[10px] text-[#D7FF45]/70">
          <span className="grid h-5 w-5 place-items-center rounded bg-[#D7FF45]/10">♫</span>Music
        </div>
      ) : timeline.musicTracks.map((track) => {
        const selected = selectedMusicTrackId === track.id;
        return (
          <div key={track.id} className="flex h-12 items-center gap-1.5 border-b border-r border-white/10 px-2">
            <button type="button" onClick={() => setSelectedMusicTrack(track.id)} className={`min-w-0 flex-1 truncate text-left text-[10px] ${selected ? "text-[#D7FF45]" : "text-[#D7FF45]/60"}`}>♫ {track.name}</button>
            <button type="button" title={track.muted ? "Unmute" : "Mute"} onClick={() => toggleMusicMute(track.id)} className={`grid h-6 w-6 place-items-center rounded text-[9px] ${track.muted ? "text-red-300" : "text-white/30"}`}>{track.muted ? "M×" : "M"}</button>
            <button type="button" title={track.locked ? "Unlock" : "Lock"} onClick={() => toggleMusicLock(track.id)} className={`grid h-6 w-6 place-items-center rounded text-[9px] ${track.locked ? "text-[#D7FF45]" : "text-white/30"}`}>{track.locked ? "▣" : "▢"}</button>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0B0B0F] text-[#F7F7F4]">
      <div className="relative flex h-11 items-center border-b border-white/10 bg-[#101015] px-3">
        <div className="flex items-center gap-1.5">
          <button type="button" title="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={pastProjects.length === 0} className={toolButton}>↶</button>
          <button type="button" title="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={futureProjects.length === 0} className={toolButton}>↷</button>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button type="button" title="Split at playhead (Ctrl/Cmd+B)" onClick={splitSelectionAtPlayhead} disabled={!hasSelection} className={toolButton}>✂</button>
          <button type="button" title="Delete selected" onClick={deleteSelection} disabled={!hasSelection} className={toolButton}>⌫</button>
          <button type="button" title="Ripple delete (Shift+Delete)" onClick={rippleDeleteSelection} disabled={!hasSelection} className={toolButton}>⇤</button>
          <button type="button" title="Duplicate (Ctrl/Cmd+D)" onClick={duplicateSelection} disabled={!hasSelection} className={toolButton}>⧉</button>
          <button type="button" title="Copy (Ctrl/Cmd+C)" onClick={copySelection} disabled={!hasSelection} className={toolButton}>C</button>
          <button type="button" title="Paste at playhead (Ctrl/Cmd+V)" onClick={pasteClipboard} disabled={!clipboard} className={toolButton}>V</button>
          <button type="button" title="Add marker (M)" onClick={addMarker} className={toolButton}>◆</button>
          <button type="button" title="Previous frame" onClick={() => nudgePlayhead(-1)} className={toolButton}>‹</button>
          <button type="button" title="Next frame" onClick={() => nudgePlayhead(1)} className={toolButton}>›</button>
          <button type="button" title="Toggle snapping" onClick={toggleSnap} className={`${toolButton} ${snapEnabled ? "border-[#D7FF45]/40 bg-[#D7FF45]/10 text-[#D7FF45]" : ""}`}>⌁</button>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <button type="button" onClick={togglePlayback} className="grid h-7 w-7 place-items-center rounded-full bg-[#D7FF45] text-[10px] font-black text-[#0B0B0F] shadow-[0_0_18px_rgba(215,255,69,0.18)]">{isPlaying ? "Ⅱ" : "▶"}</button>
          <span className="text-[11px] font-semibold tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-[11px] tabular-nums text-white/30">| {formatTime(duration)}</span>
          <button onClick={replay} className="ml-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55 hover:border-[#D7FF45]/40 hover:text-[#D7FF45]">Replay</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 xl:flex">
            <button type="button" title="Zoom out" onClick={() => setZoom((value) => clamp(Number((value - 0.25).toFixed(2)), 1, 4))} className={toolButton}>−</button>
            <input aria-label="Timeline zoom" type="range" min="1" max="4" step="0.25" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-20 accent-[#8067FF]" />
            <button type="button" title="Zoom in" onClick={() => setZoom((value) => clamp(Number((value + 0.25).toFixed(2)), 1, 4))} className={toolButton}>+</button>
            <button type="button" title="Fit timeline" onClick={() => { setZoom(1); horizontalRef.current?.scrollTo({ left: 0, behavior: "smooth" }); }} className={toolButton}>{Math.round(zoom * 100)}%</button>
          </div>
          <label className="hidden items-center gap-1 text-[10px] text-white/35 2xl:flex">
            Length
            <input type="number" min="1" step="0.5" value={duration} onChange={(event) => setSceneDuration(Number(event.target.value) || 1)} className="w-14 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] outline-none focus:border-[#D7FF45]/50" />s
          </label>
          <div className="relative">
            <button type="button" onClick={() => setAddMenuOpen((value) => !value)} className="rounded-md border border-[#8067FF]/40 bg-[#8067FF]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#BDB2FF] hover:border-[#D7FF45]/50 hover:text-[#D7FF45]">+ Add</button>
            {addMenuOpen && (
              <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[#14141B] p-2 shadow-2xl">
                <div className="px-2 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">New layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(componentMeta) as AddableComponentType[]).map((type) => (
                    <button key={type} onClick={() => newLayer(type)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-white/65 hover:bg-white/[0.05] hover:text-white"><span className="grid h-5 w-5 place-items-center rounded bg-[#8067FF]/15 text-[#BDB2FF]">{componentMeta[type].icon}</span>{componentMeta[type].label}</button>
                  ))}
                </div>
                <div className="my-2 border-t border-white/10" />
                <div className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Add to selected layer</div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(componentMeta) as AddableComponentType[]).map((type) => (
                    <button key={type} onClick={() => addToLayer(type)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-white/55 hover:bg-white/[0.05] hover:text-[#D7FF45]"><span>{componentMeta[type].icon}</span>{componentMeta[type].label}</button>
                  ))}
                </div>
                <div className="my-2 border-t border-white/10" />
                <button onClick={() => { addMusicTrack(); setAddMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-medium text-[#D7FF45] hover:bg-[#D7FF45]/[0.06]"><span className="grid h-5 w-5 place-items-center rounded bg-[#D7FF45]/10">♫</span>Add music track</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[320px] min-h-[224px] overflow-y-auto bg-[#0D0D12]">
        <div className="grid" style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}>
          {rowLabels}

          <div ref={horizontalRef} className="overflow-x-auto overflow-y-hidden">
            <div
              ref={surfaceRef}
              className="relative min-w-full select-none"
              style={{ width: `${zoom * 100}%` }}
              onPointerDown={beginPlayheadDrag}
              onPointerMove={movePlayhead}
            >
              <div className="sticky top-0 z-30 h-9 border-b border-white/10 bg-[#0D0D12]">
                {ticks.map((tick) => (
                  <div key={tick} className="absolute top-0 h-full border-l border-white/[0.08]" style={{ left: `${(tick / duration) * 100}%` }}>
                    <span className="absolute left-1 top-1.5 whitespace-nowrap text-[9px] tabular-nums text-white/30">{formatTime(tick).slice(0, 5)}</span>
                  </div>
                ))}
                {timeline.markers.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    title={`${marker.label} · ${formatTime(marker.time)} · double-click to remove`}
                    onClick={(event) => { event.stopPropagation(); setCurrentTime(marker.time); }}
                    onDoubleClick={(event) => { event.stopPropagation(); removeMarker(marker.id); }}
                    className="absolute top-0 z-40 -translate-x-1/2 text-[10px] text-[#8067FF] hover:text-[#D7FF45]"
                    style={{ left: `${(marker.time / duration) * 100}%` }}
                  >◆</button>
                ))}
              </div>

              <div className="relative h-11 border-b border-white/10 bg-[#121219]">
                <div className="absolute inset-y-1.5 left-0 right-0 rounded-md border border-white/[0.05] bg-white/[0.035] px-3 text-[10px] leading-8 text-white/25">Background · {timeline.backgroundPresetId}</div>
              </div>

              {timeline.layers.map((layer) => (
                <div key={layer.id} className={`relative h-11 border-b border-white/10 bg-[#0F0F14] ${layer.visible ? "" : "opacity-45"} ${layer.locked ? "cursor-not-allowed" : ""}`}>
                  {layer.components.map((component) => {
                    const left = (component.startTime / duration) * 100;
                    const width = (component.duration / duration) * 100;
                    const isSelected = selectedComponentIds.includes(component.id);
                    const isPrimary = selectedComponentId === component.id;
                    const meta = componentMeta[component.type];
                    return (
                      <div
                        key={component.id}
                        className={`absolute inset-y-2 rounded-md border text-[9px] font-semibold transition ${isSelected ? "z-10 border-[#D7FF45] bg-[#D7FF45]/16 text-[#E9FF9E]" : "border-[#8067FF]/50 bg-[#8067FF]/18 text-[#CEC7FF] hover:bg-[#8067FF]/24"} ${isPrimary ? "shadow-[0_0_0_1px_rgba(215,255,69,0.22)]" : ""} ${layer.locked ? "pointer-events-none opacity-60" : ""}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onPointerDown={(event) => {
                          const additive = event.shiftKey || event.metaKey || event.ctrlKey;
                          setSelectedComponent(component.id, layer.id, additive);
                          if (!additive) beginTimedDrag(event, component.id, component.startTime, component.duration, "move", "component");
                          else event.stopPropagation();
                        }}
                      >
                        <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, component.id, component.startTime, component.duration, "resize-start", "component")} />
                        <div className="pointer-events-none flex h-full items-center gap-1 truncate px-2"><span>{meta.icon}</span><span className="truncate">{component.name}</span></div>
                        <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, component.id, component.startTime, component.duration, "resize-end", "component")} />
                      </div>
                    );
                  })}
                </div>
              ))}

              {timeline.musicTracks.length === 0 ? (
                <div className="relative h-12 border-b border-white/10 bg-[#0C0C11]">
                  <button type="button" onClick={(event) => { event.stopPropagation(); addMusicTrack(); }} className="absolute inset-y-1.5 left-2 rounded-md border border-dashed border-[#D7FF45]/20 px-3 text-[9px] text-white/25 hover:border-[#D7FF45]/45 hover:text-[#D7FF45]">+ Add music</button>
                </div>
              ) : timeline.musicTracks.map((track) => {
                const left = (track.startTime / duration) * 100;
                const width = (track.duration / duration) * 100;
                const selected = selectedMusicTrackId === track.id;
                return (
                  <div key={track.id} className={`relative h-12 border-b border-white/10 bg-[#0C0C11] ${track.locked ? "cursor-not-allowed" : ""}`}>
                    <div
                      className={`absolute inset-y-2 rounded-md border text-[9px] font-semibold ${selected ? "border-[#D7FF45] bg-[#D7FF45]/12 text-[#E9FF9E]" : "border-[#D7FF45]/25 bg-[#D7FF45]/[0.06] text-[#D7FF45]/70"} ${track.muted ? "opacity-40" : ""} ${track.locked ? "pointer-events-none" : ""}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onPointerDown={(event) => { setSelectedMusicTrack(track.id); beginTimedDrag(event, track.id, track.startTime, track.duration, "move", "music"); }}
                    >
                      <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, track.id, track.startTime, track.duration, "resize-start", "music")} />
                      <div className="pointer-events-none flex h-full items-center gap-1 truncate px-2"><span>♫</span><span>{track.name}</span><span className="ml-1 opacity-45">No audio uploaded</span></div>
                      <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(event) => beginTimedDrag(event, track.id, track.startTime, track.duration, "resize-end", "music")} />
                    </div>
                  </div>
                );
              })}

              {snapGuide !== null && (
                <div className="pointer-events-none absolute bottom-0 top-9 z-20 w-px bg-[#8067FF] shadow-[0_0_8px_rgba(128,103,255,0.7)]" style={{ left: `${(snapGuide / duration) * 100}%` }} />
              )}

              <div className="pointer-events-none absolute bottom-0 top-0 z-30 w-[2px] bg-[#D7FF45] shadow-[0_0_10px_rgba(215,255,69,0.18)]" style={{ left: `${(currentTime / duration) * 100}%` }}>
                <div className="absolute -left-[4px] top-0 h-3 w-[10px] rounded-b border border-[#D7FF45] bg-[#0B0B0F]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-7 items-center justify-between border-t border-white/10 bg-[#101015] px-3 text-[9px] text-white/25">
        <span>{selectedComponentIds.length > 1 ? `${selectedComponentIds.length} clips selected` : hasSelection ? "1 clip selected" : "Shift-click clips to multi-select"}</span>
        <span>Shift+Delete ripple · Ctrl/Cmd+C/V copy/paste · Esc clear selection</span>
      </div>
    </section>
  );
}
