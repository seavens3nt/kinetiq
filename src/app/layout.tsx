import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SupabaseAuthBridge } from "@/components/auth/supabase-auth-bridge";
import "./globals.css";
import "./landing-fixes.css";
import "./theme.css";
import "./editor-v2.css";

export const metadata: Metadata = {
  title: "Kinetiq",
  description: "Motion design without the keyframe learning curve.",
};

const themeScript = `
  try {
    const stored = localStorage.getItem('kinetiq-theme');
    const theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SupabaseAuthBridge />
        {children}
        <div className="fixed bottom-4 right-4 z-[120]">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
