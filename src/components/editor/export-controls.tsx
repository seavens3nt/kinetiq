"use client";

import { useState } from "react";
import { KinetiqComposition } from "@/components/editor/kinetiq-composition";
import { useEditorStore } from "@/store/editor-store";

export function ExportControls() {
  const project = useEditorStore((state) => state.project);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "kinetiq-project"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportVideo = async () => {
    setError(null);
    setProgress(0);
    try {
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import("@remotion/web-renderer");
      const support = await canRenderMediaOnWeb({ videoCodec: "h264", container: "mp4", width: project.width, height: project.height });
      if (!support.canRender) throw new Error(support.issues.find((issue) => issue.severity === "error")?.message ?? "This browser cannot encode H.264 video.");
      const result = await renderMediaOnWeb({ composition: { id: "KinetiqProject", component: KinetiqComposition, width: project.width, height: project.height, fps: project.fps, durationInFrames: Math.ceil(project.scenes[0].durationInSeconds * project.fps), defaultProps: { project } }, inputProps: { project }, container: "mp4", videoCodec: "h264", audioCodec: "aac", videoBitrate: "high", audioBitrate: "high", allowHtmlInCanvas: true, onProgress: ({ progress: next }) => setProgress(next) });
      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "kinetiq-video"}.mp4`;
      link.click();
      URL.revokeObjectURL(url);
      setProgress(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video export failed.");
      setProgress(null);
    }
  };

  return <div className="relative flex items-center gap-1.5"><button type="button" onClick={exportProject} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/45 hover:text-white">Project</button><button type="button" disabled={progress !== null} onClick={exportVideo} className="min-w-[70px] rounded-full bg-[#D7FF45] px-3 py-1.5 text-[10px] font-bold text-[#0B0B0F] disabled:opacity-60">{progress === null ? "Export MP4" : `${Math.round(progress * 100)}%`}</button>{error ? <div role="alert" className="absolute right-0 top-full z-[80] mt-2 w-64 rounded-lg border border-red-400/25 bg-[#211216] p-2 text-[9px] leading-4 text-red-200 shadow-xl">{error}</div> : null}</div>;
}
