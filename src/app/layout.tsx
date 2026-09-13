import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import "./globals.css";
import "./landing-fixes.css";

export const metadata: Metadata = {
  title: "Kinetiq",
  description: "Motion design without the keyframe learning curve.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        {children}
        <div className="fixed bottom-4 right-4 z-[120]">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
