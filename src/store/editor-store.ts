"use client";

import { create } from "zustand";
import type {
  BackgroundPresetId,
  Layer,
  MotionPresetId,
  MotionSettings,
  MusicTrack,
  Project,
  SplitBy,
  TextComponent,
  VisualComponent,
} from "@/lib/project-schema";

export type AddableComponentType = "text" | "image" | "video" | "shape" | "ui";

type TimelineClipboard =
  | { kind: "components"; items: Array<{ layerId: string; component: VisualComponent }> }
  | { kind: "music"; tracks: MusicTrack[] }
  | null;

const defaultMotionSettings: MotionSettings = {
  duration: 0.55,
  stagger: 0.07,
  splitBy: "words",
};

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeTextComponent(index = 0, overrides: Partial<TextComponent> = {}): TextComponent {
  return {
    id: id("text"),
    name: index === 0 ? "Heading" : `Text ${index + 1}`,
    type: "text",
    content: index === 0 ? "Add heading" : `Text ${index + 1}`,
    x: 120,
    y: 760 + index * 120,
    width: 840,
    height: 180,
    fontSize: index === 0 ? 96 : 72,
    fontWeight: 800,
    color: "#f7f7f4",
    startTime: 0,
    duration: 2.8,
    motionPresetId: "split-rise",
    motionSettings: { ...defaultMotionSettings },
    ...overrides,
  };
}

function makeComponent(type: AddableComponentType, index = 0, startTime = 0): VisualComponent {
  const base = {
    id: id(type),
    name: type === "ui" ? "UI Component" : `${type[0].toUpperCase()}${type.slice(1)}`,
    startTime,
    duration: 2.5,
    x: 160,
    y: 620 + index * 70,
    width: 760,
    height: 420,
  };

  if (type === "text") return makeTextComponent(index, base);
  if (type === "image") return { ...base, type, src: null, fit: "contain" };
  if (type === "video") return { ...base, type, src: null, muted: true };
  if (type === "shape") return { ...base, type, shape: "rectangle", fill: "#8067ff", radius: 32 };
  return { ...base, type: "ui", preset: "notification", label: "Notification" };
}

function makeBlankProject(width = 1080, height = 1920): Project {
  return {
    version: 1,
    id: id("project"),
    name: "Untitled Kinetiq Project",
    width,
    height,
    fps: 30,
    scenes: [
      {
        id: "master",
        name: "Master",
        durationInSeconds: 6,
        backgroundPresetId: "ink",
        layers: [],
        musicTracks: [],
        markers: [],
      },
    ],
  };
}

const initialProject = makeBlankProject();

type EditorStore = {
  project: Project;
  replayKey: number;
  currentTime: number;
  isPlaying: boolean;
  activeSceneIndex: number;
  selectedLayerId: string | null;
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  selectedMusicTrackId: string | null;
  snapEnabled: boolean;
  pastProjects: Project[];
  futureProjects: Project[];
  clipboard: TimelineClipboard;
  startBlankProject: (width: number, height: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  setHeadline: (content: string) => void;
  setMotionPreset: (presetId: MotionPresetId) => void;
  setMotionDuration: (duration: number) => void;
  setMotionStagger: (stagger: number) => void;
  setSplitBy: (splitBy: SplitBy) => void;
  setBackgroundPreset: (presetId: BackgroundPresetId) => void;
  setCurrentTime: (time: number) => void;
  nudgePlayhead: (frames: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setActiveScene: (index: number) => void;
  addLayer: (type?: AddableComponentType) => void;
  addComponentToSelectedLayer: (type: AddableComponentType) => void;
  addMusicTrack: () => void;
  deleteSelectedComponent: () => void;
  deleteSelection: () => void;
  rippleDeleteSelection: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  splitSelectionAtPlayhead: () => void;
  setSelectedLayer: (layerId: string | null) => void;
  setSelectedComponent: (componentId: string | null, layerId?: string | null, additive?: boolean) => void;
  setSelectedMusicTrack: (trackId: string | null) => void;
  clearSelection: () => void;
  setComponentTiming: (componentId: string, startTime: number, duration: number) => void;
  setMusicTiming: (trackId: string, startTime: number, duration: number) => void;
  setSceneDuration: (duration: number) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  moveLayer: (layerId: string, direction: -1 | 1) => void;
  toggleMusicMute: (trackId: string) => void;
  toggleMusicLock: (trackId: string) => void;
  addMarker: () => void;
  removeMarker: (markerId: string) => void;
  toggleSnap: () => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  replay: () => void;
};

function historyPatch(state: EditorStore, nextProject: Project, extra: Partial<EditorStore> = {}) {
  return {
    project: nextProject,
    pastProjects: [...state.pastProjects, state.project].slice(-50),
    futureProjects: [],
    ...extra,
  };
}

function updateSelectedText(project: Project, selectedComponentId: string | null, updater: (component: TextComponent) => TextComponent): Project {
  if (!selectedComponentId) return project;
  const scene = project.scenes[0];
  return {
    ...project,
    scenes: [
      {
        ...scene,
        layers: scene.layers.map((layer) => ({
          ...layer,
          components: layer.components.map((component) =>
            component.id === selectedComponentId && component.type === "text" ? updater(component) : component,
          ),
        })),
      },
      ...project.scenes.slice(1),
    ],
  };
}

function findComponent(project: Project, componentId: string | null) {
  if (!componentId) return null;
  const scene = project.scenes[0];
  for (const layer of scene.layers) {
    const component = layer.components.find((item) => item.id === componentId);
    if (component) return { layer, component };
  }
  return null;
}

function selectedIds(state: EditorStore) {
  if (state.selectedComponentIds.length) return state.selectedComponentIds;
  return state.selectedComponentId ? [state.selectedComponentId] : [];
}

export const useEditorStore = create<EditorStore>((set) => ({
  project: initialProject,
  replayKey: 0,
  currentTime: 0,
  isPlaying: false,
  activeSceneIndex: 0,
  selectedLayerId: null,
  selectedComponentId: null,
  selectedComponentIds: [],
  selectedMusicTrackId: null,
  snapEnabled: true,
  pastProjects: [],
  futureProjects: [],
  clipboard: null,

  startBlankProject: (width, height) =>
    set((state) => ({
      project: makeBlankProject(width, height),
      currentTime: 0,
      isPlaying: false,
      activeSceneIndex: 0,
      selectedLayerId: null,
      selectedComponentId: null,
      selectedComponentIds: [],
      selectedMusicTrackId: null,
      replayKey: state.replayKey + 1,
      pastProjects: [],
      futureProjects: [],
      clipboard: null,
    })),

  setCanvasSize: (width, height) => set((state) => ({ project: { ...state.project, width, height }, currentTime: 0, isPlaying: false, replayKey: state.replayKey + 1 })),
  setHeadline: (content) => set((state) => ({ project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, content })) })),
  setMotionPreset: (motionPresetId) => set((state) => ({ project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, motionPresetId })), replayKey: state.replayKey + 1 })),
  setMotionDuration: (duration) => set((state) => ({ project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, motionSettings: { ...component.motionSettings, duration } })), replayKey: state.replayKey + 1 })),
  setMotionStagger: (stagger) => set((state) => ({ project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, motionSettings: { ...component.motionSettings, stagger } })), replayKey: state.replayKey + 1 })),
  setSplitBy: (splitBy) => set((state) => ({ project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, motionSettings: { ...component.motionSettings, splitBy } })), replayKey: state.replayKey + 1 })),

  setBackgroundPreset: (backgroundPresetId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      return { project: { ...state.project, scenes: [{ ...scene, backgroundPresetId }, ...state.project.scenes.slice(1)] } };
    }),

  setCurrentTime: (time) => set((state) => ({ currentTime: Math.min(state.project.scenes[0].durationInSeconds, Math.max(0, time)) })),
  nudgePlayhead: (frames) => set((state) => {
    const step = frames / state.project.fps;
    return { currentTime: Math.min(state.project.scenes[0].durationInSeconds, Math.max(0, state.currentTime + step)) };
  }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setActiveScene: () => set({ activeSceneIndex: 0 }),

  addLayer: (type = "text") =>
    set((state) => {
      const scene = state.project.scenes[0];
      const component = makeComponent(type, scene.layers.length, 0);
      const layer: Layer = { id: id("layer"), name: `Layer ${scene.layers.length + 1}`, visible: true, locked: false, components: [component] };
      const nextProject = { ...state.project, scenes: [{ ...scene, layers: [...scene.layers, layer] }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, {
        selectedLayerId: layer.id,
        selectedComponentId: component.id,
        selectedComponentIds: [component.id],
        selectedMusicTrackId: null,
        replayKey: state.replayKey + 1,
      });
    }),

  addComponentToSelectedLayer: (type) =>
    set((state) => {
      const scene = state.project.scenes[0];
      if (scene.layers.length === 0) {
        const component = makeComponent(type, 0, 0);
        const layer: Layer = { id: id("layer"), name: "Layer 1", visible: true, locked: false, components: [component] };
        const nextProject = { ...state.project, scenes: [{ ...scene, layers: [layer] }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedLayerId: layer.id, selectedComponentId: component.id, selectedComponentIds: [component.id], selectedMusicTrackId: null, replayKey: state.replayKey + 1 });
      }

      const target = scene.layers.find((layer) => layer.id === state.selectedLayerId) ?? scene.layers[0];
      if (target.locked) return state;
      const lastEnd = target.components.reduce((max, component) => Math.max(max, component.startTime + component.duration), 0);
      const startTime = lastEnd < scene.durationInSeconds - 0.1 ? lastEnd : 0;
      const component = makeComponent(type, target.components.length, startTime);
      component.duration = Math.min(component.duration, Math.max(0.1, scene.durationInSeconds - startTime));
      const nextProject = {
        ...state.project,
        scenes: [{ ...scene, layers: scene.layers.map((layer) => layer.id === target.id ? { ...layer, components: [...layer.components, component] } : layer) }, ...state.project.scenes.slice(1)],
      };
      return historyPatch(state, nextProject, { selectedLayerId: target.id, selectedComponentId: component.id, selectedComponentIds: [component.id], selectedMusicTrackId: null, replayKey: state.replayKey + 1 });
    }),

  addMusicTrack: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      const track: MusicTrack = { id: id("music"), name: `Music ${scene.musicTracks.length + 1}`, src: null, startTime: 0, duration: scene.durationInSeconds, volume: 0.8, loop: false, muted: false, locked: false };
      const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: [...scene.musicTracks, track] }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedMusicTrackId: track.id, selectedComponentId: null, selectedComponentIds: [] });
    }),

  deleteSelectedComponent: () =>
    set((state) => {
      if (!state.selectedComponentId) return state;
      const scene = state.project.scenes[0];
      const found = findComponent(state.project, state.selectedComponentId);
      if (!found || found.layer.locked) return state;
      const layers = scene.layers.map((layer) => ({ ...layer, components: layer.components.filter((component) => component.id !== state.selectedComponentId) })).filter((layer) => layer.components.length > 0);
      const firstLayer = layers[0] ?? null;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedLayerId: firstLayer?.id ?? null, selectedComponentId: firstLayer?.components[0]?.id ?? null, selectedComponentIds: firstLayer?.components[0] ? [firstLayer.components[0].id] : [] });
    }),

  deleteSelection: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      if (state.selectedMusicTrackId) {
        const track = scene.musicTracks.find((item) => item.id === state.selectedMusicTrackId);
        if (!track || track.locked) return state;
        const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: scene.musicTracks.filter((item) => item.id !== state.selectedMusicTrackId) }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedMusicTrackId: null });
      }

      const ids = new Set(selectedIds(state));
      if (!ids.size) return state;
      const layers = scene.layers
        .map((layer) => layer.locked ? layer : { ...layer, components: layer.components.filter((item) => !ids.has(item.id)) })
        .filter((layer) => layer.components.length > 0);
      const firstLayer = layers[0] ?? null;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, {
        selectedLayerId: firstLayer?.id ?? null,
        selectedComponentId: firstLayer?.components[0]?.id ?? null,
        selectedComponentIds: firstLayer?.components[0] ? [firstLayer.components[0].id] : [],
      });
    }),

  rippleDeleteSelection: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      if (state.selectedMusicTrackId) {
        const track = scene.musicTracks.find((item) => item.id === state.selectedMusicTrackId);
        if (!track || track.locked) return state;
        const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: scene.musicTracks.filter((item) => item.id !== track.id) }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedMusicTrackId: null });
      }

      const ids = new Set(selectedIds(state));
      if (!ids.size) return state;
      const layers = scene.layers
        .map((layer) => {
          if (layer.locked) return layer;
          const removed = layer.components.filter((component) => ids.has(component.id)).sort((a, b) => a.startTime - b.startTime);
          if (!removed.length) return layer;
          const remaining = layer.components
            .filter((component) => !ids.has(component.id))
            .map((component) => {
              const shift = removed.reduce((sum, item) => item.startTime + item.duration <= component.startTime + 0.0001 ? sum + item.duration : sum, 0);
              return { ...component, startTime: Math.max(0, component.startTime - shift) } as VisualComponent;
            });
          return { ...layer, components: remaining };
        })
        .filter((layer) => layer.components.length > 0);
      const firstLayer = layers[0] ?? null;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, {
        selectedLayerId: firstLayer?.id ?? null,
        selectedComponentId: firstLayer?.components[0]?.id ?? null,
        selectedComponentIds: firstLayer?.components[0] ? [firstLayer.components[0].id] : [],
      });
    }),

  duplicateSelection: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      if (state.selectedMusicTrackId) {
        const source = scene.musicTracks.find((item) => item.id === state.selectedMusicTrackId);
        if (!source || source.locked) return state;
        const startTime = Math.min(source.startTime + source.duration, Math.max(0, scene.durationInSeconds - 0.1));
        const copy = { ...source, id: id("music"), name: `${source.name} Copy`, startTime, duration: Math.min(source.duration, Math.max(0.1, scene.durationInSeconds - startTime)) };
        const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: [...scene.musicTracks, copy] }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedMusicTrackId: copy.id, selectedComponentIds: [] });
      }

      const ids = new Set(selectedIds(state));
      if (!ids.size) return state;
      const newIds: string[] = [];
      let primaryLayer: string | null = null;
      const layers = scene.layers.map((layer) => {
        if (layer.locked) return layer;
        const copies = layer.components
          .filter((component) => ids.has(component.id))
          .map((component) => {
            const startTime = Math.min(component.startTime + component.duration, Math.max(0, scene.durationInSeconds - 0.1));
            const copy = { ...component, id: id(component.type), name: `${component.name} Copy`, startTime, duration: Math.min(component.duration, Math.max(0.1, scene.durationInSeconds - startTime)) } as VisualComponent;
            newIds.push(copy.id);
            primaryLayer ??= layer.id;
            return copy;
          });
        return copies.length ? { ...layer, components: [...layer.components, ...copies] } : layer;
      });
      if (!newIds.length) return state;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedLayerId: primaryLayer, selectedComponentId: newIds[0], selectedComponentIds: newIds, selectedMusicTrackId: null });
    }),

  copySelection: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      if (state.selectedMusicTrackId) {
        const track = scene.musicTracks.find((item) => item.id === state.selectedMusicTrackId);
        return track ? { clipboard: { kind: "music" as const, tracks: [{ ...track }] } } : {};
      }
      const ids = new Set(selectedIds(state));
      const items = scene.layers.flatMap((layer) => layer.components.filter((component) => ids.has(component.id)).map((component) => ({ layerId: layer.id, component: { ...component } as VisualComponent })));
      return items.length ? { clipboard: { kind: "components" as const, items } } : {};
    }),

  pasteClipboard: () =>
    set((state) => {
      if (!state.clipboard) return state;
      const scene = state.project.scenes[0];
      if (state.clipboard.kind === "music") {
        const earliest = Math.min(...state.clipboard.tracks.map((track) => track.startTime));
        const copies = state.clipboard.tracks.map((track) => {
          const startTime = Math.min(Math.max(0, state.currentTime + (track.startTime - earliest)), Math.max(0, scene.durationInSeconds - 0.1));
          return { ...track, id: id("music"), name: `${track.name} Copy`, startTime, duration: Math.min(track.duration, Math.max(0.1, scene.durationInSeconds - startTime)) };
        });
        const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: [...scene.musicTracks, ...copies] }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedMusicTrackId: copies[0]?.id ?? null, selectedComponentId: null, selectedComponentIds: [] });
      }

      const earliest = Math.min(...state.clipboard.items.map((item) => item.component.startTime));
      const groups = new Map<string, VisualComponent[]>();
      const newIds: string[] = [];
      for (const item of state.clipboard.items) {
        const target = scene.layers.find((layer) => layer.id === item.layerId && !layer.locked) ?? scene.layers.find((layer) => !layer.locked);
        if (!target) continue;
        const startTime = Math.min(Math.max(0, state.currentTime + (item.component.startTime - earliest)), Math.max(0, scene.durationInSeconds - 0.1));
        const copy = { ...item.component, id: id(item.component.type), name: `${item.component.name} Copy`, startTime, duration: Math.min(item.component.duration, Math.max(0.1, scene.durationInSeconds - startTime)) } as VisualComponent;
        const list = groups.get(target.id) ?? [];
        list.push(copy);
        groups.set(target.id, list);
        newIds.push(copy.id);
      }
      if (!newIds.length) return state;
      const layers = scene.layers.map((layer) => groups.has(layer.id) ? { ...layer, components: [...layer.components, ...(groups.get(layer.id) ?? [])] } : layer);
      const firstLayerId = [...groups.keys()][0] ?? null;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedLayerId: firstLayerId, selectedComponentId: newIds[0], selectedComponentIds: newIds, selectedMusicTrackId: null });
    }),

  splitSelectionAtPlayhead: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      const time = state.currentTime;
      if (state.selectedMusicTrackId) {
        const source = scene.musicTracks.find((item) => item.id === state.selectedMusicTrackId);
        if (!source || source.locked || time <= source.startTime + 0.05 || time >= source.startTime + source.duration - 0.05) return state;
        const left = { ...source, duration: time - source.startTime };
        const right = { ...source, id: id("music"), name: `${source.name} Split`, startTime: time, duration: source.startTime + source.duration - time };
        const nextTracks = scene.musicTracks.flatMap((item) => item.id === source.id ? [left, right] : [item]);
        const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: nextTracks }, ...state.project.scenes.slice(1)] };
        return historyPatch(state, nextProject, { selectedMusicTrackId: right.id, selectedComponentIds: [] });
      }

      const ids = new Set(selectedIds(state));
      if (!ids.size) return state;
      const rightIds: string[] = [];
      let primaryLayer: string | null = null;
      const layers = scene.layers.map((layer) => {
        if (layer.locked) return layer;
        const components = layer.components.flatMap((component) => {
          if (!ids.has(component.id) || time <= component.startTime + 0.05 || time >= component.startTime + component.duration - 0.05) return [component];
          const left = { ...component, duration: time - component.startTime } as VisualComponent;
          const right = { ...component, id: id(component.type), name: `${component.name} Split`, startTime: time, duration: component.startTime + component.duration - time } as VisualComponent;
          rightIds.push(right.id);
          primaryLayer ??= layer.id;
          return [left, right];
        });
        return { ...layer, components };
      });
      if (!rightIds.length) return state;
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedComponentId: rightIds[0], selectedComponentIds: rightIds, selectedLayerId: primaryLayer, selectedMusicTrackId: null });
    }),

  setSelectedLayer: (selectedLayerId) => set({ selectedLayerId, selectedMusicTrackId: null }),
  setSelectedComponent: (selectedComponentId, layerId, additive = false) =>
    set((state) => {
      if (!selectedComponentId) return { selectedComponentId: null, selectedComponentIds: [], selectedMusicTrackId: null };
      if (!additive) {
        return { selectedComponentId, selectedComponentIds: [selectedComponentId], selectedLayerId: layerId ?? state.selectedLayerId, selectedMusicTrackId: null };
      }
      const exists = state.selectedComponentIds.includes(selectedComponentId);
      const nextIds = exists ? state.selectedComponentIds.filter((item) => item !== selectedComponentId) : [...state.selectedComponentIds, selectedComponentId];
      return {
        selectedComponentIds: nextIds,
        selectedComponentId: exists ? (nextIds[0] ?? null) : selectedComponentId,
        selectedLayerId: layerId ?? state.selectedLayerId,
        selectedMusicTrackId: null,
      };
    }),
  setSelectedMusicTrack: (selectedMusicTrackId) => set({ selectedMusicTrackId, selectedComponentId: null, selectedComponentIds: [] }),
  clearSelection: () => set({ selectedComponentId: null, selectedComponentIds: [], selectedMusicTrackId: null }),

  setComponentTiming: (componentId, startTime, duration) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const found = findComponent(state.project, componentId);
      if (!found || found.layer.locked) return state;
      const safeStart = Math.min(Math.max(0, startTime), Math.max(0, scene.durationInSeconds - 0.1));
      const safeDuration = Math.min(Math.max(0.1, duration), scene.durationInSeconds - safeStart);
      return {
        project: { ...state.project, scenes: [{ ...scene, layers: scene.layers.map((layer) => ({ ...layer, components: layer.components.map((component) => component.id === componentId ? { ...component, startTime: safeStart, duration: safeDuration } : component) })) }, ...state.project.scenes.slice(1)] },
      };
    }),

  setMusicTiming: (trackId, startTime, duration) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const track = scene.musicTracks.find((item) => item.id === trackId);
      if (!track || track.locked) return state;
      const safeStart = Math.min(Math.max(0, startTime), Math.max(0, scene.durationInSeconds - 0.1));
      const safeDuration = Math.min(Math.max(0.1, duration), scene.durationInSeconds - safeStart);
      return { project: { ...state.project, scenes: [{ ...scene, musicTracks: scene.musicTracks.map((item) => item.id === trackId ? { ...item, startTime: safeStart, duration: safeDuration } : item) }, ...state.project.scenes.slice(1)] } };
    }),

  setSceneDuration: (duration) =>
    set((state) => {
      const safeDuration = Math.max(1, duration);
      const scene = state.project.scenes[0];
      const clampTimed = <T extends { startTime: number; duration: number }>(item: T): T => {
        const startTime = Math.min(item.startTime, Math.max(0, safeDuration - 0.1));
        return { ...item, startTime, duration: Math.min(item.duration, Math.max(0.1, safeDuration - startTime)) };
      };
      const nextProject = { ...state.project, scenes: [{ ...scene, durationInSeconds: safeDuration, layers: scene.layers.map((layer) => ({ ...layer, components: layer.components.map(clampTimed) })), musicTracks: scene.musicTracks.map(clampTimed), markers: scene.markers.filter((marker) => marker.time <= safeDuration) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { currentTime: Math.min(state.currentTime, safeDuration) });
    }),

  toggleLayerVisibility: (layerId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const nextProject = { ...state.project, scenes: [{ ...scene, layers: scene.layers.map((layer) => layer.id === layerId ? { ...layer, visible: !layer.visible } : layer) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  toggleLayerLock: (layerId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const nextProject = { ...state.project, scenes: [{ ...scene, layers: scene.layers.map((layer) => layer.id === layerId ? { ...layer, locked: !layer.locked } : layer) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  moveLayer: (layerId, direction) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const index = scene.layers.findIndex((layer) => layer.id === layerId);
      if (index < 0) return state;
      const nextIndex = Math.min(scene.layers.length - 1, Math.max(0, index + direction));
      if (nextIndex === index) return state;
      const layers = [...scene.layers];
      const [layer] = layers.splice(index, 1);
      layers.splice(nextIndex, 0, layer);
      const nextProject = { ...state.project, scenes: [{ ...scene, layers }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject, { selectedLayerId: layerId });
    }),

  toggleMusicMute: (trackId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: scene.musicTracks.map((track) => track.id === trackId ? { ...track, muted: !track.muted } : track) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  toggleMusicLock: (trackId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const nextProject = { ...state.project, scenes: [{ ...scene, musicTracks: scene.musicTracks.map((track) => track.id === trackId ? { ...track, locked: !track.locked } : track) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  addMarker: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      const marker = { id: id("marker"), time: state.currentTime, label: `Marker ${scene.markers.length + 1}` };
      const nextProject = { ...state.project, scenes: [{ ...scene, markers: [...scene.markers, marker].sort((a, b) => a.time - b.time) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  removeMarker: (markerId) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const nextProject = { ...state.project, scenes: [{ ...scene, markers: scene.markers.filter((marker) => marker.id !== markerId) }, ...state.project.scenes.slice(1)] };
      return historyPatch(state, nextProject);
    }),

  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  checkpoint: () => set((state) => ({ pastProjects: [...state.pastProjects, state.project].slice(-50), futureProjects: [] })),

  undo: () =>
    set((state) => {
      const previous = state.pastProjects[state.pastProjects.length - 1];
      if (!previous) return state;
      return {
        project: previous,
        pastProjects: state.pastProjects.slice(0, -1),
        futureProjects: [state.project, ...state.futureProjects].slice(0, 50),
        isPlaying: false,
        replayKey: state.replayKey + 1,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.futureProjects[0];
      if (!next) return state;
      return {
        project: next,
        pastProjects: [...state.pastProjects, state.project].slice(-50),
        futureProjects: state.futureProjects.slice(1),
        isPlaying: false,
        replayKey: state.replayKey + 1,
      };
    }),

  replay: () => set((state) => ({ replayKey: state.replayKey + 1, currentTime: 0, isPlaying: false })),
}));
