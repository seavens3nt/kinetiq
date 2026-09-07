import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kinetiq",
  description: "Motion design without the keyframe learning curve.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
