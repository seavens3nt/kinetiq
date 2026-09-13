import { AuthProjectControls } from "@/components/auth/auth-project-controls";
import { MotionPlayground } from "@/components/editor/motion-playground";

export default function StudioPage() {
  return (
    <div className="kinetiq-studio-shell relative min-h-screen bg-[#09090c]">
      <MotionPlayground />
      <div className="fixed right-4 top-2.5 z-[90] sm:right-5">
        <AuthProjectControls />
      </div>
    </div>
  );
}
