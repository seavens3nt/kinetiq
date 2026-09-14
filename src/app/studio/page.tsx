import { PlaybackStartGuard } from "@/components/editor/editor-v2-enhancements";
import { MotionPlayground } from "@/components/editor/motion-playground";

export default function StudioPage() {
  return (
    <div className="kinetiq-studio-shell relative min-h-screen bg-[#09090c]">
      <MotionPlayground />
      <PlaybackStartGuard />
    </div>
  );
}
