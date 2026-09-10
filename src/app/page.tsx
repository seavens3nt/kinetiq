import { AuthProjectControls } from "@/components/auth/auth-project-controls";
import { MotionPlayground } from "@/components/editor/motion-playground";

export default function Home() {
  return (
    <div className="relative">
      <MotionPlayground />
      <div className="fixed left-1/2 top-3 z-[90] -translate-x-1/2">
        <AuthProjectControls />
      </div>
    </div>
  );
}
