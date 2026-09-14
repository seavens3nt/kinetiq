"use client";

import { useEffect, useRef, useState } from "react";
import { backgroundPresets, motionPresets } from "@/lib/presets";
import type { TransitionType, UIComponent, VisualComponent } from "@/lib/project-schema";
import { useEditorStore } from "@/store/editor-store";

type ToolId = "media" | "text" | "ui" | "elements" | "backgrounds" | "motion" | "transitions" | "audio";

const tools: Array<{ id: ToolId; icon: string; label: string }> = [
  { id: "media", icon: "▧", label: "Media" },
  { id: "text", icon: "T", label: "Text" },
  { id: "ui", icon: "▤", label: "UI" },
  { id: "elements", icon: "◇", label: "Elements" },
  { id: "backgrounds", icon: "▩", label: "Backgrounds" },
  { id: "motion", icon: "↗", label: "Motion" },
  { id: "transitions", icon: "⇄", label: "Transitions" },
  { id: "audio", icon: "♫", label: "Audio" },
];

const transitionOptions: Array<{ id: TransitionType; name: string; hint: string }> = [
  { id: "none", name: "None", hint: "No transition" },
  { id: "fade", name: "Fade", hint: "Clean opacity blend" },
  { id: "dissolve", name: "Dissolve", hint: "Soft scene blend" },
  { id: "slide", name: "Slide", hint: "Directional movement" },
  { id: "zoom", name: "Zoom", hint: "Scale into focus" },
];

const uiPresets: Array<{ preset: UIComponent["preset"]; label: string; hint: string }> = [
  { preset: "notification", label: "Notification", hint: "Toast / alert card" },
  { preset: "statistic", label: "Metric card", hint: "Number + supporting label" },
  { preset: "progress-card", label: "Progress card", hint: "Progress / loading UI" },
  { preset: "phone", label: "Phone frame", hint: "Mobile product mockup" },
  { preset: "browser", label: "Browser window", hint: "Web product frame" },
  { preset: "graph", label: "Graph", hint: "Simple analytics UI" },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function patchSelected(updater: (component: VisualComponent) => VisualComponent) {
  useEditorStore.setState((state) => {
    if (!state.selectedComponentId) return state;
    const scene = state.project.scenes[0];
    return {
      project: {
        ...state.project,
        scenes: [
          {
            ...scene,
            layers: scene.layers.map((layer) => ({
              ...layer,
              components: layer.components.map((component) =>
                component.id === state.selectedComponentId ? updater(component) : component,
              ),
            })),
          },
          ...state.project.scenes.slice(1),
        ],
      },
      replayKey: state.replayKey + 1,
    };
  });
}

function addConfiguredComponent(type: "text" | "shape" | "ui", configure?: (component: VisualComponent) => VisualComponent) {
  const store = useEditorStore.getState();
  store.addComponentToSelectedLayer(type);
  if (configure) patchSelected(configure);
}

export function PlaybackStartGuard() {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const currentTime = useEditorStore((state) => state.currentTime);
  const duration = useEditorStore((state) => state.project.scenes[0].durationInSeconds);
  const previous = useRef(false);

  useEffect(() => {
    if (isPlaying && !previous.current) {
      useEditorStore.setState((state) => {
        const atEnd = state.currentTime >= state.project.scenes[0].durationInSeconds - 0.02;
        const atStart = state.currentTime <= 0.02;
        if (!atEnd && !atStart) return state;
        return {
          currentTime: atEnd ? 0 : state.currentTime,
          replayKey: state.replayKey + 1,
        };
      });
    }
    previous.current = isPlaying;
  }, [isPlaying, currentTime, duration]);

  return null;
}

export function EditorToolBrowser() {
  const [active, setActive] = useState<ToolId>("text");
  const [collapsed, setCollapsed] = useState(false);
  const mediaRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const project = useEditorStore((state) => state.project);
  const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const selectedComponent = project.scenes[0].layers.flatMap((layer) => layer.components).find((component) => component.id === selectedComponentId) ?? null;
  const selectedText = selectedComponent?.type === "text" ? selectedComponent : null;
  const scene = project.scenes[0];

  useEffect(() => {
    document.documentElement.dataset.toolsCollapsed = String(collapsed);
    return () => {
      delete document.documentElement.dataset.toolsCollapsed;
    };
  }, [collapsed]);

  const importFiles = (files: FileList | null, audioOnly = false) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const src = URL.createObjectURL(file);
      if (file.type.startsWith("audio/")) {
        const state = useEditorStore.getState();
        state.addMusicTrack();
        const trackId = useEditorStore.getState().selectedMusicTrackId;
        if (!trackId) return;
        useEditorStore.setState((current) => {
          const currentScene = current.project.scenes[0];
          return {
            project: {
              ...current.project,
              scenes: [
                {
                  ...currentScene,
                  musicTracks: currentScene.musicTracks.map((track) => track.id === trackId ? {
                    ...track,
                    name: file.name,
                    src,
                    startTime: current.currentTime,
                    duration: Math.max(0.1, currentScene.durationInSeconds - current.currentTime),
                  } : track),
                },
                ...current.project.scenes.slice(1),
              ],
            },
          };
        });
        return;
      }

      if (audioOnly || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) return;
      const type = file.type.startsWith("image/") ? "image" : "video";
      const state = useEditorStore.getState();
      state.addComponentToSelectedLayer(type);
      patchSelected((component) => ({
        ...component,
        name: file.name,
        src,
        startTime: useEditorStore.getState().currentTime,
        duration: Math.max(0.1, Math.min(type === "video" ? 5 : 3, useEditorStore.getState().project.scenes[0].durationInSeconds - useEditorStore.getState().currentTime)),
      }) as VisualComponent);
    });
  };

  const applyUiPreset = (preset: UIComponent["preset"], label: string) => {
    addConfiguredComponent("ui", (component) => component.type === "ui" ? { ...component, preset, label, name: label } : component);
  };

  const setShape = (shape: "rectangle" | "circle" | "pill", fill: string, radius: number) => {
    addConfiguredComponent("shape", (component) => component.type === "shape" ? { ...component, shape, fill, radius } : component);
  };

  const setTransition = (which: "in" | "out", type: TransitionType) => {
    if (!selectedComponent) return;
    patchSelected((component) => ({
      ...component,
      [which === "in" ? "transitionIn" : "transitionOut"]: {
        type,
        duration: component[which === "in" ? "transitionIn" : "transitionOut"]?.duration ?? 0.35,
      },
    }) as VisualComponent);
  };

  const setTransitionDuration = (which: "in" | "out", duration: number) => {
    if (!selectedComponent) return;
    patchSelected((component) => {
      const key = which === "in" ? "transitionIn" : "transitionOut";
      const current = component[key] ?? { type: "fade" as TransitionType, duration: 0.35 };
      return { ...component, [key]: { ...current, duration } } as VisualComponent;
    });
  };

  return (
    <div className={`kinetiq-tool-browser ${collapsed ? "is-collapsed" : ""}`}>
      <input ref={mediaRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(event) => importFiles(event.target.files)} />
      <input ref={audioRef} type="file" multiple accept="audio/*" className="hidden" onChange={(event) => importFiles(event.target.files, true)} />

      <div className="kinetiq-tool-rail">
        <button type="button" className="kinetiq-tool-collapse" onClick={() => setCollapsed((value) => !value)} title={collapsed ? "Expand tools" : "Collapse tools"}>{collapsed ? "›" : "‹"}</button>
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => { setActive(tool.id); setCollapsed(false); }}
            className={`kinetiq-tool-tab ${active === tool.id && !collapsed ? "is-active" : ""}`}
            title={tool.label}
          >
            <span className="kinetiq-tool-icon">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {!collapsed && (
        <div className="kinetiq-tool-panel">
          <div className="kinetiq-tool-panel-header">
            <div><div className="kinetiq-tool-title">{tools.find((tool) => tool.id === active)?.label}</div><div className="kinetiq-tool-subtitle">Kinetiq library</div></div>
          </div>

          {active === "media" && <div className="kinetiq-tool-section">
            <button type="button" className="kinetiq-primary-tool" onClick={() => mediaRef.current?.click()}>＋ Import image or video</button>
            <div className="kinetiq-drop-card"><div className="text-lg">▧</div><div className="mt-2 text-[10px] font-semibold">Your media</div><div className="mt-1 text-[9px] opacity-55">Imported files become reusable timeline components.</div></div>
          </div>}

          {active === "text" && <div className="kinetiq-tool-section">
            <button type="button" className="kinetiq-primary-tool" onClick={() => addConfiguredComponent("text")}>＋ Add text</button>
            <div className="kinetiq-tool-group"><div className="kinetiq-group-label">Quick styles</div>
              {[{ label: "Heading", size: 96, weight: 800 }, { label: "Subtitle", size: 58, weight: 650 }, { label: "Caption", size: 34, weight: 500 }].map((item) => <button key={item.label} type="button" className="kinetiq-library-card" onClick={() => addConfiguredComponent("text", (component) => component.type === "text" ? { ...component, content: item.label, fontSize: item.size, fontWeight: item.weight } : component)}><span className="text-[12px] font-semibold">{item.label}</span><span className="text-[9px] opacity-45">{item.size}px</span></button>)}
            </div>
            <div className="kinetiq-tool-group"><div className="kinetiq-group-label">Text motion</div>{motionPresets.slice(0, 6).map((preset) => <button key={preset.id} type="button" disabled={!selectedText} className={`kinetiq-library-card ${selectedText?.motionPresetId === preset.id ? "is-selected" : ""}`} onClick={() => useEditorStore.getState().setMotionPreset(preset.id)}><span className="text-[10px] font-semibold">{preset.name}</span><span className="text-[8px] opacity-45">{preset.engine === "react-bits-adapter" ? "React Bits" : "Native"}</span></button>)}</div>
          </div>}

          {active === "ui" && <div className="kinetiq-tool-section"><div className="kinetiq-tool-group"><div className="kinetiq-group-label">Product UI</div>{uiPresets.map((item) => <button key={item.preset} type="button" className="kinetiq-library-card" onClick={() => applyUiPreset(item.preset, item.label)}><span className="text-[10px] font-semibold">{item.label}</span><span className="text-[8px] opacity-45">{item.hint}</span></button>)}</div><div className="kinetiq-coming-card"><span>Apple UI kit</span><span>Figma source pack next</span></div></div>}

          {active === "elements" && <div className="kinetiq-tool-section"><div className="kinetiq-grid-2"><button type="button" className="kinetiq-element-card" onClick={() => setShape("rectangle", "#8067ff", 28)}>▰<span>Rectangle</span></button><button type="button" className="kinetiq-element-card" onClick={() => setShape("circle", "#d7ff45", 999)}>●<span>Circle</span></button><button type="button" className="kinetiq-element-card" onClick={() => setShape("pill", "#f7f7f4", 999)}>▬<span>Pill</span></button><button type="button" className="kinetiq-element-card" onClick={() => setShape("rectangle", "#0b0b0f", 48)}>□<span>Card</span></button></div></div>}

          {active === "backgrounds" && <div className="kinetiq-tool-section"><div className="kinetiq-background-grid">{backgroundPresets.map((preset) => <button key={preset.id} type="button" className={`kinetiq-background-card ${scene.backgroundPresetId === preset.id ? "is-selected" : ""}`} onClick={() => useEditorStore.getState().setBackgroundPreset(preset.id)}><span className={`kinetiq-background-swatch ${preset.className}`} /><span>{preset.name}</span></button>)}</div></div>}

          {active === "motion" && <div className="kinetiq-tool-section"><div className="kinetiq-tool-group"><div className="kinetiq-group-label">Entrance & text effects</div>{motionPresets.map((preset) => <button key={preset.id} type="button" disabled={!selectedText} className={`kinetiq-library-card ${selectedText?.motionPresetId === preset.id ? "is-selected" : ""}`} onClick={() => useEditorStore.getState().setMotionPreset(preset.id)}><span className="text-[10px] font-semibold">{preset.name}</span><span className="text-[8px] opacity-45">{preset.description}</span></button>)}</div></div>}

          {active === "transitions" && <div className="kinetiq-tool-section">
            {!selectedComponent ? <div className="kinetiq-empty-card">Select a component to apply transitions.</div> : <>
              <div className="kinetiq-group-label">Transition in</div><div className="kinetiq-transition-grid">{transitionOptions.map((item) => <button key={`in-${item.id}`} type="button" className={`kinetiq-transition-card ${selectedComponent.transitionIn?.type === item.id ? "is-selected" : ""}`} onClick={() => setTransition("in", item.id)}><span>{item.name}</span><small>{item.hint}</small></button>)}</div>
              <label className="kinetiq-range-label"><span>In duration</span><span>{(selectedComponent.transitionIn?.duration ?? 0.35).toFixed(2)}s</span><input type="range" min="0" max="2" step="0.05" value={selectedComponent.transitionIn?.duration ?? 0.35} onChange={(event) => setTransitionDuration("in", Number(event.target.value))} /></label>
              <div className="kinetiq-group-label mt-5">Transition out</div><div className="kinetiq-transition-grid">{transitionOptions.map((item) => <button key={`out-${item.id}`} type="button" className={`kinetiq-transition-card ${selectedComponent.transitionOut?.type === item.id ? "is-selected" : ""}`} onClick={() => setTransition("out", item.id)}><span>{item.name}</span><small>{item.hint}</small></button>)}</div>
              <label className="kinetiq-range-label"><span>Out duration</span><span>{(selectedComponent.transitionOut?.duration ?? 0.35).toFixed(2)}s</span><input type="range" min="0" max="2" step="0.05" value={selectedComponent.transitionOut?.duration ?? 0.35} onChange={(event) => setTransitionDuration("out", Number(event.target.value))} /></label>
            </>}
          </div>}

          {active === "audio" && <div className="kinetiq-tool-section"><button type="button" className="kinetiq-primary-tool" onClick={() => audioRef.current?.click()}>＋ Import audio</button><div className="kinetiq-tool-group"><div className="kinetiq-group-label">Smart sound</div><div className="kinetiq-coming-card"><span>Motion-aware SFX</span><span>Typing, pops, whooshes, UI taps</span></div></div></div>}
        </div>
      )}
    </div>
  );
}
