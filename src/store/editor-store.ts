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
    content: index === 0 ? "MAKE IDEAS MOVE." : `TEXT ${index + 1}`,
    x: 120,
    y: 760 + index * 120,
    width: 840,
    height: 180,
    fontSize: index === 0 ? 96 : 72,
    fontWeight: 800,
    color: "#f7f7f4",
    startTime: Math.min(index * 0.4, 2.5),
    duration: 2.8,
    motionPresetId: "split-rise",
    motionSettings: { ...defaultMotionSettings },
    ...overrides,
  };
}

function makeComponent(type: AddableComponentType, index = 0): VisualComponent {
  const base = {
    id: id(type),
    name: type === "ui" ? "UI Component" : `${type[0].toUpperCase()}${type.slice(1)}`,
    startTime: Math.min(index * 0.25, 2),
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

const initialText = makeTextComponent(0, {
  id: "headline-1",
  startTime: 0.35,
  duration: 2.8,
});

const initialLayer: Layer = {
  id: "layer-1",
  name: "Layer 1",
  components: [initialText],
};

const initialProject: Project = {
  version: 1,
  id: "demo-project",
  name: "Untitled Kinetiq Project",
  width: 1080,
  height: 1920,
  fps: 30,
  scenes: [
    {
      id: "master",
      name: "Master",
      durationInSeconds: 6,
      backgroundPresetId: "ink",
      layers: [initialLayer],
      musicTracks: [],
    },
  ],
};

type EditorStore = {
  project: Project;
  replayKey: number;
  currentTime: number;
  isPlaying: boolean;
  activeSceneIndex: number;
  selectedLayerId: string | null;
  selectedComponentId: string | null;
  selectedMusicTrackId: string | null;
  setCanvasSize: (width: number, height: number) => void;
  setHeadline: (content: string) => void;
  setMotionPreset: (presetId: MotionPresetId) => void;
  setMotionDuration: (duration: number) => void;
  setMotionStagger: (stagger: number) => void;
  setSplitBy: (splitBy: SplitBy) => void;
  setBackgroundPreset: (presetId: BackgroundPresetId) => void;
  setCurrentTime: (time: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  togglePlayback: () => void;
  setActiveScene: (index: number) => void;
  addLayer: (type?: AddableComponentType) => void;
  addComponentToSelectedLayer: (type: AddableComponentType) => void;
  addMusicTrack: () => void;
  deleteSelectedComponent: () => void;
  setSelectedLayer: (layerId: string | null) => void;
  setSelectedComponent: (componentId: string | null, layerId?: string | null) => void;
  setSelectedMusicTrack: (trackId: string | null) => void;
  setComponentTiming: (componentId: string, startTime: number, duration: number) => void;
  setMusicTiming: (trackId: string, startTime: number, duration: number) => void;
  setSceneDuration: (duration: number) => void;
  replay: () => void;
};

function updateSelectedText(
  project: Project,
  selectedComponentId: string | null,
  updater: (component: TextComponent) => TextComponent,
): Project {
  if (!selectedComponentId) return project;
  return {
    ...project,
    scenes: project.scenes.map((scene, sceneIndex) =>
      sceneIndex === 0
        ? {
            ...scene,
            layers: scene.layers.map((layer) => ({
              ...layer,
              components: layer.components.map((component) =>
                component.id === selectedComponentId && component.type === "text"
                  ? updater(component)
                  : component,
              ),
            })),
          }
        : scene,
    ),
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  project: initialProject,
  replayKey: 0,
  currentTime: 0,
  isPlaying: false,
  activeSceneIndex: 0,
  selectedLayerId: initialLayer.id,
  selectedComponentId: initialText.id,
  selectedMusicTrackId: null,

  setCanvasSize: (width, height) =>
    set((state) => ({
      project: { ...state.project, width, height },
      currentTime: 0,
      isPlaying: false,
      replayKey: state.replayKey + 1,
    })),

  setHeadline: (content) =>
    set((state) => ({
      project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, content })),
    })),

  setMotionPreset: (motionPresetId) =>
    set((state) => ({
      project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({ ...component, motionPresetId })),
      replayKey: state.replayKey + 1,
    })),

  setMotionDuration: (duration) =>
    set((state) => ({
      project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({
        ...component,
        motionSettings: { ...component.motionSettings, duration },
      })),
      replayKey: state.replayKey + 1,
    })),

  setMotionStagger: (stagger) =>
    set((state) => ({
      project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({
        ...component,
        motionSettings: { ...component.motionSettings, stagger },
      })),
      replayKey: state.replayKey + 1,
    })),

  setSplitBy: (splitBy) =>
    set((state) => ({
      project: updateSelectedText(state.project, state.selectedComponentId, (component) => ({
        ...component,
        motionSettings: { ...component.motionSettings, splitBy },
      })),
      replayKey: state.replayKey + 1,
    })),

  setBackgroundPreset: (backgroundPresetId) =>
    set((state) => ({
      project: {
        ...state.project,
        scenes: state.project.scenes.map((scene, index) =>
          index === 0 ? { ...scene, backgroundPresetId } : scene,
        ),
      },
    })),

  setCurrentTime: (time) =>
    set((state) => {
      const duration = state.project.scenes[0].durationInSeconds;
      return { currentTime: Math.min(duration, Math.max(0, time)) };
    }),

  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setActiveScene: () => set({ activeSceneIndex: 0 }),

  addLayer: (type = "text") =>
    set((state) => {
      const scene = state.project.scenes[0];
      const component = makeComponent(type, scene.layers.length);
      const layer: Layer = {
        id: id("layer"),
        name: `Layer ${scene.layers.length + 1}`,
        components: [component],
      };
      return {
        project: {
          ...state.project,
          scenes: [{ ...scene, layers: [...scene.layers, layer] }, ...state.project.scenes.slice(1)],
        },
        selectedLayerId: layer.id,
        selectedComponentId: component.id,
        selectedMusicTrackId: null,
        replayKey: state.replayKey + 1,
      };
    }),

  addComponentToSelectedLayer: (type) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const layerId = state.selectedLayerId ?? scene.layers[0].id;
      const target = scene.layers.find((layer) => layer.id === layerId) ?? scene.layers[0];
      const component = makeComponent(type, target.components.length);
      return {
        project: {
          ...state.project,
          scenes: [
            {
              ...scene,
              layers: scene.layers.map((layer) =>
                layer.id === target.id ? { ...layer, components: [...layer.components, component] } : layer,
              ),
            },
            ...state.project.scenes.slice(1),
          ],
        },
        selectedLayerId: target.id,
        selectedComponentId: component.id,
        selectedMusicTrackId: null,
        replayKey: state.replayKey + 1,
      };
    }),

  addMusicTrack: () =>
    set((state) => {
      const scene = state.project.scenes[0];
      const track: MusicTrack = {
        id: id("music"),
        name: `Music ${scene.musicTracks.length + 1}`,
        src: null,
        startTime: 0,
        duration: scene.durationInSeconds,
        volume: 0.8,
        loop: false,
      };
      return {
        project: {
          ...state.project,
          scenes: [{ ...scene, musicTracks: [...scene.musicTracks, track] }, ...state.project.scenes.slice(1)],
        },
        selectedMusicTrackId: track.id,
        selectedComponentId: null,
      };
    }),

  deleteSelectedComponent: () =>
    set((state) => {
      if (!state.selectedComponentId) return state;
      const scene = state.project.scenes[0];
      let nextSelected: string | null = null;
      const layers = scene.layers
        .map((layer) => ({
          ...layer,
          components: layer.components.filter((component) => component.id !== state.selectedComponentId),
        }))
        .filter((layer) => layer.components.length > 0);
      const safeLayers = layers.length ? layers : [{ id: id("layer"), name: "Layer 1", components: [makeTextComponent(0)] }];
      nextSelected = safeLayers[0].components[0]?.id ?? null;
      return {
        project: {
          ...state.project,
          scenes: [{ ...scene, layers: safeLayers }, ...state.project.scenes.slice(1)],
        },
        selectedLayerId: safeLayers[0].id,
        selectedComponentId: nextSelected,
      };
    }),

  setSelectedLayer: (selectedLayerId) => set({ selectedLayerId, selectedMusicTrackId: null }),
  setSelectedComponent: (selectedComponentId, layerId) =>
    set((state) => ({
      selectedComponentId,
      selectedLayerId: layerId ?? state.selectedLayerId,
      selectedMusicTrackId: null,
    })),
  setSelectedMusicTrack: (selectedMusicTrackId) =>
    set({ selectedMusicTrackId, selectedComponentId: null }),

  setComponentTiming: (componentId, startTime, duration) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const safeStart = Math.min(Math.max(0, startTime), Math.max(0, scene.durationInSeconds - 0.1));
      const safeDuration = Math.min(Math.max(0.1, duration), scene.durationInSeconds - safeStart);
      return {
        project: {
          ...state.project,
          scenes: [
            {
              ...scene,
              layers: scene.layers.map((layer) => ({
                ...layer,
                components: layer.components.map((component) =>
                  component.id === componentId ? { ...component, startTime: safeStart, duration: safeDuration } : component,
                ),
              })),
            },
            ...state.project.scenes.slice(1),
          ],
        },
      };
    }),

  setMusicTiming: (trackId, startTime, duration) =>
    set((state) => {
      const scene = state.project.scenes[0];
      const safeStart = Math.min(Math.max(0, startTime), Math.max(0, scene.durationInSeconds - 0.1));
      const safeDuration = Math.min(Math.max(0.1, duration), scene.durationInSeconds - safeStart);
      return {
        project: {
          ...state.project,
          scenes: [
            {
              ...scene,
              musicTracks: scene.musicTracks.map((track) =>
                track.id === trackId ? { ...track, startTime: safeStart, duration: safeDuration } : track,
              ),
            },
            ...state.project.scenes.slice(1),
          ],
        },
      };
    }),

  setSceneDuration: (duration) =>
    set((state) => {
      const safeDuration = Math.max(1, duration);
      const scene = state.project.scenes[0];
      const clampTimed = <T extends { startTime: number; duration: number }>(item: T): T => {
        const startTime = Math.min(item.startTime, Math.max(0, safeDuration - 0.1));
        return { ...item, startTime, duration: Math.min(item.duration, Math.max(0.1, safeDuration - startTime)) };
      };
      return {
        project: {
          ...state.project,
          scenes: [
            {
              ...scene,
              durationInSeconds: safeDuration,
              layers: scene.layers.map((layer) => ({ ...layer, components: layer.components.map(clampTimed) })),
              musicTracks: scene.musicTracks.map(clampTimed),
            },
            ...state.project.scenes.slice(1),
          ],
        },
        currentTime: Math.min(state.currentTime, safeDuration),
      };
    }),

  replay: () => set((state) => ({ replayKey: state.replayKey + 1, currentTime: 0, isPlaying: false })),
}));
