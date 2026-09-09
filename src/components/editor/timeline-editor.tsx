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

  const store = useEditorStore();
  const {
    project, currentTime, isPlaying, selectedLayerId, selectedComponentId, selectedComponentIds,
    selectedMusicTrackId, snapEnabled, pastProjects, futureProjects, clipboard,
    setCurrentTime, nudgePlayhead, togglePlayback, replay, setSelectedLayer, setSelectedComponent,
    setSelectedMusicTrack, clearSelection, setComponentTiming, setMusicTiming, setSceneDuration,
    addLayer, addComponentToSelectedLayer, addMusicTrack, deleteSelection, rippleDeleteSelection,
    duplicateSelection, copySelection, pasteClipboard, splitSelectionAtPlayhead, toggleLayerVisibility,
    toggleLayerLock, moveLayer, toggleMusicMute, toggleMusicLock, addMarker, removeMarker, toggleSnap,
    checkpoint, undo, redo,
  } = store;

  const timeline = project.scenes[0];
  const duration = timeline.durationInSeconds;
  const componentCount = timeline.layers.reduce((sum, layer) => sum + layer.components.length, 0);
  const hasSelection = Boolean(selectedComponentIds.length || selectedMusicTrackId);

  const ticks = useMemo(() => {
    const density = zoom >= 3 ? 0.25 : zoom >= 2 ? 0.5 : 1;
    return Array.from({ length: Math.ceil(duration / density) + 1 }, (_, index) => Number((index * density).toFixed(2)));
  }, [duration, zoom]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
      const command = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (command && key === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if (command && key === "y") { event.preventDefault(); redo(); return; }
      if (command && key === "b") { event.preventDefault(); splitSelectionAtPlayhead(); return; }
      if (command && key === "d") { event.preventDefault(); duplicateSelection(); return; }
      if (command && key === "c") { if (hasSelection) { event.preventDefault(); copySelection(); } return; }
      if (command && key === "v") { if (clipboard) { event.preventDefault(); pasteClipboard(); } return; }
      if (event.key === "Delete" || event.key === "Backspace") { if (hasSelection) { event.preventDefault(); event.shiftKey ? rippleDeleteSelection() : deleteSelection(); } return; }
      if (event.key === "Escape") { clearSelection(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); nudgePlayhead(event.shiftKey ? -5 : -1); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); nudgePlayhead(event.shiftKey ? 5 : 1); return; }
      if (key === "m") { event.preventDefault(); addMarker(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addMarker, clearSelection, clipboard, copySelection, deleteSelection, duplicateSelection, hasSelection, nudgePlayhead, pasteClipboard, redo, rippleDeleteSelection, splitSelectionAtPlayhead, undo]);

  const pointerToTime = (clientX: number) => {
    const surface = surfaceRef.current;
    if (!surface) return 0;
    const rect = surface.getBoundingClientRect();
    return (clamp(clientX - rect.left, 0, rect.width) / Math.max(1, rect.width)) * duration;
  };

  const beginPlayheadDrag = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentTime(pointerToTime(event.clientX));
  };

  const movePlayhead = (event: React.PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) setCurrentTime(pointerToTime(event.clientX));
  };

  const snapValue = (value: number, points: number[]) => {
    if (!snapEnabled) return value;
    let best = value;
    let distance = SNAP_THRESHOLD;
    for (const point of points) {
      const nextDistance = Math.abs(value - point);
      if (nextDistance <= distance) { best = point; distance = nextDistance; }
    }
    return best;
  };

  const componentSnapPoints = (componentId: string) => {
    const layer = timeline.layers.find((item) => item.components.some((component) => component.id === componentId));
    return [0, duration, ...timeline.markers.map((marker) => marker.time), ...(layer?.components.filter((component) => component.id !== componentId).flatMap((component) => [component.startTime, component.startTime + component.duration]) ?? [])];
  };

  const beginTimedDrag = (event: React.PointerEvent, itemId: string, originalStart: number, originalDuration: number, mode: "move" | "resize-start" | "resize-end", kind: "component" | "music") => {
    event.stopPropagation();
    checkpoint();
    const pointerStart = pointerToTime(event.clientX);
    const points = kind === "component" ? componentSnapPoints(itemId) : [0, duration, ...timeline.markers.map((marker) => marker.time)];
    const apply = (start: number, itemDuration: number) => kind === "component" ? setComponentTiming(itemId, start, itemDuration) : setMusicTiming(itemId, start, itemDuration);

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pointerToTime(moveEvent.clientX) - pointerStart;
      if (mode === "move") {
        const rawStart = clamp(originalStart + delta, 0, duration - originalDuration);
        const startSnap = snapValue(rawStart, points);
        const rawEnd = rawStart + originalDuration;
        const endSnap = snapValue(rawEnd, points);
        const useStart = Math.abs(startSnap - rawStart) <= Math.abs(endSnap - rawEnd);
        const guide = useStart ? startSnap : endSnap;
        setSnapGuide(snapEnabled && Math.abs((useStart ? rawStart : rawEnd) - guide) <= SNAP_THRESHOLD ? guide : null);
        apply(useStart ? clamp(startSnap, 0, duration - originalDuration) : clamp(endSnap - originalDuration, 0, duration - originalDuration), originalDuration);
      } else if (mode === "resize-start") {
        const raw = clamp(originalStart + delta, 0, originalStart + originalDuration - 0.1);
        const next = snapValue(raw, points);
        setSnapGuide(snapEnabled && Math.abs(raw - next) <= SNAP_THRESHOLD ? next : null);
        apply(next, originalDuration + (originalStart - next));
      } else {
        const raw = clamp(originalStart + originalDuration + delta, originalStart + 0.1, duration);
        const next = snapValue(raw, points);
        setSnapGuide(snapEnabled && Math.abs(raw - next) <= SNAP_THRESHOLD ? next : null);
        apply(originalStart, next - originalStart);
      }
    };

    const onUp = () => {
      setSnapGuide(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const toolButton = "grid h-7 min-w-7 place-items-center rounded-md border border-white/10 bg-white/[0.025] px-1.5 text-[10px] text-white/45 transition hover:border-[#8067FF]/50 hover:bg-[#8067FF]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25";

  const labels = (
    <div className="bg-[#101015]">
      <div className="sticky top-0 z-40 flex h-9 items-center justify-between border-b border-r border-white/10 bg-[#0D0D12] px-3"><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25">Tracks</span><span className="text-[9px] text-white/25">{componentCount}</span></div>
      <div className="flex h-11 items-center gap-2 border-b border-r border-white/10 px-3 text-[10px] text-white/35"><span className="grid h-5 w-5 place-items-center rounded bg-white/[0.04]">BG</span>Canvas</div>
      {timeline.layers.map((layer, index) => <div key={layer.id} className={`flex h-11 items-center gap-1 border-b border-r border-white/10 px-1.5 ${selectedLayerId === layer.id ? "bg-[#D7FF45]/[0.05]" : ""} ${layer.visible ? "" : "opacity-45"}`}>
        <button onClick={() => setSelectedLayer(layer.id)} className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[9px] ${selectedLayerId === layer.id ? "bg-[#D7FF45]/10 text-[#D7FF45]" : "bg-white/[0.04] text-white/40"}`}>{index + 1}</button>
        <button onClick={() => setSelectedLayer(layer.id)} className={`min-w-0 flex-1 truncate text-left text-[10px] ${selectedLayerId === layer.id ? "text-[#D7FF45]" : "text-white/45"}`}>{layer.name}</button>
        <button title="Move up" disabled={index === 0} onClick={() => moveLayer(layer.id, -1)} className="text-[8px] text-white/25 hover:text-[#D7FF45] disabled:opacity-15">↑</button>
        <button title="Move down" disabled={index === timeline.layers.length - 1} onClick={() => moveLayer(layer.id, 1)} className="text-[8px] text-white/25 hover:text-[#D7FF45] disabled:opacity-15">↓</button>
        <button title={layer.visible ? "Hide track" : "Show track"} onClick={() => toggleLayerVisibility(layer.id)} className="grid h-6 w-5 place-items-center text-[9px] text-white/35">{layer.visible ? "◉" : "○"}</button>
        <button title={layer.locked ? "Unlock" : "Lock"} onClick={() => toggleLayerLock(layer.id)} className={`grid h-6 w-5 place-items-center text-[9px] ${layer.locked ? "text-[#D7FF45]" : "text-white/30"}`}>{layer.locked ? "▣" : "▢"}</button>
      </div>)}
      {timeline.musicTracks.length === 0 ? <div className="flex h-12 items-center gap-2 border-b border-r border-white/10 px-3 text-[10px] text-[#D7FF45]/70"><span>♫</span>Music</div> : timeline.musicTracks.map((track) => <div key={track.id} className="flex h-12 items-center gap-1.5 border-b border-r border-white/10 px-2">
        <button onClick={() => setSelectedMusicTrack(track.id)} className={`min-w-0 flex-1 truncate text-left text-[10px] ${selectedMusicTrackId === track.id ? "text-[#D7FF45]" : "text-[#D7FF45]/60"}`}>♫ {track.name}</button>
        <button onClick={() => toggleMusicMute(track.id)} className={`text-[9px] ${track.muted ? "text-red-300" : "text-white/30"}`}>{track.muted ? "M×" : "M"}</button>
        <button onClick={() => toggleMusicLock(track.id)} className={`text-[9px] ${track.locked ? "text-[#D7FF45]" : "text-white/30"}`}>{track.locked ? "▣" : "▢"}</button>
      </div>)}
    </div>
  );

  return (
    <section className="shrink-0 border-t border-white/10 bg-[#0B0B0F] text-[#F7F7F4]">
      <div className="relative flex h-11 items-center border-b border-white/10 bg-[#101015] px-3">
        <div className="flex items-center gap-1.5">
          <button title="Undo" onClick={undo} disabled={!pastProjects.length} className={toolButton}>↶</button><button title="Redo" onClick={redo} disabled={!futureProjects.length} className={toolButton}>↷</button><div className="mx-1 h-5 w-px bg-white/10" />
          <button title="Split" onClick={splitSelectionAtPlayhead} disabled={!hasSelection} className={toolButton}>✂</button><button title="Delete" onClick={deleteSelection} disabled={!hasSelection} className={toolButton}>⌫</button><button title="Ripple delete" onClick={rippleDeleteSelection} disabled={!hasSelection} className={toolButton}>⇤</button><button title="Duplicate" onClick={duplicateSelection} disabled={!hasSelection} className={toolButton}>⧉</button><button title="Copy" onClick={copySelection} disabled={!hasSelection} className={toolButton}>C</button><button title="Paste" onClick={pasteClipboard} disabled={!clipboard} className={toolButton}>V</button><button title="Marker" onClick={addMarker} className={toolButton}>◆</button><button title="Previous frame" onClick={() => nudgePlayhead(-1)} className={toolButton}>‹</button><button title="Next frame" onClick={() => nudgePlayhead(1)} className={toolButton}>›</button><button title="Snapping" onClick={toggleSnap} className={`${toolButton} ${snapEnabled ? "border-[#D7FF45]/40 bg-[#D7FF45]/10 text-[#D7FF45]" : ""}`}>⌁</button>
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"><button onClick={togglePlayback} className="grid h-7 w-7 place-items-center rounded-full bg-[#D7FF45] text-[10px] font-black text-[#0B0B0F]">{isPlaying ? "Ⅱ" : "▶"}</button><span className="text-[11px] font-semibold tabular-nums">{formatTime(currentTime)}</span><span className="text-[11px] text-white/30">| {formatTime(duration)}</span><button onClick={replay} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/55">Replay</button></div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 xl:flex"><button onClick={() => setZoom((v) => clamp(v - .25, 1, 4))} className={toolButton}>−</button><input type="range" min="1" max="4" step=".25" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-20 accent-[#8067FF]" /><button onClick={() => setZoom((v) => clamp(v + .25, 1, 4))} className={toolButton}>+</button><button onClick={() => { setZoom(1); horizontalRef.current?.scrollTo({ left: 0 }); }} className={toolButton}>{Math.round(zoom * 100)}%</button></div>
          <label className="hidden items-center gap-1 text-[10px] text-white/35 2xl:flex">Length<input type="number" min="1" step=".5" value={duration} onChange={(e) => setSceneDuration(Number(e.target.value) || 1)} className="w-14 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1" />s</label>
          <div className="relative"><button onClick={() => setAddMenuOpen((v) => !v)} className="rounded-md border border-[#8067FF]/40 bg-[#8067FF]/10 px-2.5 py-1.5 text-[10px] font-semibold text-[#BDB2FF]">+ Add</button>{addMenuOpen && <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-white/10 bg-[#14141B] p-2 shadow-2xl"><div className="px-2 pb-1 text-[9px] uppercase tracking-[.16em] text-white/30">New layer</div><div className="grid grid-cols-2 gap-1">{(Object.keys(componentMeta) as AddableComponentType[]).map((type) => <button key={type} onClick={() => { addLayer(type); setAddMenuOpen(false); }} className="rounded-lg px-2 py-2 text-left text-[10px] text-white/65 hover:bg-white/[.05]">{componentMeta[type].icon} {componentMeta[type].label}</button>)}</div><div className="my-2 border-t border-white/10" /><div className="px-2 pb-1 text-[9px] uppercase tracking-[.16em] text-white/30">Add to selected layer</div><div className="grid grid-cols-2 gap-1">{(Object.keys(componentMeta) as AddableComponentType[]).map((type) => <button key={type} onClick={() => { addComponentToSelectedLayer(type); setAddMenuOpen(false); }} className="rounded-lg px-2 py-2 text-left text-[10px] text-white/55 hover:bg-white/[.05]">{componentMeta[type].icon} {componentMeta[type].label}</button>)}</div><div className="my-2 border-t border-white/10" /><button onClick={() => { addMusicTrack(); setAddMenuOpen(false); }} className="w-full rounded-lg px-2 py-2 text-left text-[10px] text-[#D7FF45]">♫ Add music track</button></div>}</div>
        </div>
      </div>

      <div className="max-h-[320px] min-h-[224px] overflow-y-auto bg-[#0D0D12]">
        <div className="grid" style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}>
          {labels}
          <div ref={horizontalRef} className="overflow-x-auto overflow-y-hidden">
            <div ref={surfaceRef} className="relative min-w-full select-none" style={{ width: `${zoom * 100}%` }} onPointerDown={beginPlayheadDrag} onPointerMove={movePlayhead}>
              <div className="sticky top-0 z-30 h-9 border-b border-white/10 bg-[#0D0D12]">{ticks.map((tick) => <div key={tick} className="absolute top-0 h-full border-l border-white/[.08]" style={{ left: `${tick / duration * 100}%` }}><span className="absolute left-1 top-1.5 text-[9px] text-white/30">{formatTime(tick).slice(0,5)}</span></div>)}{timeline.markers.map((marker) => <button key={marker.id} title={`${marker.label} · double-click to remove`} onClick={(e) => { e.stopPropagation(); setCurrentTime(marker.time); }} onDoubleClick={(e) => { e.stopPropagation(); removeMarker(marker.id); }} className="absolute top-0 z-40 -translate-x-1/2 text-[10px] text-[#8067FF] hover:text-[#D7FF45]" style={{ left: `${marker.time / duration * 100}%` }}>◆</button>)}</div>
              <div className="relative h-11 border-b border-white/10 bg-[#121219]"><div className="absolute inset-y-1.5 left-0 right-0 rounded-md border border-white/[.05] bg-white/[.035] px-3 text-[10px] leading-8 text-white/25">Background · {timeline.backgroundPresetId}</div></div>

              {timeline.layers.map((layer) => <div key={layer.id} className={`relative h-11 border-b border-white/10 bg-[#0F0F14] ${layer.visible ? "" : "opacity-45"}`}>
                {layer.components.map((component) => {
                  const selected = selectedComponentIds.includes(component.id);
                  const left = component.startTime / duration * 100;
                  const width = component.duration / duration * 100;
                  const meta = componentMeta[component.type];
                  return <div key={component.id} className={`absolute inset-y-2 rounded-md border text-[9px] font-semibold ${selected ? "z-10 border-[#D7FF45] bg-[#D7FF45]/16 text-[#E9FF9E]" : "border-[#8067FF]/50 bg-[#8067FF]/18 text-[#CEC7FF]"} ${layer.locked ? "pointer-events-none opacity-60" : ""}`} style={{ left: `${left}%`, width: `${width}%` }} onPointerDown={(e) => { const additive = e.shiftKey || e.metaKey || e.ctrlKey; setSelectedComponent(component.id, layer.id, additive); if (!additive) beginTimedDrag(e, component.id, component.startTime, component.duration, "move", "component"); else e.stopPropagation(); }}>
                    {component.transitionIn?.type && component.transitionIn.type !== "none" && <div className="pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-md bg-gradient-to-r from-[#D7FF45]/30 to-transparent" title={`In: ${component.transitionIn.type}`} />}
                    {component.transitionOut?.type && component.transitionOut.type !== "none" && <div className="pointer-events-none absolute inset-y-0 right-0 w-3 rounded-r-md bg-gradient-to-l from-[#D7FF45]/30 to-transparent" title={`Out: ${component.transitionOut.type}`} />}
                    <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginTimedDrag(e, component.id, component.startTime, component.duration, "resize-start", "component")} />
                    <div className="pointer-events-none flex h-full items-center gap-1 truncate px-2"><span>{meta.icon}</span><span className="truncate">{component.name}</span>{component.type === "video" && (component.playbackRate ?? 1) !== 1 && <span className="text-[#D7FF45]">{component.playbackRate}×</span>}</div>
                    {(component.keyframes ?? []).map((keyframe) => <div key={keyframe.id} className="pointer-events-none absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#D7FF45] bg-[#0B0B0F]" style={{ left: `${clamp(keyframe.time / component.duration * 100, 0, 100)}%` }} />)}
                    <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginTimedDrag(e, component.id, component.startTime, component.duration, "resize-end", "component")} />
                  </div>;
                })}
              </div>)}

              {timeline.musicTracks.length === 0 ? <div className="relative h-12 border-b border-white/10 bg-[#0C0C11]"><button onClick={(e) => { e.stopPropagation(); addMusicTrack(); }} className="absolute inset-y-1.5 left-2 rounded-md border border-dashed border-[#D7FF45]/20 px-3 text-[9px] text-white/25">+ Add music</button></div> : timeline.musicTracks.map((track) => <div key={track.id} className="relative h-12 border-b border-white/10 bg-[#0C0C11]">
                <div className={`absolute inset-y-2 overflow-hidden rounded-md border ${selectedMusicTrackId === track.id ? "border-[#D7FF45] bg-[#D7FF45]/12" : "border-[#D7FF45]/25 bg-[#D7FF45]/[.06]"} ${track.muted ? "opacity-40" : ""} ${track.locked ? "pointer-events-none" : ""}`} style={{ left: `${track.startTime / duration * 100}%`, width: `${track.duration / duration * 100}%` }} onPointerDown={(e) => { setSelectedMusicTrack(track.id); beginTimedDrag(e, track.id, track.startTime, track.duration, "move", "music"); }}>
                  <div className="absolute inset-y-0 left-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginTimedDrag(e, track.id, track.startTime, track.duration, "resize-start", "music")} />
                  <div className="pointer-events-none absolute inset-0 flex items-center gap-[2px] overflow-hidden px-2 opacity-55">{Array.from({ length: 64 }, (_, i) => <span key={i} className="w-px shrink-0 rounded-full bg-[#D7FF45]" style={{ height: `${20 + ((i * 17) % 70)}%` }} />)}</div>
                  <div className="pointer-events-none absolute inset-0 flex items-center px-2 text-[9px] font-semibold text-[#E9FF9E]"><span className="truncate">♫ {track.name}{track.src ? "" : " · no audio"}</span></div>
                  <div className="absolute inset-y-0 right-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginTimedDrag(e, track.id, track.startTime, track.duration, "resize-end", "music")} />
                </div>
              </div>)}

              {snapGuide !== null && <div className="pointer-events-none absolute bottom-0 top-9 z-20 w-px bg-[#8067FF]" style={{ left: `${snapGuide / duration * 100}%` }} />}
              <div className="pointer-events-none absolute bottom-0 top-0 z-30 w-[2px] bg-[#D7FF45]" style={{ left: `${currentTime / duration * 100}%` }}><div className="absolute -left-[4px] top-0 h-3 w-[10px] rounded-b border border-[#D7FF45] bg-[#0B0B0F]" /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-7 items-center justify-between border-t border-white/10 bg-[#101015] px-3 text-[9px] text-white/25"><span>{selectedComponentIds.length > 1 ? `${selectedComponentIds.length} clips selected` : hasSelection ? "1 clip selected" : "Shift-click clips to multi-select"}</span><span>◆ keyframes · lime clip edges = transitions · scroll horizontally when zoomed</span></div>
    </section>
  );
}
