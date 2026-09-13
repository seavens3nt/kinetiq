import { AuthProjectControls } from "@/components/auth/auth-project-controls";
import { MotionPlayground } from "@/components/editor/motion-playground";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#09090c]">
      <MotionPlayground />
      <div className="fixed right-5 top-3 z-[90]">
        <AuthProjectControls />
      </div>
    </div>
  );
}
