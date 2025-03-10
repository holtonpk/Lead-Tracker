import type {Metadata} from "next";
import {Toaster} from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lead tool",
  description: "a tool for leads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="z-30 relative">
        <div
          style={{
            backgroundColor: "transparent",
            backgroundImage: `radial-gradient(#EDEDF0 1px, transparent 0.4px)`,
            backgroundSize: "10px 10px",
            maskImage: `
      linear-gradient(to bottom , rgba(0, 0, 0, 0.1) 20%, rgba(0, 0, 0, 1) 100%)
    `,
            WebkitMaskImage: `
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 20%, rgba(0, 0, 0, 1) 100%)
    `,
          }}
          className="h-screen w-screen   top-0 left-0 z-bottom fixed"
        ></div>
        <Toaster />

        {children}
      </body>
    </html>
  );
}
