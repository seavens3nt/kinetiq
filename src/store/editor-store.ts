"use client";

import { create } from "zustand";
import type {
  BackgroundPresetId,
  MotionPresetId,
  MotionSettings,
  Project,
  SplitBy,
  TextElement,
} from "@/lib/project-schema";

const defaultMotionSettings: MotionSettings = {
  duration: 0.55,
  stagger: 0.07,
  splitBy: "words",
};

function makeTextElement(index: number, overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: `text-${Date.now()}-${index}`,
    type: "text",
    content: index === 0 ? "MAKE IDEAS MOVE." : `TEXT ${index + 1}`,
    x: 120,
    y: 760 + index * 150,
    width: 840,
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

const initialProject: Project = {
  version: 1,
  id: "demo-project",
  name: "Untitled Kinetiq Project",
  width: 1080,
  height: 1920,
  fps: 30,
  scenes: [
    {
      id: "scene-1",
      name: "Scene 1",
      durationInSeconds: 4,
      backgroundPresetId: "ink",
      elements: [
        makeTextElement(0, {
          id: "headline-1",
          startTime: 0.35,
          duration: 2.8,
        }),
      ],
    },
  ],
};

type EditorStore = {
  project: Project;
  replayKey: number;
  currentTime: number;
  isPlaying: boolean;
  activeSceneIndex: number;
  selectedElementId: string | null;
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
  addScene: () => void;
  duplicateScene: () => void;
  deleteScene: () => void;
  addTextElement: () => void;
  deleteSelectedElement: () => void;
  setSelectedElement: (elementId: string | null) => void;
  setElementTiming: (elementId: string, startTime: number, duration: number) => void;
  setSceneDuration: (duration: number) => void;
  replay: () => void;
};

function updateSelectedElement(
  project: Project,
  activeSceneIndex: number,
  selectedElementId: string | null,
  updater: (element: TextElement) => TextElement,
): Project {
  if (!selectedElementId) return project;
  return {
    ...project,
    scenes: project.scenes.map((scene, sceneIndex) =>
      sceneIndex === activeSceneIndex
        ? {
            ...scene,
            elements: scene.elements.map((element) =>
              element.id === selectedElementId ? updater(element) : element,
            ),
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
  selectedElementId: "headline-1",

  setCanvasSize: (width, height) =>
    set((state) => ({
      project: { ...state.project, width, height },
      currentTime: 0,
      isPlaying: false,
      replayKey: state.replayKey + 1,
    })),

  setHeadline: (content) =>
    set((state) => ({
      project: updateSelectedElement(
        state.project,
        state.activeSceneIndex,
        state.selectedElementId,
        (element) => ({ ...element, content }),
      ),
    })),

  setMotionPreset: (motionPresetId) =>
    set((state) => ({
      project: updateSelectedElement(
        state.project,
        state.activeSceneIndex,
        state.selectedElementId,
        (element) => ({ ...element, motionPresetId }),
      ),
      replayKey: state.replayKey + 1,
    })),

  setMotionDuration: (duration) =>
    set((state) => ({
      project: updateSelectedElement(
        state.project,
        state.activeSceneIndex,
        state.selectedElementId,
        (element) => ({
          ...element,
          motionSettings: { ...element.motionSettings, duration },
        }),
      ),
      replayKey: state.replayKey + 1,
    })),

  setMotionStagger: (stagger) =>
    set((state) => ({
      project: updateSelectedElement(
        state.project,
        state.activeSceneIndex,
        state.selectedElementId,
        (element) => ({
          ...element,
          motionSettings: { ...element.motionSettings, stagger },
        }),
      ),
      replayKey: state.replayKey + 1,
    })),

  setSplitBy: (splitBy) =>
    set((state) => ({
      project: updateSelectedElement(
        state.project,
        state.activeSceneIndex,
        state.selectedElementId,
        (element) => ({
          ...element,
          motionSettings: { ...element.motionSettings, splitBy },
        }),
      ),
      replayKey: state.replayKey + 1,
    })),

  setBackgroundPreset: (backgroundPresetId) =>
    set((state) => ({
      project: {
        ...state.project,
        scenes: state.project.scenes.map((scene, index) =>
          index === state.activeSceneIndex ? { ...scene, backgroundPresetId } : scene,
        ),
      },
    })),

  setCurrentTime: (time) =>
    set((state) => {
      const sceneDuration = state.project.scenes[state.activeSceneIndex].durationInSeconds;
      return { currentTime: Math.min(sceneDuration, Math.max(0, time)) };
    }),

  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setActiveScene: (index) =>
    set((state) => {
      const safeIndex = Math.min(Math.max(0, index), state.project.scenes.length - 1);
      const scene = state.project.scenes[safeIndex];
      return {
        activeSceneIndex: safeIndex,
        currentTime: 0,
        isPlaying: false,
        selectedElementId: scene.elements[0]?.id ?? null,
        replayKey: state.replayKey + 1,
      };
    }),

  addScene: () =>
    set((state) => {
      const nextIndex = state.project.scenes.length;
      const element = makeTextElement(0, {
        id: `scene-${nextIndex + 1}-headline`,
        content: `SCENE ${nextIndex + 1}`,
      });
      const nextScene = {
        id: `scene-${Date.now()}`,
        name: `Scene ${nextIndex + 1}`,
        durationInSeconds: 4,
        backgroundPresetId: "ink" as const,
        elements: [element],
      };
      return {
        project: { ...state.project, scenes: [...state.project.scenes, nextScene] },
        activeSceneIndex: nextIndex,
        currentTime: 0,
        isPlaying: false,
        selectedElementId: element.id,
        replayKey: state.replayKey + 1,
      };
    }),

  duplicateScene: () =>
    set((state) => {
      const source = state.project.scenes[state.activeSceneIndex];
      const copyIndex = state.activeSceneIndex + 1;
      const copiedElements = source.elements.map((element, index) => ({
        ...element,
        id: `${element.id}-copy-${Date.now()}-${index}`,
      }));
      const copy = {
        ...source,
        id: `${source.id}-copy-${Date.now()}`,
        name: `${source.name} Copy`,
        elements: copiedElements,
      };
      const scenes = [...state.project.scenes];
      scenes.splice(copyIndex, 0, copy);
      return {
        project: { ...state.project, scenes },
        activeSceneIndex: copyIndex,
        currentTime: 0,
        isPlaying: false,
        selectedElementId: copiedElements[0]?.id ?? null,
        replayKey: state.replayKey + 1,
      };
    }),

  deleteScene: () =>
    set((state) => {
      if (state.project.scenes.length === 1) return state;
      const scenes = state.project.scenes.filter((_, index) => index !== state.activeSceneIndex);
      const nextIndex = Math.min(state.activeSceneIndex, scenes.length - 1);
      return {
        project: { ...state.project, scenes },
        activeSceneIndex: nextIndex,
        currentTime: 0,
        isPlaying: false,
        selectedElementId: scenes[nextIndex].elements[0]?.id ?? null,
        replayKey: state.replayKey + 1,
      };
    }),

  addTextElement: () =>
    set((state) => {
      const scene = state.project.scenes[state.activeSceneIndex];
      const element = makeTextElement(scene.elements.length, {
        duration: Math.min(2.5, scene.durationInSeconds),
      });
      return {
        project: {
          ...state.project,
          scenes: state.project.scenes.map((item, index) =>
            index === state.activeSceneIndex
              ? { ...item, elements: [...item.elements, element] }
              : item,
          ),
        },
        selectedElementId: element.id,
        replayKey: state.replayKey + 1,
      };
    }),

  deleteSelectedElement: () =>
    set((state) => {
      if (!state.selectedElementId) return state;
      const scene = state.project.scenes[state.activeSceneIndex];
      if (scene.elements.length <= 1) return state;
      const elements = scene.elements.filter((element) => element.id !== state.selectedElementId);
      return {
        project: {
          ...state.project,
          scenes: state.project.scenes.map((item, index) =>
            index === state.activeSceneIndex ? { ...item, elements } : item,
          ),
        },
        selectedElementId: elements[0]?.id ?? null,
      };
    }),

  setSelectedElement: (selectedElementId) => set({ selectedElementId }),

  setElementTiming: (elementId, startTime, duration) =>
    set((state) => {
      const sceneDuration = state.project.scenes[state.activeSceneIndex].durationInSeconds;
      const safeStart = Math.min(Math.max(0, startTime), Math.max(0, sceneDuration - 0.1));
      const safeDuration = Math.min(Math.max(0.1, duration), sceneDuration - safeStart);
      return {
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene, sceneIndex) =>
            sceneIndex === state.activeSceneIndex
              ? {
                  ...scene,
                  elements: scene.elements.map((element) =>
                    element.id === elementId
                      ? { ...element, startTime: safeStart, duration: safeDuration }
                      : element,
                  ),
                }
              : scene,
          ),
        },
      };
    }),

  setSceneDuration: (duration) =>
    set((state) => {
      const safeDuration = Math.max(1, duration);
      return {
        project: {
          ...state.project,
          scenes: state.project.scenes.map((scene, index) =>
            index === state.activeSceneIndex
              ? {
                  ...scene,
                  durationInSeconds: safeDuration,
                  elements: scene.elements.map((element) => {
                    const safeStart = Math.min(element.startTime, Math.max(0, safeDuration - 0.1));
                    return {
                      ...element,
                      startTime: safeStart,
                      duration: Math.min(element.duration, Math.max(0.1, safeDuration - safeStart)),
                    };
                  }),
                }
              : scene,
          ),
        },
        currentTime: Math.min(state.currentTime, safeDuration),
      };
    }),

  replay: () =>
    set((state) => ({
      replayKey: state.replayKey + 1,
      currentTime: 0,
      isPlaying: false,
    })),
}));
