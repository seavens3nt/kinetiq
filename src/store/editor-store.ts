"use client";

import { create } from "zustand";
import type {
  BackgroundPresetId,
  MotionPresetId,
  MotionSettings,
  Project,
  SplitBy,
} from "@/lib/project-schema";

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
        {
          id: "headline-1",
          type: "text",
          content: "MAKE IDEAS MOVE.",
          x: 120,
          y: 760,
          width: 840,
          fontSize: 96,
          fontWeight: 800,
          color: "#f7f7f4",
          motionPresetId: "split-rise",
          motionSettings: {
            duration: 0.55,
            stagger: 0.07,
            splitBy: "words",
          },
        },
      ],
    },
  ],
};

type EditorStore = {
  project: Project;
  replayKey: number;
  setHeadline: (content: string) => void;
  setMotionPreset: (presetId: MotionPresetId) => void;
  setMotionDuration: (duration: number) => void;
  setMotionStagger: (stagger: number) => void;
  setSplitBy: (splitBy: SplitBy) => void;
  setBackgroundPreset: (presetId: BackgroundPresetId) => void;
  replay: () => void;
};

function updateHeadlineMotion(
  project: Project,
  updater: (settings: MotionSettings) => MotionSettings,
): Project {
  return {
    ...project,
    scenes: project.scenes.map((scene, index) =>
      index === 0
        ? {
            ...scene,
            elements: scene.elements.map((element, elementIndex) =>
              elementIndex === 0
                ? { ...element, motionSettings: updater(element.motionSettings) }
                : element,
            ),
          }
        : scene,
    ),
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  project: initialProject,
  replayKey: 0,
  setHeadline: (content) =>
    set((state) => ({
      project: {
        ...state.project,
        scenes: state.project.scenes.map((scene, index) =>
          index === 0
            ? {
                ...scene,
                elements: scene.elements.map((element, elementIndex) =>
                  elementIndex === 0 ? { ...element, content } : element,
                ),
              }
            : scene,
        ),
      },
    })),
  setMotionPreset: (motionPresetId) =>
    set((state) => ({
      project: {
        ...state.project,
        scenes: state.project.scenes.map((scene, index) =>
          index === 0
            ? {
                ...scene,
                elements: scene.elements.map((element, elementIndex) =>
                  elementIndex === 0 ? { ...element, motionPresetId } : element,
                ),
              }
            : scene,
        ),
      },
      replayKey: state.replayKey + 1,
    })),
  setMotionDuration: (duration) =>
    set((state) => ({
      project: updateHeadlineMotion(state.project, (settings) => ({ ...settings, duration })),
      replayKey: state.replayKey + 1,
    })),
  setMotionStagger: (stagger) =>
    set((state) => ({
      project: updateHeadlineMotion(state.project, (settings) => ({ ...settings, stagger })),
      replayKey: state.replayKey + 1,
    })),
  setSplitBy: (splitBy) =>
    set((state) => ({
      project: updateHeadlineMotion(state.project, (settings) => ({ ...settings, splitBy })),
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
  replay: () => set((state) => ({ replayKey: state.replayKey + 1 })),
}));
