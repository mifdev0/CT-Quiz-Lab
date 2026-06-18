import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoadingIndicator } from "@/components/route-loading-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "CT Quiz Lab",
  description: "Media pembelajaran interaktif berbasis Computational Thinking untuk siswa SMP."
};

// Neon production berada di Singapore. Menjalankan fungsi di region yang sama
// menghindari perjalanan jaringan lintas benua pada setiap query Prisma.
export const preferredRegion = "sin1";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
